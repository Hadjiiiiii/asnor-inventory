// Resets the public demo database and fills it with invented shop data (src/lib/demo-data.ts).
// Usage: put DEMO_DATABASE_URL in .env.demo.local, then `npm run demo:push && npm run demo:seed`.
// Safe to rerun, e.g. after demo visitors have changed things.
import "dotenv/config";
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { validateDemoTarget } from "../src/lib/demo-target";
import { buildDemoData } from "../src/lib/demo-data";

dotenv.config({ path: ".env.demo.local", quiet: true });

async function seedDemo() {
  const demoUrl = validateDemoTarget(process.env.DEMO_DATABASE_URL, process.env.DATABASE_URL).toString();
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: demoUrl }) });
  const data = buildDemoData(new Date());

  try {
    const users = await Promise.all(
      data.users.map(async (u) => ({
        name: u.name,
        email: u.email,
        role: u.role,
        hashedPassword: await bcryptjs.hash(u.password, 12),
      })),
    );
    const categoryId = (name: string) => `demo_category_${name.toLowerCase()}`;

    await prisma.$transaction([
      prisma.productImage.deleteMany(),
      prisma.transaction.deleteMany(),
      prisma.product.deleteMany(),
      prisma.contact.deleteMany(),
      prisma.category.deleteMany(),
      prisma.user.deleteMany(),
      prisma.user.createMany({ data: users }),
      prisma.category.createMany({ data: data.categories.map((name) => ({ id: categoryId(name), name })) }),
      prisma.contact.createMany({ data: data.contacts }),
      prisma.product.createMany({
        data: data.products.map(({ category, ...p }) => ({ ...p, categoryId: categoryId(category) })),
      }),
      prisma.transaction.createMany({
        data: data.transactions.map((t) => ({ ...t, createdAt: t.date })),
      }),
    ]);

    console.log(
      `Demo ready: ${data.products.length} products, ${data.transactions.length} transactions, ${data.contacts.length} contacts.`,
    );
    for (const u of data.users) console.log(`  ${u.role}: ${u.email} / ${u.password}`);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemo().catch((error) => {
  console.error(`Demo seeding failed: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
