import "dotenv/config";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { validateBenchmarkTarget } from "../src/lib/benchmark-target";
import {
  BENCHMARK_PRODUCT_COUNT,
  BENCHMARK_TRANSACTION_COUNT,
  buildBenchmarkProducts,
  buildBenchmarkTransactions,
} from "../src/lib/benchmark-data";

dotenv.config({ path: ".env.benchmark.local", quiet: true });

async function seedBenchmark() {
  const benchmarkUrl = validateBenchmarkTarget(
    process.env.BENCHMARK_DATABASE_URL,
    process.env.DATABASE_URL,
    process.env.VERCEL_ENV,
  ).toString();

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: benchmarkUrl }),
  });

  const categoryNames = Array.from(
    { length: 20 },
    (_, index) => `Benchmark Category ${String(index + 1).padStart(2, "0")}`,
  );

  try {
    await prisma.category.createMany({
      data: categoryNames.map((name, index) => ({
        id: `benchmark_category_${String(index + 1).padStart(2, "0")}`,
        name,
      })),
      skipDuplicates: true,
    });

    const categories = await prisma.category.findMany({
      where: { name: { in: categoryNames } },
      select: { id: true },
      orderBy: { name: "asc" },
    });

    if (categories.length !== categoryNames.length) {
      throw new Error("Could not prepare all synthetic benchmark categories.");
    }

    const products = buildBenchmarkProducts(categories.map(({ id }) => id));
    await prisma.product.createMany({ data: products, skipDuplicates: true });

    const productIds = products.map(({ id }) => id);
    const now = new Date();
    const batchSize = 1_000;
    for (let offset = 0; offset < BENCHMARK_TRANSACTION_COUNT; offset += batchSize) {
      const count = Math.min(batchSize, BENCHMARK_TRANSACTION_COUNT - offset);
      const transactions = buildBenchmarkTransactions(offset, count, productIds, now);
      await prisma.transaction.createMany({ data: transactions, skipDuplicates: true });

      if ((offset + count) % 10_000 === 0) {
        console.log(`Prepared ${(offset + count).toLocaleString()} synthetic transactions.`);
      }
    }

    const [productCount, transactionCount] = await Promise.all([
      prisma.product.count({ where: { id: { startsWith: "benchmark_product_" } } }),
      prisma.transaction.count({ where: { id: { startsWith: "benchmark_transaction_" } } }),
    ]);

    if (productCount !== BENCHMARK_PRODUCT_COUNT || transactionCount !== BENCHMARK_TRANSACTION_COUNT) {
      throw new Error("The synthetic benchmark dataset did not reach the expected row counts.");
    }

    console.log(`Ready: ${productCount.toLocaleString()} products and ${transactionCount.toLocaleString()} transactions.`);
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "UnknownError";
    console.error(`Benchmark seeding failed (${errorName}); no connection details were printed.`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void seedBenchmark().catch((error: unknown) => {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  console.error(`Benchmark seeding failed (${errorName}); no connection details were printed.`);
  process.exitCode = 1;
});
