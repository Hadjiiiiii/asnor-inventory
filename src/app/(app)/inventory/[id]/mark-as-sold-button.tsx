"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CircleDollarSign } from "lucide-react";
import { SaleDialog, type SaleProduct } from "../sale-dialog";

interface MarkAsSoldButtonProps {
  product: SaleProduct;
}

export function MarkAsSoldButton({ product }: MarkAsSoldButtonProps) {
  const [open, setOpen] = useState(false);

  // The page re-renders as soon as a sale lands, flipping the status to Sold. The trigger hides then,
  // but the dialog stays mounted so the result (and Undo) remain on screen until it is dismissed.
  return (
    <>
      {product.status !== "SOLD" && (
        <Button variant="outline" onClick={() => setOpen(true)}>
          <CircleDollarSign className="h-4 w-4" />
          Mark as Sold
        </Button>
      )}

      <SaleDialog open={open} onOpenChange={setOpen} product={product} />
    </>
  );
}
