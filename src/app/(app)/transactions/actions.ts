"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PAGE_SIZE } from "@/lib/page-size";
import { TransactionType } from "@/generated/prisma/client";
import { PRODUCT_LIMITS } from "@/lib/product-limits";
import { formatMoney } from "@/lib/product-validation";
import { parseSaleDate } from "@/lib/sale";

/** Thrown inside the transaction to abort it with a message that is safe to show to the user. */
class PurchaseError extends Error {}

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
  if (!session) return { error: "Your session has expired. Sign in again to continue." };

  const productId = String(formData.get("productId") ?? "");
  const contactId = String(formData.get("contactId") ?? "") || null;
  const quantity = parseInt(String(formData.get("quantity") ?? ""), 10);
  const unitPrice = parseFloat(String(formData.get("unitPrice") ?? ""));
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const dateStr = String(formData.get("date") ?? "");

  if (!productId) return { error: "Choose the product that was bought" };
  if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > PRODUCT_LIMITS.maxPrice) {
    return { error: `Enter a unit price between 0 and ${formatMoney(PRODUCT_LIMITS.maxPrice)}` };
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > PRODUCT_LIMITS.maxQuantity) {
    return { error: "Quantity must be a whole number of at least 1" };
  }
  if (notes && notes.length > PRODUCT_LIMITS.notes) {
    return { error: `Notes must be ${PRODUCT_LIMITS.notes} characters or fewer` };
  }
  let date: Date | undefined;
  if (dateStr) {
    const parsed = parseSaleDate(dateStr);
    if (!parsed) return { error: "Enter a valid purchase date" };
    if (parsed.getTime() > Date.now() + 24 * 60 * 60 * 1000) return { error: "The purchase date can't be in the future" };
    date = parsed;
  }

  try {
    // The purchase record and the product's new cost and stock commit together or not at all.
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId }, select: { type: true } });
      if (!product) throw new PurchaseError("Product not found");
      if (contactId) {
        const contact = await tx.contact.findUnique({ where: { id: contactId }, select: { type: true } });
        if (!contact || contact.type === "CUSTOMER") throw new PurchaseError("Choose a supplier from the list");
      }

      await tx.transaction.create({
        data: {
          type: TransactionType.BUY,
          ...(date && { date }),
          productId,
          contactId,
          quantity,
          unitPrice,
          totalPrice: Math.round(unitPrice * quantity * 100) / 100,
          notes,
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          purchasePrice: unitPrice,
          // Accessories are counted; a device purchase only records its cost.
          ...(product.type === "ACCESSORY" && { quantity: { increment: quantity } }),
        },
      });
    });
  } catch (e) {
    if (e instanceof PurchaseError) return { error: e.message };
    console.error("Record purchase failed", e);
    return { error: "Couldn't record the purchase. Nothing was changed; please try again." };
  }

  revalidatePath("/transactions");
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${productId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
