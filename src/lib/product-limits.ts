// Shared by the product form (maxLength) and the server actions (validation) so they cannot disagree.
export const PRODUCT_LIMITS = {
  name: 120,
  brand: 60,
  model: 60,
  color: 40,
  serialNumber: 64,
  imei: 20,
  salvagedParts: 500,
  notes: 2000,
  search: 100,
  maxQuantity: 100_000,
  // Prisma columns are Decimal(10, 2)
  maxPrice: 99_999_999.99,
} as const;
