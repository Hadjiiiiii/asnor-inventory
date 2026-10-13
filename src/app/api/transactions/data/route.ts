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
        brand: true,
        type: true,
        status: true,
        condition: true,
        serialNumber: true,
        imei: true,
        quantity: true,
        sellingPrice: true,
        purchasePrice: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Decimals become numbers so the sale dialog can preview profit without parsing.
  const serializedProducts = products.map((p) => ({
    ...p,
    sellingPrice: p.sellingPrice ? Number(p.sellingPrice) : null,
    purchasePrice: p.purchasePrice ? Number(p.purchasePrice) : null,
  }));

  return NextResponse.json({ products: serializedProducts, contacts });
}
