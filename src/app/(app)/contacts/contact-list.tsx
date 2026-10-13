"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Pagination } from "@/components/pagination";
import { PAGE_SIZE } from "@/lib/page-size";
import { Plus, Search, Users, Trash2, Eye } from "lucide-react";
import { createContact, deleteContact } from "./actions";
import { useToast } from "@/components/ui/toast";
import { CONTACT_LIMITS, readContactForm, validateContactFields } from "@/lib/contact-validation";
import type { ContactWithTransactionCount } from "./actions";

const OFFLINE = "We couldn't reach the server. The contact wasn't saved; check your connection and try again.";

const typeLabels: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" }> = {
  SUPPLIER: { label: "Supplier", variant: "default" },
  CUSTOMER: { label: "Customer", variant: "secondary" },
  BOTH: { label: "Both", variant: "success" },
};

interface ContactListProps {
  contacts: ContactWithTransactionCount[];
  total: number;
  pages: number;
  currentPage: number;
}

export function ContactList({ contacts, total, pages, currentPage }: ContactListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<{ message: string; field?: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactWithTransactionCount | null>(null);

  const isFiltered = !!(searchParams.get("search") || searchParams.get("type"));

  function updateFilters(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/contacts?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilters("search", searchValue.trim());
  }

  function clearFilters() {
    setSearchValue("");
    router.push("/contacts");
  }

  function openCreate() {
    setFormError(null);
    setShowCreateDialog(true);
  }

  function showFieldError(form: HTMLFormElement, message: string, field?: string) {
    setFormError({ message, field });
    if (field) (form.elements.namedItem(field) as HTMLElement | null)?.focus();
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;
    const form = e.currentTarget;
    const formData = new FormData(form);

    const problem = validateContactFields(readContactForm(formData));
    if (problem) {
      showFieldError(form, problem.error, problem.field);
      return;
    }

    setIsLoading(true);
    setFormError(null);
    try {
      const result = await createContact(formData);
      if (result.error) {
        showFieldError(form, result.error, result.field);
        return;
      }
      addToast("Contact created", "success");
      setShowCreateDialog(false);
    } catch {
      setFormError({ message: OFFLINE });
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmDelete(): Promise<string | null> {
    if (!deleteTarget) return null;
    const result = await deleteContact(deleteTarget.id);
    if (result.error) return result.error;
    addToast("Contact deleted", "success");
    return null;
  }

  const errorFor = (field: string) => (formError?.field === field ? formError.message : null);

  const renderActions = (contact: ContactWithTransactionCount) => (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/contacts/${contact.id}`}
        aria-label={`View ${contact.name}`}
        title="View"
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <Eye className="h-4 w-4" aria-hidden />
      </Link>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${contact.name}`}
        title="Delete"
        className="text-destructive hover:text-destructive"
        onClick={() => setDeleteTarget(contact)}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <form onSubmit={handleSearch} role="search" className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Label htmlFor="contact-search" className="sr-only">
              Search contacts
            </Label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              id="contact-search"
              placeholder="Search name, email or phone..."
              value={searchValue}
              maxLength={100}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select
          aria-label="Filter by type"
          value={searchParams.get("type") || ""}
          onChange={(e) => updateFilters("type", e.target.value)}
          className="w-40"
        >
          <option value="">All Types</option>
          <option value="SUPPLIER">Suppliers</option>
          <option value="CUSTOMER">Customers</option>
          <option value="BOTH">Both</option>
        </Select>
      </div>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden />
              <h3 className="text-lg font-medium">
                {isFiltered ? "No contacts match your search" : "No contacts found"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isFiltered
                  ? "Try a different name, email or phone, or clear the filters."
                  : "Add suppliers and customers to track transactions"}
              </p>
              {isFiltered ? (
                <Button className="mt-4" variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button className="mt-4" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Add Contact
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* md and up: table */}
              <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="max-w-[16rem] break-words font-medium">{contact.name}</TableCell>
                      <TableCell>
                        <Badge variant={typeLabels[contact.type]?.variant || "secondary"}>
                          {typeLabels[contact.type]?.label || contact.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {contact.phone || "—"}
                      </TableCell>
                      <TableCell className="max-w-[16rem] break-all text-muted-foreground">
                        {contact.email || "—"}
                      </TableCell>
                      <TableCell>{contact._count.transactions}</TableCell>
                      <TableCell className="text-right">{renderActions(contact)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Below md: one stacked row per contact, so email and actions never need a sideways scroll */}
              <ul className="divide-y divide-border md:hidden">
                {contacts.map((contact) => (
                  <li key={contact.id} className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-medium">{contact.name}</p>
                        {contact.email && (
                          <p className="break-all text-xs text-muted-foreground">{contact.email}</p>
                        )}
                        {contact.phone && <p className="text-xs text-muted-foreground">{contact.phone}</p>}
                      </div>
                      <Badge variant={typeLabels[contact.type]?.variant || "secondary"} className="shrink-0">
                        {typeLabels[contact.type]?.label || contact.type}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {contact._count.transactions === 1
                          ? "1 transaction"
                          : `${contact._count.transactions} transactions`}
                      </p>
                      {renderActions(contact)}
                    </div>
                  </li>
                ))}
              </ul>

              <Pagination
                basePath="/contacts"
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

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => !isLoading && setShowCreateDialog(open)}>
        <DialogContent onClose={() => !isLoading && setShowCreateDialog(false)}>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name *</Label>
              <Input
                id="contact-name"
                name="name"
                required
                autoFocus
                autoComplete="off"
                maxLength={CONTACT_LIMITS.name}
                placeholder="Contact name"
                aria-invalid={errorFor("name") ? true : undefined}
                aria-describedby={errorFor("name") ? "contact-error" : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-type">Type</Label>
              <Select id="contact-type" name="type" defaultValue="CUSTOMER">
                <option value="SUPPLIER">Supplier</option>
                <option value="CUSTOMER">Customer</option>
                <option value="BOTH">Both</option>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Phone</Label>
                <Input
                  id="contact-phone"
                  name="phone"
                  type="tel"
                  autoComplete="off"
                  maxLength={CONTACT_LIMITS.phone}
                  placeholder="+1-555-0100"
                  aria-invalid={errorFor("phone") ? true : undefined}
                  aria-describedby={errorFor("phone") ? "contact-error" : undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  name="email"
                  type="email"
                  autoComplete="off"
                  maxLength={CONTACT_LIMITS.email}
                  placeholder="email@example.com"
                  aria-invalid={errorFor("email") ? true : undefined}
                  aria-describedby={errorFor("email") ? "contact-error" : undefined}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-address">Address</Label>
              <Input
                id="contact-address"
                name="address"
                autoComplete="off"
                maxLength={CONTACT_LIMITS.address}
                placeholder="Street address"
                aria-invalid={errorFor("address") ? true : undefined}
                aria-describedby={errorFor("address") ? "contact-error" : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-notes">Notes</Label>
              <Textarea
                id="contact-notes"
                name="notes"
                rows={2}
                maxLength={CONTACT_LIMITS.notes}
                placeholder="Additional notes..."
                aria-invalid={errorFor("notes") ? true : undefined}
                aria-describedby={errorFor("notes") ? "contact-error" : undefined}
              />
            </div>
            {formError && (
              <p id="contact-error" role="alert" className="text-sm text-destructive">
                {formError.message}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" disabled={isLoading} onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Contact"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete contact"
        description={
          <>
            Delete <span className="font-medium text-foreground">{deleteTarget?.name}</span>? This can&apos;t be undone.
            A contact with transaction history can&apos;t be deleted.
          </>
        }
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
