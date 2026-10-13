import { notFound } from "next/navigation";
import Link from "next/link";
import { getContact } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, Phone, Mail, MapPin, FileText } from "lucide-react";
import { ContactEditForm } from "./contact-edit-form";

interface Props {
  params: Promise<{ id: string }>;
}

const typeLabels: Record<string, { label: string; variant: "default" | "secondary" | "success" }> = {
  SUPPLIER: { label: "Supplier", variant: "default" },
  CUSTOMER: { label: "Customer", variant: "secondary" },
  BOTH: { label: "Both", variant: "success" },
};

export default async function ContactDetailPage({ params }: Props) {
  const { id } = await params;
  const contact = await getContact(id);

  if (!contact) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/contacts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{contact.name}</h1>
            <Badge variant={typeLabels[contact.type]?.variant || "secondary"}>
              {typeLabels[contact.type]?.label || contact.type}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Added {formatDate(contact.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Info & Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          <ContactEditForm contact={contact} />
        </div>

        {/* Sidebar - Contact Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.phone}</span>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.email}</span>
                </div>
              )}
              {contact.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.address}</span>
                </div>
              )}
              {contact.notes && (
                <div className="flex items-start gap-3 text-sm pt-2 border-t">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">{contact.notes}</span>
                </div>
              )}
              {!contact.phone && !contact.email && !contact.address && !contact.notes && (
                <p className="text-sm text-muted-foreground">No additional details</p>
              )}
            </CardContent>
          </Card>

          {/* Transaction Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Transactions</span>
                <span className="font-medium">{contact.transactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchases (from)</span>
                <span className="font-medium">
                  {contact.transactions.filter((t) => t.type === "BUY").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sales (to)</span>
                <span className="font-medium">
                  {contact.transactions.filter((t) => t.type === "SELL").length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction History */}
      {contact.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contact.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="text-sm font-medium flex items-center">
                      <Badge variant={tx.type === "BUY" ? "default" : "success"} className="mr-2">
                        {tx.type === "BUY" ? "Purchase" : "Sale"}
                      </Badge>
                      <Link href={`/inventory/${tx.productId}`} className="hover:underline">
                        {tx.product.name}
                      </Link>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(tx.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(tx.totalPrice.toString())}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.quantity} × {formatCurrency(tx.unitPrice.toString())}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
