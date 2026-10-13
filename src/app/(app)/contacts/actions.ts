"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PAGE_SIZE } from "@/lib/page-size";
import { ContactType } from "@/generated/prisma/client";
import { readContactForm, validateContactFields } from "@/lib/contact-validation";

const SESSION_EXPIRED = "Your session has expired. Sign in again to continue.";

type ContactResult = { error?: string; field?: string; success?: boolean; id?: string };

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

  const { search, type, page = 1, perPage = PAGE_SIZE } = params;

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

export async function createContact(formData: FormData): Promise<ContactResult> {
  const session = await auth();
  if (!session) return { error: SESSION_EXPIRED };

  const fields = readContactForm(formData);
  const problem = validateContactFields(fields);
  if (problem) return problem;

  try {
    const contact = await prisma.contact.create({
      data: { ...fields, type: fields.type as ContactType },
    });
    revalidatePath("/contacts");
    return { success: true, id: contact.id };
  } catch (e) {
    console.error("Create contact failed", e);
    return { error: "Couldn't save the contact. Nothing was changed; please try again." };
  }
}

export async function updateContact(id: string, formData: FormData): Promise<ContactResult> {
  const session = await auth();
  if (!session) return { error: SESSION_EXPIRED };

  const fields = readContactForm(formData);
  const problem = validateContactFields(fields);
  if (problem) return problem;

  try {
    await prisma.contact.update({
      where: { id },
      data: { ...fields, type: fields.type as ContactType },
    });
  } catch (e) {
    if ((e as { code?: string } | null)?.code === "P2025") {
      return { error: "This contact no longer exists. It may have been deleted by someone else." };
    }
    console.error("Update contact failed", e);
    return { error: "Couldn't save the changes. Nothing was changed; please try again." };
  }

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${id}`);
  return { success: true };
}

export async function deleteContact(id: string): Promise<ContactResult> {
  const session = await auth();
  if (!session) return { error: SESSION_EXPIRED };

  try {
    // The foreign key is the real guard: a sale recorded between a pre-check and the delete still can't orphan it.
    await prisma.contact.delete({ where: { id } });
  } catch (e) {
    const code = (e as { code?: string } | null)?.code;
    if (code === "P2003") {
      return { error: "This contact has transaction history, so it can't be deleted." };
    }
    if (code === "P2025") {
      return { error: "This contact was already deleted." };
    }
    console.error("Delete contact failed", e);
    return { error: "Couldn't delete the contact. Nothing was changed; please try again." };
  }

  revalidatePath("/contacts");
  return { success: true };
}
