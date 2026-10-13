"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { updateContact } from "../actions";
import { CONTACT_LIMITS, readContactForm, validateContactFields } from "@/lib/contact-validation";
import { Loader2, Save } from "lucide-react";

interface ContactData {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

export function ContactEditForm({ contact }: { contact: ContactData }) {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);

  function fail(form: HTMLFormElement, message: string, field?: string) {
    setError({ message, field });
    if (field) (form.elements.namedItem(field) as HTMLElement | null)?.focus();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;
    const form = e.currentTarget;
    const formData = new FormData(form);

    const problem = validateContactFields(readContactForm(formData));
    if (problem) {
      fail(form, problem.error, problem.field);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await updateContact(contact.id, formData);
      if (result.error) {
        fail(form, result.error, result.field);
        return;
      }
      addToast("Contact updated", "success");
    } catch {
      setError({ message: "We couldn't reach the server. Your changes weren't saved; check your connection and try again." });
    } finally {
      setIsLoading(false);
    }
  }

  const invalid = (field: string) => (error?.field === field ? true : undefined);
  const describedBy = (field: string) => (error?.field === field ? "contact-edit-error" : undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit Contact</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" required maxLength={CONTACT_LIMITS.name} defaultValue={contact.name} aria-invalid={invalid("name")} aria-describedby={describedBy("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select id="type" name="type" defaultValue={contact.type}>
                <option value="SUPPLIER">Supplier</option>
                <option value="CUSTOMER">Customer</option>
                <option value="BOTH">Both</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" maxLength={CONTACT_LIMITS.phone} defaultValue={contact.phone || ""} aria-invalid={invalid("phone")} aria-describedby={describedBy("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" maxLength={CONTACT_LIMITS.email} defaultValue={contact.email || ""} aria-invalid={invalid("email")} aria-describedby={describedBy("email")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" maxLength={CONTACT_LIMITS.address} defaultValue={contact.address || ""} aria-invalid={invalid("address")} aria-describedby={describedBy("address")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" maxLength={CONTACT_LIMITS.notes} defaultValue={contact.notes || ""} rows={2} aria-invalid={invalid("notes")} aria-describedby={describedBy("notes")} />
            </div>
          </div>
          {error && (
            <p id="contact-edit-error" role="alert" className="text-sm text-destructive">
              {error.message}
            </p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
