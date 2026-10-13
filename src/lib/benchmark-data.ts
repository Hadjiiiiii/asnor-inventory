import { Condition, ProductStatus, ProductType, TransactionType } from "../generated/prisma/client";

export const BENCHMARK_PRODUCT_COUNT = 1_000;
export const BENCHMARK_TRANSACTION_COUNT = 100_000;

export function buildBenchmarkProducts(categoryIds: string[]) {
  if (categoryIds.length === 0) throw new Error("At least one benchmark category is required.");

  const brands = ["Apple", "Samsung", "Google", "Motorola", "Xiaomi"];

  return Array.from({ length: BENCHMARK_PRODUCT_COUNT }, (_, index) => ({
    id: `benchmark_product_${String(index + 1).padStart(4, "0")}`,
    name: `Benchmark Device ${String(index + 1).padStart(4, "0")}`,
    brand: brands[index % brands.length],
    model: `Model ${index % 40 + 1}`,
    color: ["Black", "Silver", "Blue", "White"][index % 4],
    type: index % 8 === 0 ? ProductType.ACCESSORY : ProductType.DEVICE,
    categoryId: categoryIds[index % categoryIds.length],
    condition: Condition.BRAND_NEW,
    status: ProductStatus.AVAILABLE,
    quantity: index % 8 === 0 ? 10 : 1,
    purchasePrice: 800 + index % 500,
    sellingPrice: 1_000 + index % 1_000,
  }));
}

export function buildBenchmarkTransactions(
  offset: number,
  count: number,
  productIds: string[],
  now: Date,
) {
  if (productIds.length === 0) throw new Error("At least one benchmark product is required.");

  const day = 24 * 60 * 60 * 1_000;
  const hour = 60 * 60 * 1_000;

  return Array.from({ length: count }, (_, batchIndex) => {
    const index = offset + batchIndex;
    const quantity = index % 3 + 1;
    const unitPrice = 1_000 + index % 500;
    const totalPrice = unitPrice * quantity;

    return {
      id: `benchmark_transaction_${String(index + 1).padStart(6, "0")}`,
      type: TransactionType.SELL,
      date: new Date(now.getTime() - ((index * 37) % 180) * day - ((index * 79) % 24) * hour),
      productId: productIds[index % productIds.length],
      quantity,
      unitPrice,
      totalPrice,
      profit: Math.round(totalPrice * ((index % 20) + 5) / 100),
    };
  });
}
