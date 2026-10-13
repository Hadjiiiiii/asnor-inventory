"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowLeftRight, ShoppingCart, DollarSign } from "lucide-react";
import { Pagination } from "@/components/pagination";
import { PAGE_SIZE } from "@/lib/page-size";
import { localDateString } from "@/lib/sale";
import { createBuyTransaction } from "./actions";
import { SaleDialog } from "../inventory/sale-dialog";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TransactionWithRelations } from "./actions";

interface TransactionListProps {
  transactions: TransactionWithRelations[];
  total: number;
  pages: number;
  currentPage: number;
}

export function TransactionList({ transactions, total, pages, currentPage }: TransactionListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [contacts, setContacts] = useState<{ id: string; name: string; type: string }[]>([]);

  // Fetch products and contacts when the purchase dialog opens
  useEffect(() => {
    if (showBuyDialog) {
      fetch("/api/transactions/data")
        .then((res) => {
          if (!res.ok) throw new Error(String(res.status));
          return res.json();
        })
        .then((data) => {
          setProducts(data.products || []);
          setContacts(data.contacts || []);
        })
        .catch(() => setBuyError("We couldn't load your products. Close this and try again."));
    }
  }, [showBuyDialog]);

  function updateFilters(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/transactions?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilters("search", searchValue);
  }

  function openBuyDialog() {
    setBuyError(null);
    setShowBuyDialog(true);
  }

  async function handleBuy(formData: FormData) {
    setIsLoading(true);
    setBuyError(null);
    try {
      const result = await createBuyTransaction(formData);
      if (result.error) {
        setBuyError(result.error);
        return;
      }
      addToast("Purchase recorded", "success");
      setShowBuyDialog(false);
    } catch {
      setBuyError("We couldn't reach the server. The purchase wasn't recorded; check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const suppliers = contacts.filter((c) => c.type === "SUPPLIER" || c.type === "BOTH");

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <form onSubmit={handleSearch} role="search" className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Label htmlFor="transaction-search" className="sr-only">
              Search transactions
            </Label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              id="transaction-search"
              placeholder="Search product, contact or notes..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openBuyDialog}>
            <ShoppingCart className="h-4 w-4" />
            Record Purchase
          </Button>
          <Button onClick={() => setShowSellDialog(true)}>
            <DollarSign className="h-4 w-4" />
            Record Sale
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select
          aria-label="Filter by transaction type"
          value={searchParams.get("type") || ""}
          onChange={(e) => updateFilters("type", e.target.value)}
          className="w-40"
        >
          <option value="">All Types</option>
          <option value="BUY">Purchases</option>
          <option value="SELL">Sales</option>
        </Select>
      </div>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ArrowLeftRight className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No transactions yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Record your first purchase or sale to get started
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={openBuyDialog}>
                  <ShoppingCart className="h-4 w-4" />
                  Record Purchase
                </Button>
                <Button onClick={() => setShowSellDialog(true)}>
                  <DollarSign className="h-4 w-4" />
                  Record Sale
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* md and up: table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Badge variant={tx.type === "BUY" ? "secondary" : "success"}>
                            {tx.type === "BUY" ? "Purchase" : "Sale"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[18rem] break-words">
                          <Link href={`/inventory/${tx.product.id}`} className="font-medium hover:underline">
                            {tx.product.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {tx.quantity} × {formatCurrency(tx.unitPrice.toString())}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[14rem] break-words text-muted-foreground">
                          {tx.contact ? (
                            <Link href={`/contacts/${tx.contact.id}`} className="hover:underline">
                              {tx.contact.name}
                            </Link>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(tx.date)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(tx.totalPrice.toString())}
                        </TableCell>
                        <TableCell className="text-right">
                          <ProfitText profit={tx.profit} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Below md: one stacked row per transaction, so amounts never need a sideways scroll */}
              <ul className="divide-y divide-border md:hidden">
                {transactions.map((tx) => (
                  <li key={tx.id} className="space-y-1 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <Badge variant={tx.type === "BUY" ? "secondary" : "success"}>
                          {tx.type === "BUY" ? "Purchase" : "Sale"}
                        </Badge>
                        <p>
                          <Link href={`/inventory/${tx.product.id}`} className="break-words font-medium hover:underline">
                            {tx.product.name}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.quantity} × {formatCurrency(tx.unitPrice.toString())} · {formatDate(tx.date)}
                        </p>
                        {tx.contact && (
                          <p className="break-words text-xs text-muted-foreground">
                            {tx.type === "BUY" ? "From" : "To"}{" "}
                            <Link href={`/contacts/${tx.contact.id}`} className="hover:underline">
                              {tx.contact.name}
                            </Link>
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 space-y-1 text-right">
                        <p className="font-medium tabular-nums">{formatCurrency(tx.totalPrice.toString())}</p>
                        {tx.profit !== null && (
                          <p className="text-xs">
                            <ProfitText profit={tx.profit} labelled />
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <Pagination
                basePath="/transactions"
                currentPage={currentPage}
                pages={pages}
                total={total}
                pageSize={PAGE_SIZE}
                className="border-t px-4 py-3"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Buy Dialog */}
      <Dialog open={showBuyDialog} onOpenChange={(open) => !isLoading && setShowBuyDialog(open)}>
        <DialogContent onClose={() => !isLoading && setShowBuyDialog(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Purchase</DialogTitle>
          </DialogHeader>
          <form action={handleBuy} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buy-productId">Product *</Label>
              <Select id="buy-productId" name="productId" required>
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="buy-contactId">Supplier</Label>
              <Select id="buy-contactId" name="contactId">
                <option value="">No supplier</option>
                {suppliers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="buy-quantity">Quantity</Label>
                <Input id="buy-quantity" name="quantity" type="number" min="1" defaultValue="1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buy-unitPrice">Unit Price ($) *</Label>
                <Input id="buy-unitPrice" name="unitPrice" type="number" step="0.01" min="0" required placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="buy-date">Date</Label>
              <Input id="buy-date" name="date" type="date" defaultValue={localDateString()} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buy-notes">Notes</Label>
              <Textarea id="buy-notes" name="notes" placeholder="Purchase details..." rows={2} />
            </div>
            {buyError && (
              <p role="alert" className="text-sm text-destructive">{buyError}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" disabled={isLoading} onClick={() => setShowBuyDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Recording..." : "Record Purchase"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sale: the same dialog the inventory rows use, with a product search first */}
      <SaleDialog open={showSellDialog} onOpenChange={setShowSellDialog} />
    </div>
  );
}

/** Profit or loss as a signed figure; `labelled` spells out the word so colour is never the only cue. */
function ProfitText({ profit, labelled = false }: { profit: number | null; labelled?: boolean }) {
  if (profit === null) return <>—</>;
  if (profit < 0) {
    return (
      <span className="font-medium text-destructive">
        {labelled ? `Loss ${formatCurrency(-profit)}` : formatCurrency(profit)}
      </span>
    );
  }
  return (
    <span className="font-medium text-success-ink">
      {labelled ? `Profit ${formatCurrency(profit)}` : formatCurrency(profit)}
    </span>
  );
}
