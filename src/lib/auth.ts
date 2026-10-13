import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// A login token outlives the account's role or existence (30 days by default), so re-read both.
// A short per-instance cache keeps this to about one lookup a minute per person.
const FRESH_MS = 60_000;
const lastSeen = new Map<string, { role: string | null; at: number }>();

async function currentRole(id: string) {
  const hit = lastSeen.get(id);
  if (hit && Date.now() - hit.at < FRESH_MS) return hit.role;
  const row = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  lastSeen.set(id, { role: row?.role ?? null, at: Date.now() });
  return row?.role ?? null;
}

/** Called after a role change or deletion so this instance stops trusting the old answer at once. */
export function forgetUser(id: string) {
  lastSeen.delete(id);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isValid = await bcryptjs.compare(password, user.hashedPassword);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        return token;
      }
      if (!token.id) return token;
      const role = await currentRole(token.id as string);
      // Account deleted: ending the token signs the person out of every action and page.
      if (!role) return null;
      token.role = role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
