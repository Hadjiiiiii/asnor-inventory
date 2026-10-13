"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus,
  Search,
  Package,
  Cable,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  CircleDollarSign,
  Wrench,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { deleteProduct } from "./actions";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";
import type { ProductWithCategory } from "./actions";
import { conditionLabels, statusLabels } from "@/lib/product-labels";
import { MarkAsSoldDialog } from "./mark-as-sold-dialog";

interface InventoryListProps {
  products: ProductWithCategory[];
  categories: { id: string; name: string }[];
  total: number;
  pages: number;
  currentPage: number;
}

/** Two-line price display: selling price (green) stacked on purchase price (red). */
function PriceCell({ product }: { product: ProductWithCategory }) {
  return (
    <div className="text-right leading-tight tabular-nums">
      <p className="font-medium text-success-ink">
        <span className="sr-only">Selling price </span>
        {product.sellingPrice ? formatCurrency(product.sellingPrice) : "—"}
      </p>
      <p className="text-xs text-destructive">
        <span className="sr-only">Purchase price </span>
        {product.purchasePrice ? formatCurrency(product.purchasePrice) : "—"}
      </p>
    </div>
  );
}

function ConditionBadge({ product }: { product: ProductWithCategory }) {
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant={conditionLabels[product.condition]?.variant || "secondary"}>
        {conditionLabels[product.condition]?.label || product.condition}
      </Badge>
      {product.condition === "FOR_PARTS" && product.salvagedParts && (
        <span title={`Salvaged: ${product.salvagedParts}`}>
          <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      )}
    </div>
  );
}

function StatusBadge({ product }: { product: ProductWithCategory }) {
  return (
    <Badge variant={statusLabels[product.status]?.variant || "secondary"}>
      {statusLabels[product.status]?.label || product.status}
    </Badge>
  );
}

