import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Edit, ArrowLeft, Smartphone, Cable, Wrench } from "lucide-react";
import { conditionLabels, statusLabels } from "@/lib/product-labels";
import { ProductImages } from "./product-images";
import { MarkAsSoldButton } from "./mark-as-sold-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const profit = product.sellingPrice && product.purchasePrice
    ? Number(product.sellingPrice) - Number(product.purchasePrice)
    : null;
  const secondhandChecks = [
    product.scratchesMarkings && "Scratches/Markings",
    product.displayScratches && "Display Scratches",
    product.dents && "Dents",
    product.serviceBattery && "Service Battery",
    product.faceIdNotWorking && "Face ID Not Working",
  ].filter((check): check is string => Boolean(check));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/inventory"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
            aria-label="Back to inventory"
            title="Back to inventory"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-2xl font-semibold">{product.name}</h1>
              <Badge variant={statusLabels[product.status]?.variant || "secondary"}>
                {statusLabels[product.status]?.label || product.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {[product.brand, product.model].filter(Boolean).join(" • ")}
            </p>
            {(product.serialNumber || product.imei) && (
              <p className="mt-1 break-all font-mono text-base">
                {product.serialNumber && (
                  <span className="select-all">
                    <span className="text-muted-foreground">S/N </span>
                    {product.serialNumber}
                  </span>
                )}
                {product.serialNumber && product.imei && <span className="text-muted-foreground"> · </span>}
                {product.imei && (
                  <span className="select-all">
                    <span className="text-muted-foreground">IMEI </span>
                    {product.imei}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MarkAsSoldButton
            product={{
              id: product.id,
              name: product.name,
              brand: product.brand,
              type: product.type,
              status: product.status,
              condition: product.condition,
              serialNumber: product.serialNumber,
              imei: product.imei,
              quantity: product.quantity,
              sellingPrice: product.sellingPrice,
              purchasePrice: product.purchasePrice,
            }}
          />
          <Link href={`/inventory/${id}/edit`} className={buttonVariants({ variant: "outline" })}>
            <Edit className="h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {product.type === "DEVICE" ? (
                  <Smartphone className="h-4 w-4" />
                ) : (
                  <Cable className="h-4 w-4" />
                )}
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium mt-0.5">
                    {product.type === "DEVICE" ? "Device" : "Accessory"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium mt-0.5">{product.category.name}</dd>
                </div>
                {product.type === "DEVICE" && (
                  <div>
                    <dt className="text-muted-foreground">Condition</dt>
                    <dd className="mt-0.5">
                      <Badge variant={conditionLabels[product.condition]?.variant || "secondary"}>
                        {conditionLabels[product.condition]?.label || product.condition}
                      </Badge>
                    </dd>
                  </div>
                )}
                {product.type === "DEVICE" && (
                  <>
                    {product.color && (
                      <div>
                        <dt className="text-muted-foreground">Color</dt>
                        <dd className="font-medium mt-0.5">{product.color}</dd>
                      </div>
                    )}
                    {product.brand?.trim().toLowerCase() === "apple" && product.batteryHealth !== null && (
                      <div>
                        <dt className="text-muted-foreground">Battery Health</dt>
                        <dd className="font-medium mt-0.5">{product.batteryHealth}%</dd>
                      </div>
                    )}
                  </>
                )}
                {product.type === "ACCESSORY" && (
                  <>
                    <div>
                      <dt className="text-muted-foreground">Quantity</dt>
                      <dd className="font-medium mt-0.5">{product.quantity}</dd>
                    </div>
                    {!!product.lowStockThreshold && (
                      <div>
                        <dt className="text-muted-foreground">Low Stock Alert</dt>
                        <dd className="font-medium mt-0.5">Below {product.lowStockThreshold}</dd>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <dt className="text-muted-foreground">Added</dt>
                  <dd className="font-medium mt-0.5">{formatDate(product.createdAt)}</dd>
                </div>
              </dl>
              {product.type === "DEVICE" && product.condition === "FOR_PARTS" && product.salvagedParts && (
                <dl className="mt-4 pt-4 border-t">
                  <dt className="text-sm text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" />
                    Salvaged Parts
                  </dt>
                  <dd className="text-sm whitespace-pre-wrap">{product.salvagedParts}</dd>
                </dl>
              )}
              {secondhandChecks.length > 0 && (
                <dl className="mt-4 border-t pt-4">
                  <dt className="mb-2 text-sm text-muted-foreground">Secondhand Condition Checks</dt>
                  <dd className="flex flex-wrap gap-2">
                    {secondhandChecks.map((check) => (
                      <Badge key={check} variant="warning">{check}</Badge>
                    ))}
                  </dd>
                </dl>
              )}
              {product.notes && (
                <dl className="mt-4 pt-4 border-t">
                  <dt className="text-sm text-muted-foreground mb-1">Notes</dt>
                  <dd className="text-sm whitespace-pre-wrap">{product.notes}</dd>
                </dl>
              )}
            </CardContent>
          </Card>

          {/* Images - Interactive Upload */}
          <ProductImages productId={product.id} initialImages={product.images} />

          {/* Transaction History */}
          {product.transactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {product.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">
                          {tx.type === "BUY" ? "Purchased" : "Sold"}
                          {tx.contact && (
                            <span className="text-muted-foreground">
                              {tx.type === "BUY" ? " from " : " to "}
                              {tx.contact.name}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                      </div>
                      <div className="text-right tabular-nums">
                        <p className="text-sm font-medium">
                          {formatCurrency(tx.totalPrice.toString())}
                        </p>
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

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Purchase Price</span>
                <span className="font-medium text-destructive tabular-nums">
                  {product.purchasePrice ? formatCurrency(product.purchasePrice.toString()) : "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Selling Price</span>
                <span className="font-medium text-success-ink tabular-nums">
                  {product.sellingPrice ? formatCurrency(product.sellingPrice.toString()) : "—"}
                </span>
              </div>
              {profit !== null && (
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">{product.status === "SOLD" ? "Profit" : "Potential profit"}</span>
                  <span className={`font-semibold tabular-nums ${profit >= 0 ? "text-success-ink" : "text-destructive"}`}>
                    {formatCurrency(profit)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
