"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ContactType } from "@/generated/prisma/client";

export type ContactWithTransactionCount = Awaited<ReturnType<typeof getContacts>>["contacts"][number];

interface GetContactsParams {
  search?: string;
  type?: string;
  page?: number;
  perPage?: number;
}

export async function getContacts(params: GetContactsParams = {}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { search, type, page = 1, perPage = 20 } = params;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (type) where.type = type;

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        _count: { select: { transactions: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.contact.count({ where }),
  ]);

  return {
    contacts,
    total,
    pages: Math.ceil(total / perPage),
    currentPage: page,
  };
}

export async function getContact(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      transactions: {
        include: { product: true },
        orderBy: { date: "desc" },
        take: 20,
      },
    },
  });

  if (!contact) return null;

  // Serialize Decimal fields for Client Component compatibility
  return {
    ...contact,
    transactions: contact.transactions.map((tx) => ({
      ...tx,
      unitPrice: Number(tx.unitPrice),
      totalPrice: Number(tx.totalPrice),
      profit: tx.profit ? Number(tx.profit) : null,
      product: {
        ...tx.product,
        purchasePrice: tx.product.purchasePrice ? Number(tx.product.purchasePrice) : null,
        sellingPrice: tx.product.sellingPrice ? Number(tx.product.sellingPrice) : null,
      },
    })),
  };
}

function getContactFormFields(formData: FormData) {
  return {
    name: formData.get("name") as string,
    type: formData.get("type") as ContactType,
    phone: (formData.get("phone") as string) || null,
    email: (formData.get("email") as string) || null,
    address: (formData.get("address") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };
}

export async function createContact(formData: FormData): Promise<{ error?: string; success?: boolean; id?: string }> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { name, type, phone, email, address, notes } = getContactFormFields(formData);

  if (!name) {
    return { error: "Name is required" };
  }

  const contact = await prisma.contact.create({
    data: {
      name,
      type: type || ContactType.CUSTOMER,
      phone,
      email,
      address,
      notes,
    },
  });

  revalidatePath("/contacts");
  return { success: true, id: contact.id };
}

export async function updateContact(id: string, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { name, type, phone, email, address, notes } = getContactFormFields(formData);

  if (!name) {
    return { error: "Name is required" };
  }

  await prisma.contact.update({
    where: { id },
    data: { name, type, phone, email, address, notes },
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  return { success: true };
}

export async function deleteContact(id: string): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  // Check for linked transactions
  const txCount = await prisma.transaction.count({ where: { contactId: id } });
  if (txCount > 0) {
    return { error: "Cannot delete a contact with transaction history" };
  }

  await prisma.contact.delete({ where: { id } });
  revalidatePath("/contacts");
  return { success: true };
}
