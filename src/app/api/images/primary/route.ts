import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { imageId, productId } = await request.json();

    if (!imageId || !productId) {
      return NextResponse.json(
        { error: "Image ID and Product ID are required" },
        { status: 400 }
      );
    }

    // Unset all primary images for this product
    await prisma.productImage.updateMany({
      where: { productId, isPrimary: true },
      data: { isPrimary: false },
    });

    // Set the new primary image
    await prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set primary error:", error);
    return NextResponse.json(
      { error: "Failed to set primary image" },
      { status: 500 }
    );
  }
}
