"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { markProductAsSold } from "./actions";

interface MarkAsSoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  defaultPrice: number | null;
  /** Set for quantity-based accessories: one unit is sold per confirmation. */
  unitsInStock?: number;
  /** Called after the sale is recorded; the caller closes or refreshes as its page needs. */
  onSold: () => void;
}

/** Shared by the inventory list and the product page so the sale flow behaves identically in both. */
export function MarkAsSoldDialog({ open, onOpenChange, ...form }: MarkAsSoldDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Mark as Sold</DialogTitle>
        </DialogHeader>
        {/* Mounts fresh on every open, so the price and any error start clean */}
        <SoldForm {...form} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function SoldForm({
  productId,
  productName,
  defaultPrice,
  unitsInStock,
  onSold,
  onCancel,
}: Omit<MarkAsSoldDialogProps, "open" | "onOpenChange"> & { onCancel: () => void }) {
  const { addToast } = useToast();
  const priceId = useId();
  const errorId = useId();
  const [price, setPrice] = useState(defaultPrice ? String(defaultPrice) : "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;

    const parsed = parseFloat(price);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Enter a sale price of 0 or more");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await markProductAsSold(productId, parsed, 1);
      if (result.error) {
        setError(result.error);
        return;
      }
      addToast(`${productName} marked as sold`, "success");
      onSold();
    } catch {
      setError("We couldn't reach the server. The sale wasn't recorded; check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Confirm the final sale price for <span className="font-medium text-foreground">{productName}</span>.
        This can differ from the listed price if the customer negotiated.
        {unitsInStock !== undefined && <> One unit is sold; {unitsInStock} in stock.</>}
      </p>
      <div className="space-y-2">
        <Label htmlFor={priceId}>Sold For ($)</Label>
        <Input
          id={priceId}
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          autoFocus
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {error && (
          <p id={errorId} role="alert" className="text-sm text-destructive">{error}</p>
        )}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Confirm Sale"}
        </Button>
      </div>
    </form>
  );
}
