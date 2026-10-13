import { PrismaClient, Role, ProductType, Condition, ProductStatus, ContactType, TransactionType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcryptjs from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const hashedPassword = await bcryptjs.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@asnor.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@asnor.com",
      hashedPassword,
      role: Role.ADMIN,
    },
  });

  // Create staff user
  const staffPassword = await bcryptjs.hash("staff123", 12);
  const staff = await prisma.user.upsert({
    where: { email: "staff@asnor.com" },
    update: {},
    create: {
      name: "Staff User",
      email: "staff@asnor.com",
      hashedPassword: staffPassword,
      role: Role.STAFF,
    },
  });

  console.log("✅ Users created:", { admin: admin.email, staff: staff.email });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Phones" },
      update: {},
      create: { name: "Phones" },
    }),
    prisma.category.upsert({
      where: { name: "Tablets" },
      update: {},
      create: { name: "Tablets" },
    }),
    prisma.category.upsert({
      where: { name: "Laptops" },
      update: {},
      create: { name: "Laptops" },
    }),
    prisma.category.upsert({
      where: { name: "Accessories" },
      update: {},
      create: { name: "Accessories" },
    }),
    prisma.category.upsert({
      where: { name: "Smartwatches" },
      update: {},
      create: { name: "Smartwatches" },
    }),
  ]);

  console.log("✅ Categories created:", categories.map((c) => c.name));

  // Create contacts
  const supplier = await prisma.contact.create({
    data: {
      name: "TechSource Wholesale",
      type: ContactType.SUPPLIER,
      phone: "+1-555-0100",
      email: "orders@techsource.com",
      address: "123 Tech Ave, Silicon Valley, CA",
      notes: "Main wholesale supplier for phones and laptops",
    },
  });

  const customer = await prisma.contact.create({
    data: {
      name: "John Doe",
      type: ContactType.CUSTOMER,
      phone: "+1-555-0200",
      email: "john.doe@email.com",
      notes: "Regular customer, prefers iPhones",
    },
  });

  const bothContact = await prisma.contact.create({
    data: {
      name: "Mobile Hub Trading",
      type: ContactType.BOTH,
      phone: "+1-555-0300",
      email: "trade@mobilehub.com",
      address: "456 Commerce St, Downtown",
      notes: "Both buys and sells devices",
    },
  });

  console.log("✅ Contacts created:", [supplier.name, customer.name, bothContact.name]);

  // Create products
  const iPhone = await prisma.product.create({
    data: {
      name: "iPhone 15 Pro Max",
      brand: "Apple",
      model: "A3101",
      type: ProductType.DEVICE,
      categoryId: categories[0].id, // Phones
      condition: Condition.SECONDHAND,
      status: ProductStatus.AVAILABLE,
      serialNumber: "F9GQ3X7KPM",
      imei: "354789102345678",
      purchasePrice: 850.00,
      sellingPrice: 1050.00,
      notes: "256GB, Natural Titanium, no scratches",
    },
  });

  const macbook = await prisma.product.create({
    data: {
      name: "MacBook Pro 14-inch M3",
      brand: "Apple",
      model: "MRX33",
      type: ProductType.DEVICE,
      categoryId: categories[2].id, // Laptops
      condition: Condition.SECONDHAND,
      status: ProductStatus.AVAILABLE,
      serialNumber: "C02ZW1MDLVCG",
      purchasePrice: 1200.00,
      sellingPrice: 1550.00,
      notes: "16GB RAM, 512GB SSD, Space Black. Minor scuff on bottom",
    },
  });

  const galaxy = await prisma.product.create({
    data: {
      name: "Samsung Galaxy S24 Ultra",
      brand: "Samsung",
      model: "SM-S928B",
      type: ProductType.DEVICE,
      categoryId: categories[0].id, // Phones
      condition: Condition.BRAND_NEW,
      status: ProductStatus.AVAILABLE,
      serialNumber: "RZ8T90BWXYZ",
      imei: "356789012345670",
      purchasePrice: 900.00,
      sellingPrice: 1150.00,
      notes: "512GB, Titanium Black, sealed box",
    },
  });

  const usbCables = await prisma.product.create({
    data: {
      name: "USB-C to USB-C Cable (1m)",
      brand: "Anker",
      model: "A8856",
      type: ProductType.ACCESSORY,
      categoryId: categories[3].id, // Accessories
      condition: Condition.BRAND_NEW,
      status: ProductStatus.AVAILABLE,
      quantity: 25,
      lowStockThreshold: 5,
      purchasePrice: 8.00,
      sellingPrice: 15.00,
      notes: "100W PD charging, braided nylon",
    },
  });

  const cases = await prisma.product.create({
    data: {
      name: "iPhone 15 Pro Max Clear Case",
      brand: "Spigen",
      model: "Ultra Hybrid",
      type: ProductType.ACCESSORY,
      categoryId: categories[3].id, // Accessories
      condition: Condition.BRAND_NEW,
      status: ProductStatus.AVAILABLE,
      quantity: 15,
      lowStockThreshold: 3,
      purchasePrice: 5.00,
      sellingPrice: 12.00,
    },
  });

  console.log("✅ Products created:", [iPhone.name, macbook.name, galaxy.name, usbCables.name, cases.name]);

  // Create sample transactions
  await prisma.transaction.create({
    data: {
      type: TransactionType.BUY,
      productId: iPhone.id,
      contactId: supplier.id,
      quantity: 1,
      unitPrice: 850.00,
      totalPrice: 850.00,
      notes: "Purchased from TechSource batch #2024-Q4",
    },
  });

  await prisma.transaction.create({
    data: {
      type: TransactionType.BUY,
      productId: usbCables.id,
      contactId: supplier.id,
      quantity: 25,
      unitPrice: 8.00,
      totalPrice: 200.00,
      notes: "Bulk purchase - 25 units",
    },
  });

  console.log("✅ Transactions created");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Login credentials:");
  console.log("  Admin: admin@asnor.com / admin123");
  console.log("  Staff: staff@asnor.com / staff123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
