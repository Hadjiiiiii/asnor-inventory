import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [products, contacts] = await Promise.all([
    prisma.product.findMany({
      where: { status: { not: "SOLD" } },
      select: {
        id: true,
        name: true,
        type: true,
        quantity: true,
        sellingPrice: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Convert Decimal to string for JSON serialization
  const serializedProducts = products.map((p) => ({
    ...p,
    sellingPrice: p.sellingPrice?.toString() || null,
  }));

  return NextResponse.json({ products: serializedProducts, contacts });
}
