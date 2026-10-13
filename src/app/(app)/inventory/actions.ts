"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PAGE_SIZE } from "@/lib/page-size";
import { Condition, ProductStatus, ProductType } from "@/generated/prisma/client";
import { PRODUCT_LIMITS } from "@/lib/product-limits";
import { formatMoney, validateProductFields } from "@/lib/product-validation";
import { parseSaleDate, saleProfit, undoBlocker } from "@/lib/sale";

type ActionResult = { error?: string; field?: string; success?: boolean; id?: string };

const SESSION_EXPIRED = "Your session has expired. Sign in again to continue.";

/** Thrown inside a transaction to abort it with a message that is safe to show to the user. */
class SaleError extends Error {}

/** Turns a failed save into something the form can show: a field-level duplicate, or a retryable message. */
function saveFailure(e: unknown): ActionResult {
  if (e instanceof Error && e.message === "Unauthorized") return { error: SESSION_EXPIRED };
  if ((e as { code?: string } | null)?.code === "P2002") {
    // Lost a race with the duplicate checks below: another save took the serial number or IMEI first.
    const target = JSON.stringify((e as { meta?: unknown }).meta ?? "").toLowerCase();
    return target.includes("imei")
      ? { error: "A product with this IMEI already exists", field: "imei" }
      : { error: "A product with this serial number already exists", field: "serialNumber" };
  }
  console.error("Product save failed", e);
  return { error: "Couldn't save the product. Nothing was changed; please try again." };
}

export type ProductWithCategory = Awaited<ReturnType<typeof getProducts>>["products"][number];

function getBatteryHealth(
  formData: FormData,
  brand: string,
  type: ProductType,
): { value: number | null; error?: string } {
  const value = formData.get("batteryHealth");
  if (type !== ProductType.DEVICE || brand.trim().toLowerCase() !== "apple" || value === null || value === "") {
    return { value: null as number | null };
  }

  const batteryHealth = Number(value);
  if (!Number.isInteger(batteryHealth) || batteryHealth < 0 || batteryHealth > 100) {
    return { value: null, error: "Battery health must be a whole number from 0 to 100" };
  }

  return { value: batteryHealth };
}

function getSecondhandChecks(
  formData: FormData,
  brand: string,
  type: ProductType,
  condition: Condition,
) {
  const isSecondhandDevice = type === ProductType.DEVICE && condition === Condition.SECONDHAND;
  const isAppleDevice = isSecondhandDevice && brand.trim().toLowerCase() === "apple";
  const isChecked = (name: string) => formData.get(name) === "on";

  return {
    scratchesMarkings: isSecondhandDevice && isChecked("scratchesMarkings"),
    displayScratches: isSecondhandDevice && isChecked("displayScratches"),
    dents: isSecondhandDevice && isChecked("dents"),
    serviceBattery: isAppleDevice && isChecked("serviceBattery"),
    faceIdNotWorking: isAppleDevice && isChecked("faceIdNotWorking"),
  };
}

function getProductFormFields(formData: FormData) {
  const lowStockThreshold = formData.get("lowStockThreshold");
  const purchasePrice = formData.get("purchasePrice");
  const sellingPrice = formData.get("sellingPrice");
  // 0 is a real stock level (sold out); only a missing or non-numeric value falls back to 1 (devices send none).
  const parsedQuantity = parseInt(formData.get("quantity") as string);

  return {
    name: String(formData.get("name") ?? "").trim(),
    brand: formData.get("brand") as string,
    model: formData.get("model") as string,
    color: (formData.get("color") as string) || null,
    type: formData.get("type") as ProductType,
    categoryId: formData.get("categoryId") as string,
    condition: formData.get("condition") as Condition,
    serialNumber: (formData.get("serialNumber") as string) || null,
    imei: (formData.get("imei") as string) || null,
    quantity: Number.isNaN(parsedQuantity) ? 1 : Math.max(parsedQuantity, 0),
    lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold as string) : null,
    purchasePrice: purchasePrice ? parseFloat(purchasePrice as string) : null,
    sellingPrice: sellingPrice ? parseFloat(sellingPrice as string) : null,
    salvagedParts: (formData.get("salvagedParts") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };
}

interface GetProductsParams {
  search?: string;
  category?: string;
  condition?: string;
  status?: string;
  type?: string;
  page?: number;
  perPage?: number;
  /** price_asc | price_desc | brand | newest (default) */
  sortBy?: string;
}