function productMeta(product: ProductWithCategory) {
  return [product.brand, product.model].filter(Boolean).join(" • ") +
    (product.serialNumber ? ` • S/N: ${product.serialNumber}` : "");
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function InventoryList({ products, categories, total, pages, currentPage }: InventoryListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const [soldTarget, setSoldTarget] = useState<ProductWithCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductWithCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Failures stay inside the open dialog, next to the action that caused them.
  const [dialogError, setDialogError] = useState<string | null>(null);

  // "Units" (devices) vs "Accessories" toggle. Defaults to Units when no type is set.
  const activeType = searchParams.get("type") === "ACCESSORY" ? "ACCESSORY" : "DEVICE";

  function updateFilters(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset to page 1 on filter change
    router.push(`/inventory?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilters("search", searchValue);
  }

  function handleSwitchType(type: "DEVICE" | "ACCESSORY") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    // Condition filter only applies to units; drop it when switching to accessories.
    if (type === "ACCESSORY") params.delete("condition");
    params.delete("page");
    router.push(`/inventory?${params.toString()}`);
  }

  function openDelete(product: ProductWithCategory) {
    setDialogError(null);
    setDeleteTarget(product);
  }

  async function confirmDelete() {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);
    setDialogError(null);
    try {
      const result = await deleteProduct(deleteTarget.id);
      if (result.error) {
        setDialogError(result.error);
        return;
      }
      addToast("Product deleted", "success");
      setDeleteTarget(null);
    } catch {
      setDialogError("We couldn't reach the server. Nothing was deleted; check your connection and try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  function openMarkAsSold(product: ProductWithCategory) {
    setSoldTarget(product);
  }

  const isUnitsView = activeType === "DEVICE";

  // Shared by the desktop table and the phone list so both always offer the same actions.
  function renderRowActions(product: ProductWithCategory) {
    return (
      <div className="flex items-center justify-end gap-1">
        {product.status !== "SOLD" && (
          <Button
            variant="ghost"
            size="icon"
            className="text-success-ink hover:text-success-ink"
            onClick={() => openMarkAsSold(product)}
            title="Mark as sold"
            aria-label={`Mark ${product.name} as sold`}
          >
            <CircleDollarSign className="h-4 w-4" />
          </Button>
        )}
        <Link
          href={`/inventory/${product.id}`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
          title="View details"
          aria-label={`View ${product.name}`}
        >
          <Eye className="h-4 w-4" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => openDelete(product)}
          title="Delete"
          aria-label={`Delete ${product.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  // The type switch and sort are not filters, so they must not suppress the "add your first product" prompt.
  const hasFilters = ["search", "category", "condition", "status"].some((key) => searchParams.get(key));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              aria-label="Search products"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <Link href="/inventory/new" className={buttonVariants({ className: "w-full sm:w-auto" })}>
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Units / Accessories switch */}
      <div role="group" aria-label="Product type" className="inline-flex rounded-lg border border-border bg-card p-1 gap-1">
        <button
          type="button"
          aria-pressed={isUnitsView}
          onClick={() => handleSwitchType("DEVICE")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 pointer-coarse:py-2.5 text-sm font-medium transition-colors cursor-pointer",
            FOCUS_RING,
            isUnitsView ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Package className="h-4 w-4" />
          Units
        </button>
        <button
          type="button"
          aria-pressed={!isUnitsView}
          onClick={() => handleSwitchType("ACCESSORY")}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 pointer-coarse:py-2.5 text-sm font-medium transition-colors cursor-pointer",
            FOCUS_RING,
            !isUnitsView ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Cable className="h-4 w-4" />
          Accessories
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Select
          value={searchParams.get("category") || ""}
          onChange={(e) => updateFilters("category", e.target.value)}
          aria-label="Filter by category"
          className="sm:w-40"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </Select>
        {isUnitsView && (
          <Select
            value={searchParams.get("condition") || ""}
            onChange={(e) => updateFilters("condition", e.target.value)}
            aria-label="Filter by condition"
            className="sm:w-36"
          >
            <option value="">All Conditions</option>
            <option value="BRAND_NEW">Brand New</option>
            <option value="SECONDHAND">Secondhand</option>
            <option value="FOR_PARTS">For Parts</option>
          </Select>
        )}
        <Select
          value={searchParams.get("status") || ""}
          onChange={(e) => updateFilters("status", e.target.value)}
          aria-label="Filter by status"
          className="sm:w-36"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="SOLD">Sold</option>
        </Select>
        <Select
          value={searchParams.get("sort") || ""}
          onChange={(e) => updateFilters("sort", e.target.value)}
          aria-label="Sort products"
          className="sm:w-44"
        >
          <option value="">Sort: Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="brand">Brand (A–Z)</option>
        </Select>
      </div>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No {isUnitsView ? "units" : "accessories"} found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasFilters ? "Try adjusting your filters" : "Add your first product to get started"}
              </p>
              {!hasFilters && (
                <Link href="/inventory/new" className={cn(buttonVariants(), "mt-4")}>
                  <Plus className="h-4 w-4" />
                  Add Product
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* md and up: table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      {isUnitsView && <TableHead>Condition</TableHead>}
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      {!isUnitsView && <TableHead>Qty</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <Link
                              href={`/inventory/${product.id}`}
                              className={cn("font-medium rounded-sm hover:underline underline-offset-2", FOCUS_RING)}
                            >
                              {product.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">{productMeta(product)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{product.category.name}</span>
                        </TableCell>
                        {isUnitsView && (
                          <TableCell>
                            <ConditionBadge product={product} />
                          </TableCell>
                        )}
                        <TableCell>
                          <StatusBadge product={product} />
                        </TableCell>
                        <TableCell>
                          <PriceCell product={product} />
                        </TableCell>
                        {!isUnitsView && <TableCell>{product.quantity}</TableCell>}
                        <TableCell className="text-right">{renderRowActions(product)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Below md: one stacked row per product, so price and actions never need a sideways scroll */}
              <ul className="divide-y divide-border md:hidden">
                {products.map((product) => (
                  <li key={product.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/inventory/${product.id}`}
                          className={cn("font-medium rounded-sm hover:underline underline-offset-2 break-words", FOCUS_RING)}
                        >
                          {product.name}
                        </Link>
                        <p className="text-xs text-muted-foreground break-words">{productMeta(product)}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.category.name}
                          {!isUnitsView && ` • Qty ${product.quantity}`}
                        </p>
                      </div>
                      <PriceCell product={product} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isUnitsView && <ConditionBadge product={product} />}
                        <StatusBadge product={product} />
                      </div>
                      {renderRowActions(product)}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * 20 + 1}–{Math.min(currentPage * 20, total)} of {total}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      aria-label="Previous page"
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("page", String(currentPage - 1));
                        router.push(`/inventory?${params.toString()}`);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= pages}
                      aria-label="Next page"
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("page", String(currentPage + 1));
                        router.push(`/inventory?${params.toString()}`);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {soldTarget && (
        <MarkAsSoldDialog
          open
          onOpenChange={(open) => !open && setSoldTarget(null)}
          productId={soldTarget.id}
          productName={soldTarget.name}
          defaultPrice={soldTarget.sellingPrice}
          unitsInStock={soldTarget.type === "ACCESSORY" ? soldTarget.quantity : undefined}
          onSold={() => setSoldTarget(null)}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}>
        <DialogContent onClose={() => setDeleteTarget(null)} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete product</DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Delete <span className="font-medium text-foreground">{deleteTarget.name}</span>? This can&apos;t be undone.
                A product with transaction history can&apos;t be deleted; mark it as sold instead.
              </p>
              {dialogError && (
                <p role="alert" className="text-sm text-destructive">{dialogError}</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
