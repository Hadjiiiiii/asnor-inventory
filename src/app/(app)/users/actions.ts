"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcryptjs from "bcryptjs";
import { revalidatePath } from "next/cache";

interface GetUsersParams {
  page?: number;
  perPage?: number;
}

export async function getUsers(params: GetUsersParams = {}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const { page = 1, perPage = 20 } = params;

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

export async function createUser(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "STAFF";

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "A user with this email already exists" };
  }

  const hashedPassword = await bcryptjs.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      role: role || "STAFF",
    },
  });

  revalidatePath("/users");
  return { success: true };
}

export async function deleteUser(userId: string): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  // Prevent self-deletion
  if (userId === session.user.id) {
    return { error: "Cannot delete your own account" };
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/users");
  return { success: true };
}

export async function updateUserRole(userId: string, role: "ADMIN" | "STAFF"): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/users");
  return { success: true };
}