export async function getProducts(params: GetProductsParams = {}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { search: rawSearch, category, condition, status, type, page: rawPage = 1, perPage = PAGE_SIZE, sortBy } = params;
  // These come straight from the URL: a bad value must degrade to a default, not crash the page.
  const search = rawSearch?.trim().slice(0, PRODUCT_LIMITS.search);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
      { serialNumber: { contains: search, mode: "insensitive" } },
      { imei: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) where.categoryId = category;
  if (condition && (Object.values(Condition) as string[]).includes(condition)) where.condition = condition;
  if (status && (Object.values(ProductStatus) as string[]).includes(status)) where.status = status;
  if (type && (Object.values(ProductType) as string[]).includes(type)) where.type = type;

  const orderBy: Record<string, unknown> =
    sortBy === "price_asc"
      ? { sellingPrice: { sort: "asc", nulls: "last" } }
      : sortBy === "price_desc"
      ? { sellingPrice: { sort: "desc", nulls: "last" } }
      : sortBy === "brand"
      ? { brand: "asc" }
      : { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  const serializedProducts = products.map((p) => ({
      ...p,
      purchasePrice: p.purchasePrice ? Number(p.purchasePrice) : null,
      sellingPrice: p.sellingPrice ? Number(p.sellingPrice) : null,
    }));
  
    return {
      products: serializedProducts,
      total,
      pages: Math.ceil(total / perPage),
      currentPage: page,
    };
}

export async function getProduct(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { isPrimary: "desc" } },
      transactions: {
        include: { contact: true },
        orderBy: { date: "desc" },
        take: 10,
      },
    },
  });

  if (!product) return null;

  // Serialize Decimal fields for Client Component compatibility
  return {
    ...product,
    purchasePrice: product.purchasePrice ? Number(product.purchasePrice) : null,
    sellingPrice: product.sellingPrice ? Number(product.sellingPrice) : null,
    transactions: product.transactions.map((tx) => ({
      ...tx,
      unitPrice: Number(tx.unitPrice),
      totalPrice: Number(tx.totalPrice),
      profit: tx.profit ? Number(tx.profit) : null,
    })),
  };
}

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  try {
    return await createProductImpl(formData);
  } catch (e) {
    return saveFailure(e);
  }
}

async function createProductImpl(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const fields = getProductFormFields(formData);
  const invalid = validateProductFields(fields);
  if (invalid) return invalid;
  const {
    name, brand, model, color, type, categoryId, condition, serialNumber,
    imei, quantity, lowStockThreshold, purchasePrice, sellingPrice, salvagedParts, notes,
  } = fields;

  const batteryHealth = getBatteryHealth(formData, brand || "", type || ProductType.DEVICE);
  if (batteryHealth.error) return { error: batteryHealth.error, field: "batteryHealth" };
  const secondhandChecks = getSecondhandChecks(formData, brand || "", type || ProductType.DEVICE, condition);

  // Check for duplicate serial number
  if (serialNumber) {
    const existing = await prisma.product.findUnique({ where: { serialNumber } });
    if (existing) {
      return { error: "A product with this serial number already exists", field: "serialNumber" };
    }
  }

  // Check for duplicate IMEI
  if (imei) {
    const existing = await prisma.product.findUnique({ where: { imei } });
    if (existing) {
      return { error: "A product with this IMEI already exists", field: "imei" };
    }
  }

  // Condition only applies to units (devices); accessories default to BRAND_NEW.
  const resolvedCondition = type === ProductType.ACCESSORY ? Condition.BRAND_NEW : condition || Condition.BRAND_NEW;

  const product = await prisma.product.create({
    data: {
      name,
      brand: brand || null,
      model: model || null,
      color,
      type: type || ProductType.DEVICE,
      categoryId,
      condition: resolvedCondition,
      serialNumber,
      imei,
      quantity,
      lowStockThreshold,
      purchasePrice,
      sellingPrice,
      batteryHealth: batteryHealth.value,
      ...secondhandChecks,
      salvagedParts: resolvedCondition === Condition.FOR_PARTS ? salvagedParts : null,
      notes,
    },
  });

  revalidatePath("/inventory");
  return { success: true, id: product.id };
}

export async function updateProduct(id: string, formData: FormData): Promise<ActionResult> {
  try {
    return await updateProductImpl(id, formData);
  } catch (e) {
    return saveFailure(e);
  }
}

