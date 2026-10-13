import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// This is a lightweight auth config for Edge runtime (middleware).
// It only validates the JWT session — actual credential validation
// happens in the full auth.ts which uses Prisma (Node.js runtime).
export const { auth: authMiddleware } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // This authorize function is never called from middleware;
      // middleware only reads the JWT. But we need it for config.
      async authorize() {
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
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
