import { PRODUCT_LIMITS } from "@/lib/product-limits";

/** The parsed, untrusted values of the product form. Numbers may be NaN: they come from parseInt/parseFloat. */
export interface ProductFields {
  name: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  categoryId: string;
  serialNumber: string | null;
  imei: string | null;
  quantity: number;
  lowStockThreshold: number | null;
  purchasePrice: number | null;
  sellingPrice: number | null;
  salvagedParts: string | null;
  notes: string | null;
}

export function formatMoney(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** First problem found, with the id of the input it belongs to, or null when the fields are acceptable. */
export function validateProductFields(f: ProductFields): { error: string; field: string } | null {
  const L = PRODUCT_LIMITS;
  if (!f.name) return { error: "Enter a product name", field: "name" };
  if (f.name.length > L.name) return { error: `Name must be ${L.name} characters or fewer`, field: "name" };
  if (!f.categoryId) return { error: "Choose a category", field: "categoryId" };

  const tooLong: [string, string | null, number, string][] = [
    ["brand", f.brand, L.brand, "Brand"],
    ["model", f.model, L.model, "Model"],
    ["color", f.color, L.color, "Color"],
    ["serialNumber", f.serialNumber, L.serialNumber, "Serial number"],
    ["imei", f.imei, L.imei, "IMEI"],
    ["salvagedParts", f.salvagedParts, L.salvagedParts, "Salvaged parts"],
    ["notes", f.notes, L.notes, "Notes"],
  ];
  for (const [field, value, max, label] of tooLong) {
    if (value && value.length > max) return { error: `${label} must be ${max} characters or fewer`, field };
  }

  for (const [field, value, label] of [
    ["purchasePrice", f.purchasePrice, "Purchase price"],
    ["sellingPrice", f.sellingPrice, "Selling price"],
  ] as const) {
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > L.maxPrice)) {
      return { error: `${label} must be between 0 and ${formatMoney(L.maxPrice)}`, field };
    }
  }

  if (f.quantity > L.maxQuantity) {
    return { error: `Quantity can't be more than ${L.maxQuantity.toLocaleString("en-US")}`, field: "quantity" };
  }
  if (f.lowStockThreshold !== null && (!Number.isInteger(f.lowStockThreshold) || f.lowStockThreshold < 0 || f.lowStockThreshold > L.maxQuantity)) {
    return { error: "Low stock threshold must be a whole number of 0 or more", field: "lowStockThreshold" };
  }
  return null;
}