async function updateProductImpl(id: string, formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const fields = getProductFormFields(formData);
  const invalid = validateProductFields(fields);
  if (invalid) return invalid;
  const {
    name, brand, model, color, type, categoryId, condition, serialNumber,
    imei, quantity, lowStockThreshold, purchasePrice, sellingPrice, salvagedParts, notes,
  } = fields;
  const status = formData.get("status") as ProductStatus;

  const batteryHealth = getBatteryHealth(formData, brand || "", type || ProductType.DEVICE);
  if (batteryHealth.error) return { error: batteryHealth.error, field: "batteryHealth" };
  const secondhandChecks = getSecondhandChecks(formData, brand || "", type || ProductType.DEVICE, condition);

  // Check for duplicate serial number (excluding current product)
  if (serialNumber) {
    const existing = await prisma.product.findFirst({
      where: { serialNumber, id: { not: id } },
    });
    if (existing) {
      return { error: "A product with this serial number already exists", field: "serialNumber" };
    }
  }

  // Check for duplicate IMEI (excluding current product)
  if (imei) {
    const existing = await prisma.product.findFirst({
      where: { imei, id: { not: id } },
    });
    if (existing) {
      return { error: "A product with this IMEI already exists", field: "imei" };
    }
  }

  // Condition only applies to units (devices); accessories default to BRAND_NEW.
  const resolvedCondition = type === ProductType.ACCESSORY ? Condition.BRAND_NEW : condition || Condition.BRAND_NEW;

  await prisma.product.update({
    where: { id },
    data: {
      name,
      brand: brand || null,
      model: model || null,
      color,
      type: type || ProductType.DEVICE,
      categoryId,
      condition: resolvedCondition,
      status: status || ProductStatus.AVAILABLE,
      serialNumber,
      imei,
      quantity,
      lowStockThreshold,
      purchasePrice,
      sellingPrice,
      batteryHealth: batteryHealth.value,
      ...secondhandChecks,
      salvagedParts: resolvedCondition === Condition.FOR_PARTS ? salvagedParts : null,
      notes,
    },
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  return { success: true };
}

export async function deleteProduct(id: string): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session) return { error: SESSION_EXPIRED };

  try {
    // Check if product has transactions
    const transactionCount = await prisma.transaction.count({
      where: { productId: id },
    });

    if (transactionCount > 0) {
      return { error: "Cannot delete a product with transaction history. Mark it as sold instead." };
    }

    await prisma.product.delete({ where: { id } });
  } catch (e) {
    // Includes a sale landing between the check above and the delete (foreign key violation).
    console.error("Product delete failed", e);
    return { error: "Couldn't delete the product. It may have just been sold or removed; refresh and try again." };
  }

  revalidatePath("/inventory");
  return { success: true };
}

export async function createCategory(name: string): Promise<{ error?: string; success?: boolean; id?: string }> {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  if (!name.trim()) {
    return { error: "Category name is required" };
  }

  const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
  if (existing) {
    return { error: "Category already exists" };
  }

  const category = await prisma.category.create({
    data: { name: name.trim() },
  });

  return { success: true, id: category.id };
}

/**
 * Marks a unit (or a quantity of an accessory) as sold at the given final
 * price, which may differ from the listed selling price (e.g. after haggling).
 * Creates a SELL transaction and updates the product's status/quantity.
 */
export interface SaleDetails {
  contactId?: string | null;
  /** YYYY-MM-DD in the seller's timezone; defaults to now. */
  date?: string | null;
  notes?: string | null;
}

/** What the sale dialog needs to show the result and, if asked, reverse the sale exactly. */
export interface SaleReceipt {
  transactionId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  /** Null when the unit's cost was never recorded. */
  profit: number | null;
  previousStatus: "AVAILABLE" | "RESERVED";
  previousSellingPrice: number | null;
}

