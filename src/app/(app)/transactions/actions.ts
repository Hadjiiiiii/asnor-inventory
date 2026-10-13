"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PAGE_SIZE } from "@/lib/page-size";
import { TransactionType } from "@/generated/prisma/client";

export type TransactionWithRelations = Awaited<ReturnType<typeof getTransactions>>["transactions"][number];

interface GetTransactionsParams {
  search?: string;
  type?: string;
  page?: number;
  perPage?: number;
}

export async function getTransactions(params: GetTransactionsParams = {}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { search, type, page = 1, perPage = PAGE_SIZE } = params;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { product: { name: { contains: search, mode: "insensitive" } } },
      { contact: { name: { contains: search, mode: "insensitive" } } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  if (type) where.type = type;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, type: true } },
        contact: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.transaction.count({ where }),
  ]);

  const serializedTransactions = transactions.map((tx) => ({
    ...tx,
    unitPrice: Number(tx.unitPrice),
    totalPrice: Number(tx.totalPrice),
    profit: tx.profit ? Number(tx.profit) : null,
  }));

  return {
    transactions: serializedTransactions,
    total,
    pages: Math.ceil(total / perPage),
    currentPage: page,
  };
}

export async function createBuyTransaction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const productId = formData.get("productId") as string;
  const contactId = (formData.get("contactId") as string) || null;
  const quantity = parseInt(formData.get("quantity") as string) || 1;
  const unitPrice = parseFloat(formData.get("unitPrice") as string);
  const notes = (formData.get("notes") as string) || null;
  const dateStr = formData.get("date") as string;

  if (!productId || isNaN(unitPrice)) {
    return { error: "Product and unit price are required" };
  }

  const totalPrice = unitPrice * quantity;
  const date = dateStr ? new Date(dateStr) : new Date();

  // Create the transaction
  await prisma.transaction.create({
    data: {
      type: TransactionType.BUY,
      date,
      productId,
      contactId,
      quantity,
      unitPrice,
      totalPrice,
      notes,
    },
  });

  // Update product purchase price and quantity (for accessories)
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (product) {
    const updateData: Record<string, unknown> = {
      purchasePrice: unitPrice,
    };
    if (product.type === "ACCESSORY") {
      updateData.quantity = product.quantity + quantity;
    }
    await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${productId}`);
  return { success: true };
}
