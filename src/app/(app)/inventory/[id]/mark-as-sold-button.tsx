"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CircleDollarSign } from "lucide-react";
import { MarkAsSoldDialog } from "../mark-as-sold-dialog";

interface MarkAsSoldButtonProps {
  productId: string;
  productName: string;
  defaultPrice: number | null;
  /** Set for quantity-based accessories: one unit is sold per confirmation. */
  unitsInStock?: number;
}

export function MarkAsSoldButton({ productId, productName, defaultPrice, unitsInStock }: MarkAsSoldButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <CircleDollarSign className="h-4 w-4" />
        Mark as Sold
      </Button>

      <MarkAsSoldDialog
        open={open}
        onOpenChange={setOpen}
        productId={productId}
        productName={productName}
        defaultPrice={defaultPrice}
        unitsInStock={unitsInStock}
        onSold={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