export async function markProductAsSold(
  id: string,
  soldPrice: number,
  quantity: number = 1,
  details: SaleDetails = {}
): Promise<{ error?: string; success?: boolean; receipt?: SaleReceipt }> {
  const session = await auth();
  if (!session) return { error: SESSION_EXPIRED };

  if (!Number.isFinite(soldPrice) || soldPrice < 0 || soldPrice > PRODUCT_LIMITS.maxPrice) {
    return { error: `Enter a sale price between 0 and ${formatMoney(PRODUCT_LIMITS.maxPrice)}` };
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > PRODUCT_LIMITS.maxQuantity) {
    return { error: "Quantity must be a whole number of at least 1" };
  }

  const contactId = details.contactId || null;
  const notes = details.notes?.trim() || null;
  if (notes && notes.length > PRODUCT_LIMITS.notes) {
    return { error: `Notes must be ${PRODUCT_LIMITS.notes} characters or fewer` };
  }
  let date: Date | undefined;
  if (details.date) {
    const parsed = parseSaleDate(details.date);
    if (!parsed) return { error: "Enter a valid sale date" };
    // A day of slack covers a seller whose timezone is ahead of the server's.
    if (parsed.getTime() > Date.now() + 24 * 60 * 60 * 1000) return { error: "The sale date can't be in the future" };
    date = parsed;
  }

  let receipt: SaleReceipt | undefined;
  const round2 = (n: number) => Math.round(n * 100) / 100;

  try {
    // Sale record and stock change commit together or not at all.
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) throw new SaleError("Product not found");
      if (product.status === ProductStatus.SOLD) throw new SaleError("This product is already marked as sold");
      if (contactId) {
        const contact = await tx.contact.findUnique({ where: { id: contactId }, select: { type: true } });
        if (!contact || contact.type === "SUPPLIER") throw new SaleError("Choose a customer from the list");
      }
      if (product.type === ProductType.ACCESSORY && quantity > product.quantity) {
        throw new SaleError(`Insufficient stock. Only ${product.quantity} available.`);
      }

      // Claim the stock with a conditional write so two people confirming at once cannot both succeed.
      const claimed =
        product.type === ProductType.DEVICE
          ? await tx.product.updateMany({
              where: { id, status: { not: ProductStatus.SOLD } },
              data: { status: ProductStatus.SOLD, sellingPrice: soldPrice },
            })
          : await tx.product.updateMany({
              where: { id, quantity: { gte: quantity } },
              data: { quantity: { decrement: quantity }, sellingPrice: soldPrice },
            });
      if (claimed.count === 0) {
        throw new SaleError("This item was just sold or changed by someone else. Refresh to see its current state.");
      }

      // Only an emptied shelf changes status; a reserved pack stays reserved while units remain.
      if (product.type === ProductType.ACCESSORY && product.quantity - quantity === 0) {
        await tx.product.update({ where: { id }, data: { status: ProductStatus.SOLD } });
      }

      const purchasePrice = product.purchasePrice ? Number(product.purchasePrice) : null;
      const profit = saleProfit(soldPrice, purchasePrice, quantity);
      const created = await tx.transaction.create({
        data: {
          type: "SELL",
          productId: id,
          contactId,
          ...(date && { date }),
          quantity,
          unitPrice: soldPrice,
          totalPrice: round2(soldPrice * quantity),
          profit,
          notes,
        },
      });

      receipt = {
        transactionId: created.id,
        productName: product.name,
        quantity,
        unitPrice: soldPrice,
        totalPrice: round2(soldPrice * quantity),
        profit,
        previousStatus: product.status === ProductStatus.RESERVED ? "RESERVED" : "AVAILABLE",
        previousSellingPrice: product.sellingPrice ? Number(product.sellingPrice) : null,
      };
    });
  } catch (e) {
    if (e instanceof SaleError) return { error: e.message };
    console.error("Mark as sold failed", e);
    return { error: "Couldn't record the sale. Nothing was changed; please try again." };
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true, receipt };
}

/**
 * Reverses a sale made moments ago: puts the unit (or accessory stock) back exactly as it was and removes
 * the transaction. Refuses once anything else has been recorded for the product or the window has passed.
 */
export async function undoSale(
  transactionId: string,
  previous: { status: "AVAILABLE" | "RESERVED"; sellingPrice: number | null }
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth();
  if (!session) return { error: SESSION_EXPIRED };

  const validStatus = previous.status === "AVAILABLE" || previous.status === "RESERVED";
  const validPrice =
    previous.sellingPrice === null ||
    (Number.isFinite(previous.sellingPrice) && previous.sellingPrice >= 0 && previous.sellingPrice <= PRODUCT_LIMITS.maxPrice);
  if (!transactionId || !validStatus || !validPrice) return { error: "This sale can't be undone from here." };

  let productId = "";
  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.transaction.findUnique({ where: { id: transactionId }, include: { product: true } });
      if (!sale || sale.type !== "SELL") throw new SaleError("This sale was already undone or can't be found.");
      productId = sale.productId;

      const latest = await tx.transaction.findFirst({
        where: { productId: sale.productId },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      const blocked = undoBlocker(sale, latest?.id);
      if (blocked) throw new SaleError(blocked);

      // Deleting by id inside the transaction means two people pressing Undo cannot both restore stock.
      const removed = await tx.transaction.deleteMany({ where: { id: sale.id } });
      if (removed.count === 0) throw new SaleError("This sale was already undone.");

      if (sale.product.type === ProductType.DEVICE) {
        const restored = await tx.product.updateMany({
          where: { id: sale.productId, status: ProductStatus.SOLD },
          data: { status: previous.status, sellingPrice: previous.sellingPrice },
        });
        if (restored.count === 0) throw new SaleError("This product has changed since the sale, so it can't be undone.");
      } else {
        await tx.product.update({
          where: { id: sale.productId },
          data: {
            quantity: { increment: sale.quantity },
            status: previous.status,
            sellingPrice: previous.sellingPrice,
          },
        });
      }
    });
  } catch (e) {
    if (e instanceof SaleError) return { error: e.message };
    console.error("Undo sale failed", e);
    return { error: "Couldn't undo the sale. Nothing was changed; please try again." };
  }

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${productId}`);
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  return { success: true };
}
