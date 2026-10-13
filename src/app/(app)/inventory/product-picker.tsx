"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { conditionLabels } from "@/lib/product-labels";
import { PRODUCT_LIMITS } from "@/lib/product-limits";
import { matchProducts } from "@/lib/sale";
import { cn, formatCurrency } from "@/lib/utils";

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

export interface Contact {
  id: string;
  name: string;
  type: string;
}


/** Type-ahead over unsold stock by name, serial number or IMEI. Enter picks the top match, so a scanner works. */
export function ProductPicker({
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
export function useSaleData(enabled: boolean, contactsOnly = false) {
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [customers, setCustomers] = useState<Contact[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch(`/api/transactions/data${contactsOnly ? "?scope=contacts" : ""}`, { signal: controller.signal })
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
  }, [enabled, contactsOnly, attempt]);

  function retry() {
    setState("loading");
    setAttempt((n) => n + 1);
  }

  return { products, customers, state, retry };
}
