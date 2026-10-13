import assert from "node:assert/strict";
import { test } from "node:test";
import { buildBenchmarkProducts, buildBenchmarkTransactions } from "./benchmark-data";

test("builds the planned synthetic inventory and reproducible sales rows", () => {
  const products = buildBenchmarkProducts(["category-a", "category-b"]);

  assert.equal(products.length, 1_000);
  assert.equal(products[0].id, "benchmark_product_0001");
  assert.equal(products[999].id, "benchmark_product_1000");
  assert.ok(products.every((product) => product.categoryId === "category-a" || product.categoryId === "category-b"));
  assert.throws(() => buildBenchmarkProducts([]));

  const now = new Date("2025-01-03T12:00:00.000Z");
  assert.throws(() => buildBenchmarkTransactions(0, 1, [], now));
  const transactions = buildBenchmarkTransactions(
    0,
    2,
    [products[0].id, products[1].id],
    now,
  );

  assert.deepEqual(transactions, [
    {
      id: "benchmark_transaction_000001",
      type: "SELL",
      date: new Date("2025-01-03T12:00:00.000Z"),
      productId: "benchmark_product_0001",
      quantity: 1,
      unitPrice: 1_000,
      totalPrice: 1_000,
      profit: 50,
    },
    {
      id: "benchmark_transaction_000002",
      type: "SELL",
      date: new Date("2024-11-27T05:00:00.000Z"),
      productId: "benchmark_product_0002",
      quantity: 2,
      unitPrice: 1_001,
      totalPrice: 2_002,
      profit: 120,
    },
  ]);
});
