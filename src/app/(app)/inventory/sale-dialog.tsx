"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { conditionLabels, statusLabels } from "@/lib/product-labels";
import { PRODUCT_LIMITS } from "@/lib/product-limits";
import { localDateString, matchProducts, saleProfit } from "@/lib/sale";
import { cn, formatCurrency } from "@/lib/utils";
import { markProductAsSold, undoSale, type SaleReceipt } from "./actions";

export interface SaleProduct {
  id: string;
  name: string;
  brand?: string | null;
  type: string;
  status: string;
  condition: string;
  serialNumber: string | null;
  imei: string | null;
  quantity: number;
  sellingPrice: number | null;
  purchasePrice: number | null;
}

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sell this unit. Without it the person finds one by name, serial number or IMEI first. */
  product?: SaleProduct;
}

interface Contact {
  id: string;
  name: string;
  type: string;
}

const SAVE_FAILED = "We couldn't reach the server. The sale wasn't recorded; check your connection and try again.";
const UNDO_FAILED = "We couldn't reach the server. The sale is still recorded; check your connection and try again.";

/**
 * The one way to sell. Opened from an inventory row or the product page with the unit already chosen,
 * or from Transactions with a product search first; both record the sale the same way.
 */
export function SaleDialog({ open, onOpenChange, product }: SaleDialogProps) {
  // Escape, the backdrop and the close button must not abandon a request that is still in flight.
  const busy = useRef(false);
  // Bumped by "Sell another" so the flow starts clean and re-reads current stock.
  const [round, setRound] = useState(0);

  const requestClose = useCallback(
    (next: boolean) => {
      if (!next && busy.current) return;
      onOpenChange(next);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={requestClose}>
      <DialogContent onClose={() => requestClose(false)} className="max-w-md">
        <SaleFlow
          key={round}
          product={product}
          onBusyChange={(value) => {
            busy.current = value;
          }}
          onClose={() => requestClose(false)}
          onAnother={() => setRound((n) => n + 1)}
        />
      </DialogContent>
    </Dialog>
  );
}

type Phase = "form" | "sold" | "undone";

function SaleFlow({
  product,
  onBusyChange,
  onClose,
  onAnother,
}: {
  product?: SaleProduct;
  onBusyChange: (busy: boolean) => void;
  onClose: () => void;
  onAnother: () => void;
}) {
  const priceId = useId();
  const quantityId = useId();
  const errorId = useId();
  const customerId = useId();
  const dateId = useId();
  const notesId = useId();
  const detailsId = useId();
  const summaryId = useId();
  const priceRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("form");
  const [selected, setSelected] = useState<SaleProduct | null>(product ?? null);
  const [price, setPrice] = useState(product?.sellingPrice ? String(product.sellingPrice) : "");
  const [quantity, setQuantity] = useState("1");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [contactId, setContactId] = useState("");
  const [date, setDate] = useState(() => localDateString());
  const [notes, setNotes] = useState("");
  const [lossConfirmed, setLossConfirmed] = useState(false);
  const [error, setError] = useState<{ message: string; field?: "product" | "price" | "quantity" } | null>(null);
  const [working, setWorking] = useState(false);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [undoError, setUndoError] = useState<string | null>(null);

  const isAccessory = selected?.type === "ACCESSORY";
  const hasDetails = contactId !== "" || notes.trim() !== "" || date !== localDateString();
  const showDetails = detailsOpen || hasDetails;
  const data = useSaleData(!product || showDetails);

  const unitPrice = price.trim() === "" ? NaN : Number(price);
  const units = isAccessory ? Number(quantity) : 1;
  const profit =
    selected && Number.isFinite(unitPrice) && unitPrice >= 0 && Number.isInteger(units) && units >= 1
      ? saleProfit(unitPrice, selected.purchasePrice, units)
      : null;
  const belowCost = profit !== null && profit < 0;

  // After a result appears, put focus on it so keyboard and screen-reader users land on the outcome.
  useEffect(() => {
    if (phase !== "form") panelRef.current?.focus();
  }, [phase]);

  function choose(next: SaleProduct) {
    setSelected(next);
    setPrice(next.sellingPrice ? String(next.sellingPrice) : "");
    setQuantity("1");
    setLossConfirmed(false);
    setError(null);
    // The price field mounts with this render; focus it once it exists.
    setTimeout(() => priceRef.current?.focus(), 0);
  }

  function setBusy(value: boolean) {
    onBusyChange(value);
    setWorking(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (working) return;

    if (!selected) {
      setError({ message: "Choose the product being sold", field: "product" });
      return;
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > PRODUCT_LIMITS.maxPrice) {
      setError({ message: "Enter the price it sold for, 0 or more", field: "price" });
      priceRef.current?.focus();
      return;
    }
    if (isAccessory && (!Number.isInteger(units) || units < 1 || units > selected.quantity)) {
      setError({
        message: selected.quantity > 0 ? `Enter a quantity from 1 to ${selected.quantity}` : "This item is out of stock",
        field: "quantity",
      });
      return;
    }
    // Selling at a loss is allowed, but never by accident: the first press only asks.
    if (belowCost && !lossConfirmed) {
      setLossConfirmed(true);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await markProductAsSold(selected.id, unitPrice, units, {
        contactId: contactId || null,
        // Left out when untouched so the sale is stamped with the moment it happened.
        date: date !== localDateString() ? date : null,
        notes: notes.trim() || null,
      });
      if (result.error) {
        setError({ message: result.error });
        return;
      }
      setReceipt(result.receipt ?? null);
      setPhase("sold");
    } catch {
      setError({ message: SAVE_FAILED });
    } finally {
      setBusy(false);
    }
  }

  async function handleUndo() {
    if (!receipt || working) return;
    setBusy(true);
    setUndoError(null);
    try {
      const result = await undoSale(receipt.transactionId, {
        status: receipt.previousStatus,
        sellingPrice: receipt.previousSellingPrice,
      });
      if (result.error) {
        setUndoError(result.error);
        return;
      }
      setPhase("undone");
    } catch {
      setUndoError(UNDO_FAILED);
    } finally {
      setBusy(false);
    }
  }

  if (phase === "sold") {
    const lossAmount = receipt?.profit !== null && receipt && receipt.profit < 0 ? -receipt.profit : null;
    return (
      <>
        <DialogHeader>
          <DialogTitle>Sale recorded</DialogTitle>
        </DialogHeader>
        <div ref={panelRef} tabIndex={-1} role="group" aria-labelledby={summaryId} className="space-y-4 focus:outline-none">
          <div className="space-y-1">
            <p id={summaryId} className="text-sm">
              <span className="font-medium">{receipt?.productName ?? selected?.name}</span>
              {receipt && (
                <>
                  {" "}
                  sold for <span className="font-medium">{formatCurrency(receipt.totalPrice)}</span>
                  {receipt.quantity > 1 && <> ({receipt.quantity} × {formatCurrency(receipt.unitPrice)})</>}
                </>
              )}
            </p>
            {receipt && (
              <p
                className={cn(
                  "text-lg font-semibold",
                  receipt.profit === null && "text-base font-normal text-muted-foreground",
                  receipt.profit !== null && receipt.profit >= 0 && "text-success-ink",
                  lossAmount !== null && "text-destructive",
                )}
              >
                {receipt.profit === null && "Cost not recorded, so profit is unknown"}
                {receipt.profit !== null && receipt.profit >= 0 && <>Profit {formatCurrency(receipt.profit)}</>}
                {lossAmount !== null && <>Loss {formatCurrency(lossAmount)}</>}
              </p>
            )}
          </div>
          {undoError && (
            <p role="alert" className="text-sm text-destructive">
              {undoError}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3 pt-2">
            {receipt && (
              <Button type="button" variant="outline" onClick={handleUndo} disabled={working}>
                <Undo2 className="h-4 w-4" />
                {working ? "Undoing..." : "Undo sale"}
              </Button>
            )}
            {!product && (
              <Button type="button" variant="outline" onClick={onAnother} disabled={working}>
                Sell another
              </Button>
            )}
            <Button type="button" onClick={onClose} disabled={working}>
              Done
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (phase === "undone") {
    const restored = receipt?.previousStatus === "RESERVED" ? "Reserved" : "Available";
    return (
      <>
        <DialogHeader>
          <DialogTitle>Sale undone</DialogTitle>
        </DialogHeader>
        <div ref={panelRef} tabIndex={-1} className="space-y-4 focus:outline-none">
          <p className="text-sm">
            <span className="font-medium">{receipt?.productName}</span> is back in stock as {restored.toLowerCase()}
            {receipt && receipt.quantity > 1 && <>, with {receipt.quantity} units added back</>}. The sale was removed
            from Transactions.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            {!product && (
              <Button type="button" variant="outline" onClick={onAnother}>
                Sell another
              </Button>
            )}
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </>
    );
  }

  const confirmLabel = working
    ? "Recording..."
    : belowCost
      ? lossConfirmed
        ? "Confirm sale at a loss"
        : "Sell below cost"
      : "Confirm sale";

  return (
    <>
      <DialogHeader>
        <DialogTitle>{product ? "Mark as sold" : "Record sale"}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {selected ? (
          <ProductSummary product={selected} onChange={product ? undefined : () => setSelected(null)} />
        ) : (
          <ProductPicker
            products={data.products}
            state={data.state}
            onRetry={data.retry}
            onChoose={choose}
            error={error?.field === "product" ? error.message : null}
          />
        )}

        {selected && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={priceId}>Sold for ($){isAccessory && " each"}</Label>
                <Input
                  ref={priceRef}
                  id={priceId}
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  autoFocus={!!product}
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setLossConfirmed(false);
                  }}
                  placeholder="0.00"
                  aria-invalid={error?.field === "price" ? true : undefined}
                  aria-describedby={error?.field === "price" ? errorId : undefined}
                />
              </div>
              {isAccessory && (
                <div className="space-y-2">
                  <Label htmlFor={quantityId}>Quantity ({selected.quantity} in stock)</Label>
                  <Input
                    id={quantityId}
                    type="number"
                    min="1"
                    max={selected.quantity}
                    step="1"
                    inputMode="numeric"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      setLossConfirmed(false);
                    }}
                    aria-invalid={error?.field === "quantity" ? true : undefined}
                    aria-describedby={error?.field === "quantity" ? errorId : undefined}
                  />
                </div>
              )}
            </div>

            <ProfitLine product={selected} profit={profit} priceEntered={Number.isFinite(unitPrice)} />

            <div>
              <button
                type="button"
                onClick={() => setDetailsOpen((v) => !v)}
                aria-expanded={showDetails}
                aria-controls={detailsId}
                className="-ml-1 inline-flex items-center gap-1 rounded-md px-1 py-1 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                {showDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Add customer, date or notes
              </button>
              <div id={detailsId} hidden={!showDetails} className="mt-3 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={customerId}>Customer</Label>
                  <Select id={customerId} value={contactId} onChange={(e) => setContactId(e.target.value)}>
                    <option value="">
                      {data.state === "loading" ? "Loading customers..." : "No customer"}
                    </option>
                    {data.customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  {data.state === "error" && (
                    <p className="text-sm text-muted-foreground">
                      Couldn&apos;t load customers.{" "}
                      <button type="button" onClick={data.retry} className="font-medium text-primary hover:underline cursor-pointer">
                        Try again
                      </button>
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={dateId}>Date</Label>
                  <Input
                    id={dateId}
                    type="date"
                    value={date}
                    max={localDateString()}
                    onChange={(e) => setDate(e.target.value || localDateString())}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={notesId}>Notes</Label>
                  <Textarea
                    id={notesId}
                    rows={2}
                    maxLength={PRODUCT_LIMITS.notes}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Sale details..."
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {belowCost && lossConfirmed && !working && (
          <p role="alert" className="text-sm text-destructive">
            This sells for {formatCurrency(-(profit ?? 0))} less than it cost. Press the button again to confirm.
          </p>
        )}
        {error && error.field !== "product" && (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {error.message}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={working}>
            Cancel
          </Button>
          <Button type="submit" variant={belowCost && lossConfirmed ? "destructive" : "default"} disabled={working}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </>
  );
}

/** The unit being sold, with the facts that identify it so the right one is confirmed. */
function ProductSummary({ product, onChange }: { product: SaleProduct; onChange?: () => void }) {
  const condition = conditionLabels[product.condition];
  const status = statusLabels[product.status];
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-muted p-3">
      <div className="min-w-0 space-y-1.5">
        <p className="break-words text-sm font-medium">{product.name}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {product.type === "DEVICE" && condition && <Badge variant={condition.variant}>{condition.label}</Badge>}
          {status && <Badge variant={status.variant}>{status.label}</Badge>}
          {product.sellingPrice !== null && (
            <span className="text-xs text-muted-foreground">Listed {formatCurrency(product.sellingPrice)}</span>
          )}
        </div>
        {(product.serialNumber || product.imei) && (
          <p className="break-all font-mono text-sm">
            {product.serialNumber && <>S/N {product.serialNumber}</>}
            {product.serialNumber && product.imei && " · "}
            {product.imei && <>IMEI {product.imei}</>}
          </p>
        )}
      </div>
      {onChange && (
        <Button type="button" variant="ghost" size="sm" onClick={onChange}>
          Change
        </Button>
      )}
    </div>
  );
}

/** Live read-out of what this price earns, so the number is known before it is committed. */
function ProfitLine({
  product,
  profit,
  priceEntered,
}: {
  product: SaleProduct;
  profit: number | null;
  priceEntered: boolean;
}) {
  let content: React.ReactNode = null;
  if (priceEntered && product.purchasePrice === null) {
    content = <span className="text-muted-foreground">Cost not recorded, so profit can&apos;t be shown.</span>;
  } else if (profit !== null && profit < 0) {
    content = <span className="font-medium text-destructive">Below cost: loses {formatCurrency(-profit)}</span>;
  } else if (profit !== null) {
    content = <span className="font-medium text-success-ink">Profit {formatCurrency(profit)}</span>;
  }
  // Always mounted so assistive tech is already listening when the figure appears.
  return (
    <p aria-live="polite" className="min-h-5 text-sm">
      {content}
    </p>
  );
}

/** Type-ahead over unsold stock by name, serial number or IMEI. Enter picks the top match, so a scanner works. */
function ProductPicker({
  products,
  state,
  onRetry,
  onChoose,
  error,
}: {
  products: SaleProduct[];
  state: "loading" | "ready" | "error";
  onRetry: () => void;
  onChoose: (product: SaleProduct) => void;
  error: string | null;
}) {
  const inputId = useId();
  const listId = useId();
  const errorId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const matches = useMemo(() => matchProducts(products, query), [products, query]);
  const expanded = open && state === "ready";

  function pick(product: SaleProduct) {
    setOpen(false);
    onChoose(product);
  }

  return (
    <div className="relative space-y-2">
      <Label htmlFor={inputId}>Product</Label>
      <Input
        id={inputId}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        autoComplete="off"
        autoFocus
        value={query}
        placeholder="Search by name, serial number or IMEI"
        maxLength={PRODUCT_LIMITS.search}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setActive(-1);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => (matches.length ? (i + 1) % matches.length : -1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => (matches.length ? (i <= 0 ? matches.length - 1 : i - 1) : -1));
          } else if (e.key === "Escape" && expanded) {
            // Close the list first; a second Escape closes the dialog.
            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            setOpen(false);
            setActive(-1);
          } else if (e.key === "Enter" && state === "ready" && matches.length > 0) {
            e.preventDefault();
            pick(matches[active >= 0 ? active : 0]);
          }
        }}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {state === "loading" && <p className="text-sm text-muted-foreground">Loading stock...</p>}
      {state === "error" && (
        <p role="alert" className="text-sm text-destructive">
          We couldn&apos;t load your stock.{" "}
          <button type="button" onClick={onRetry} className="font-medium underline cursor-pointer">
            Try again
          </button>
        </p>
      )}
      <div
        id={listId}
        role="listbox"
        aria-label="Matching products"
        hidden={!expanded}
        className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-card p-1 shadow-lg"
      >
        {matches.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">
            {products.length === 0 ? "Nothing is in stock to sell." : `No unsold product matches “${query.trim()}”.`}
          </p>
        ) : (
          matches.map((p, index) => (
            <div
              id={`${listId}-${index}`}
              key={p.id}
              role="option"
              aria-selected={index === active}
              className={cn("cursor-pointer rounded-md px-3 py-2 text-sm", index === active && "bg-muted")}
              // Keeps the input focused so blur doesn't close the list before the click lands.
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(index)}
              onClick={() => pick(p)}
            >
              <span className="block break-words font-medium">{p.name}</span>
              <span className="block break-all text-xs text-muted-foreground">
                {[
                  p.type === "ACCESSORY" ? `${p.quantity} in stock` : conditionLabels[p.condition]?.label,
                  p.serialNumber && `S/N ${p.serialNumber}`,
                  p.imei && `IMEI ${p.imei}`,
                  p.sellingPrice !== null && formatCurrency(p.sellingPrice),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
          ))
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {expanded && matches.length > 0 ? `${matches.length} matching products` : ""}
      </p>
    </div>
  );
}

/** Stock and customers for the dialog; fetched once when first needed, and again on retry. */
function useSaleData(enabled: boolean) {
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [customers, setCustomers] = useState<Contact[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch("/api/transactions/data", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data: { products?: SaleProduct[]; contacts?: Contact[] }) => {
        setProducts(data.products ?? []);
        setCustomers((data.contacts ?? []).filter((c) => c.type === "CUSTOMER" || c.type === "BOTH"));
        setState("ready");
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setState("error");
      });
    return () => controller.abort();
  }, [enabled, attempt]);

  function retry() {
    setState("loading");
    setAttempt((n) => n + 1);
  }

  return { products, customers, state, retry };
}
