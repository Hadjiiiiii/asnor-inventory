"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcryptjs from "bcryptjs";
import { revalidatePath } from "next/cache";
import { PAGE_SIZE } from "@/lib/page-size";

const SESSION_EXPIRED = "Your session has expired. Sign in again to continue.";
const NOT_ADMIN = "Only an admin can manage users.";
const LIMITS = { name: 120, email: 254, passwordMin: 6, passwordMax: 72 } as const;

type UserResult = { error?: string; field?: string; success?: boolean };

interface GetUsersParams {
  page?: number;
  perPage?: number;
}

export async function getUsers(params: GetUsersParams = {}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const { page = 1, perPage = PAGE_SIZE } = params;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.user.count(),
  ]);

  return {
    users,
    total,
    pages: Math.ceil(total / perPage),
    currentPage: page,
  };
}

export async function createUser(formData: FormData): Promise<UserResult> {
  const session = await auth();
  if (!session) return { error: SESSION_EXPIRED };
  if (session.user.role !== "ADMIN") return { error: NOT_ADMIN };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "STAFF";

  if (!name) return { error: "Enter the person's full name", field: "name" };
  if (name.length > LIMITS.name) return { error: `Name must be ${LIMITS.name} characters or fewer`, field: "name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > LIMITS.email) {
    return { error: "Enter an email address like name@example.com", field: "email" };
  }
  if (password.length < LIMITS.passwordMin) {
    return { error: `Password must be at least ${LIMITS.passwordMin} characters`, field: "password" };
  }
  // bcrypt only reads the first 72 bytes; refusing longer input stops a password silently matching a prefix.
  if (new TextEncoder().encode(password).length > LIMITS.passwordMax) {
    return { error: `Password must be ${LIMITS.passwordMax} bytes or fewer`, field: "password" };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: "A user with this email already exists", field: "email" };

    const hashedPassword = await bcryptjs.hash(password, 12);
    await prisma.user.create({ data: { name, email, hashedPassword, role } });
  } catch (e) {
    if ((e as { code?: string } | null)?.code === "P2002") {
      return { error: "A user with this email already exists", field: "email" };
    }
    console.error("Create user failed", e);
    return { error: "Couldn't create the user. Nothing was changed; please try again." };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function deleteUser(userId: string): Promise<UserResult> {
  const session = await auth();
  if (!session) return { error: SESSION_EXPIRED };
  if (session.user.role !== "ADMIN") return { error: NOT_ADMIN };

  // Prevent self-deletion
  if (userId === session.user.id) {
    return { error: "You can't delete your own account." };
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (e) {
    if ((e as { code?: string } | null)?.code === "P2025") {
      return { error: "This user was already deleted." };
    }
    console.error("Delete user failed", e);
    return { error: "Couldn't delete the user. Nothing was changed; please try again." };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function updateUserRole(userId: string, role: "ADMIN" | "STAFF"): Promise<UserResult> {
  const session = await auth();
  if (!session) return { error: SESSION_EXPIRED };
  if (session.user.role !== "ADMIN") return { error: NOT_ADMIN };
  if (role !== "ADMIN" && role !== "STAFF") return { error: "Choose Admin or Staff." };

  // An admin demoting themselves could leave nobody able to manage users.
  if (userId === session.user.id) {
    return { error: "You can't change your own role. Ask another admin to do it." };
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { role } });
  } catch (e) {
    if ((e as { code?: string } | null)?.code === "P2025") {
      return { error: "This user no longer exists." };
    }
    console.error("Update role failed", e);
    return { error: "Couldn't change the role. Nothing was changed; please try again." };
  }

  revalidatePath("/users");
  return { success: true };
}
