"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { createProduct, updateProduct, createCategory } from "./actions";
import { Loader2, Plus } from "lucide-react";
import { PRODUCT_LIMITS as LIMITS } from "@/lib/product-limits";

interface Category {
  id: string;
  name: string;
}

interface ProductData {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  type: string;
  categoryId: string;
  condition: string;
  status: string;
  serialNumber: string | null;
  imei: string | null;
  batteryHealth: number | null;
  scratchesMarkings: boolean;
  displayScratches: boolean;
  dents: boolean;
  serviceBattery: boolean;
  faceIdNotWorking: boolean;
  quantity: number;
  lowStockThreshold: number | null;
  purchasePrice: { toString: () => string } | null;
  sellingPrice: { toString: () => string } | null;
  salvagedParts: string | null;
  notes: string | null;
}

interface ProductFormProps {
  categories: Category[];
  product?: ProductData;
}

const BRAND_OPTIONS = [
  "Apple",
  "Samsung",
  "Huawei",
  "Xiaomi",
  "Oppo",
  "Vivo",
  "Realme",
  "Google",
  "Motorola",
  "Infinix",
  "Tecno",
  "Poco",
  "Nothing",
  "Oneplus",
];

function editDistance(left: string, right: string) {
  const distances = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex++) {
    let diagonal = distances[0];
    distances[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex++) {
      const above = distances[rightIndex];
      distances[rightIndex] = Math.min(
        distances[rightIndex] + 1,
        distances[rightIndex - 1] + 1,
        diagonal + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }

  return distances[right.length];
}

function ConditionCheckbox({
  id,
  name,
  label,
  checked,
}: {
  id: string;
  name: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={checked}
        className="h-4 w-4 shrink-0 rounded border-input accent-primary"
      />
      <span>{label}</span>
    </label>
  );
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [productType, setProductType] = useState(product?.type || "DEVICE");
  const [brand, setBrand] = useState(product?.brand || "");
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
  const [activeBrandIndex, setActiveBrandIndex] = useState(-1);
  const [condition, setCondition] = useState(product?.condition || "BRAND_NEW");
  const [categoryList, setCategoryList] = useState(categories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  // field is set when the server can point at one input; without it the message is shown above the buttons.
  const [formError, setFormError] = useState<{ message: string; field?: string } | null>(null);

  const isEdit = !!product;
  const isAppleDevice = productType === "DEVICE" && brand.trim().toLowerCase() === "apple";
  const normalizedBrand = brand.trim().toLowerCase();
  const sortedBrands = BRAND_OPTIONS
    .map((name, index) => {
      const candidate = name.toLowerCase();
      let score = normalizedBrand
        ? editDistance(normalizedBrand, candidate) / Math.max(normalizedBrand.length, candidate.length)
        : 0;

      if (normalizedBrand && candidate === normalizedBrand) score = -1;
      else if (normalizedBrand && candidate.startsWith(normalizedBrand)) score -= 0.5;
      else if (normalizedBrand && candidate.includes(normalizedBrand)) score -= 0.25;

      return { value: name, score, index, isCustom: false };
    })
    .sort((left, right) => left.score - right.score || left.index - right.index);
  const brandOptions = [...sortedBrands];
  if (brand.trim() && !BRAND_OPTIONS.some((name) => name.toLowerCase() === normalizedBrand)) {
    brandOptions.push({ value: brand.trim(), score: 0, index: BRAND_OPTIONS.length, isCustom: true });
  }

  function selectBrand(value: string) {
    setBrand(value);
    setIsBrandMenuOpen(false);
    setActiveBrandIndex(-1);
  }

  function showError(message: string, field?: string) {
    // A field that is not on screen (hidden by the current type) cannot show the message: use the summary.
    const target = field && document.getElementById(field) ? field : undefined;
    setFormError({ message, field: target });
    // Wait a frame so the error element exists, then move focus to it.
    requestAnimationFrame(() => document.getElementById(target ?? "form-error")?.focus());
  }

  // An onSubmit handler, not a form action: React 19 resets every uncontrolled field after an
  // action finishes, which would wipe what the user typed when the save is rejected.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;

    const formData = new FormData(e.currentTarget);
    setIsLoading(true);
    setFormError(null);

    try {
      const result = isEdit
        ? await updateProduct(product!.id, formData)
        : await createProduct(formData);

      if (result.error) {
        showError(result.error, result.field);
        return;
      }

      addToast(isEdit ? "Product updated" : "Product created", "success");
      if (!isEdit && "id" in result) {
        router.push(`/inventory/${result.id}`);
      } else {
        router.push("/inventory");
      }
    } catch {
      showError("We couldn't reach the server. Everything you entered is still here; check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;

    try {
      const result = await createCategory(name);
      if (result.error) {
        addToast(result.error, "error");
      } else if (result.id) {
        setCategoryList([...categoryList, { id: result.id, name }]);
        setNewCategoryName("");
        setShowNewCategory(false);
        addToast("Category created", "success");
      }
    } catch {
      addToast("Couldn't add the category. Check your connection and try again.", "error");
    }
  }

  const fieldProps = (field: string) =>
    formError?.field === field ? { "aria-invalid": true as const, "aria-describedby": `${field}-error` } : {};
  const fieldError = (field: string) =>
    formError?.field === field ? (
      <p id={`${field}-error`} className="text-sm text-destructive">{formError.message}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} onChange={() => formError && setFormError(null)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Product Name *</Label>
            {fieldError("name")}
            <Input
              id="name"
              name="name"
              required
              maxLength={LIMITS.name}
              {...fieldProps("name")}
              defaultValue={product?.name || ""}
              placeholder="e.g., iPhone 15 Pro Max 256GB"
            />
          </div>
          <div className="relative space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              name="brand"
              maxLength={LIMITS.brand}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isBrandMenuOpen}
              aria-controls="brand-options"
              aria-activedescendant={isBrandMenuOpen && activeBrandIndex >= 0 ? `brand-option-${activeBrandIndex}` : undefined}
              autoComplete="off"
              value={brand}
              onFocus={() => setIsBrandMenuOpen(true)}
              onBlur={() => {
                setIsBrandMenuOpen(false);
                setActiveBrandIndex(-1);
              }}
              onChange={(e) => {
                setBrand(e.target.value);
                setIsBrandMenuOpen(true);
                setActiveBrandIndex(-1);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setIsBrandMenuOpen(true);
                  setActiveBrandIndex((index) => (index + 1) % brandOptions.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setIsBrandMenuOpen(true);
                  setActiveBrandIndex((index) => (index <= 0 ? brandOptions.length - 1 : index - 1));
                } else if (e.key === "Escape") {
                  setIsBrandMenuOpen(false);
                  setActiveBrandIndex(-1);
                } else if (e.key === "Enter" && isBrandMenuOpen && activeBrandIndex >= 0) {
                  e.preventDefault();
                  const option = brandOptions[activeBrandIndex];
                  if (option) selectBrand(option.value);
                }
              }}
              placeholder="Choose or type a brand"
            />
            <div
              id="brand-options"
              role="listbox"
              className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-border bg-card p-1 shadow-lg"
              hidden={!isBrandMenuOpen}
            >
              {brandOptions.map((option, index) => (
                <div
                  id={`brand-option-${index}`}
                  key={`${option.value}-${option.isCustom ? "custom" : "suggested"}`}
                  role="option"
                  aria-selected={option.value.toLowerCase() === normalizedBrand}
                  className={`cursor-pointer rounded-md px-3 py-2 text-sm ${
                    activeBrandIndex === index ? "bg-muted text-foreground" : "text-foreground"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveBrandIndex(index)}
                  onClick={() => selectBrand(option.value)}
                >
                  {option.isCustom ? `Use “${option.value}” as custom brand` : option.value}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              name="model"
              maxLength={LIMITS.model}
              defaultValue={product?.model || ""}
              placeholder="e.g., A3101"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              id="type"
              name="type"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
            >
              <option value="DEVICE">Device (Individual tracking)</option>
              <option value="ACCESSORY">Accessory (Quantity-based)</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoryId">Category *</Label>
            {fieldError("categoryId")}
            <div className="flex gap-2">
              <Select
                id="categoryId"
                name="categoryId"
                required
                {...fieldProps("categoryId")}
                defaultValue={product?.categoryId || ""}
                className="flex-1"
              >
                <option value="">Select category</option>
                {categoryList.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Add a new category"
                aria-expanded={showNewCategory}
                onClick={() => setShowNewCategory(!showNewCategory)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {showNewCategory && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="New category name"
                  aria-label="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateCategory();
                    }
                  }}
                  className="flex-1"
                />
                <Button type="button" size="sm" onClick={handleCreateCategory}>
                  Add
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Condition & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Condition & Status</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {productType === "DEVICE" ? (
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                id="condition"
                name="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="BRAND_NEW">Brand New</option>
                <option value="SECONDHAND">Secondhand</option>
                <option value="FOR_PARTS">For Parts</option>
              </Select>
            </div>
          ) : (
            <div className="space-y-2 sm:col-span-2">
              <p className="text-sm text-muted-foreground">
                Condition doesn&apos;t apply to accessories.
              </p>
            </div>
          )}
          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={product?.status || "AVAILABLE"}>
                <option value="AVAILABLE">Available</option>
                <option value="RESERVED">Reserved</option>
                <option value="SOLD">Sold</option>
              </Select>
            </div>
          )}
          <div
            className="space-y-3 border-t pt-4 sm:col-span-2"
            hidden={productType !== "DEVICE" || condition !== "SECONDHAND"}
          >
            <div>
              <p className="text-sm font-medium">Secondhand Condition Checks</p>
              <p className="text-xs text-muted-foreground">Select any visible marks or device issues.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ConditionCheckbox
                id="scratchesMarkings"
                name="scratchesMarkings"
                label="Scratches/Markings"
                checked={product?.scratchesMarkings ?? false}
              />
              <ConditionCheckbox
                id="displayScratches"
                name="displayScratches"
                label="Display Scratches"
                checked={product?.displayScratches ?? false}
              />
              <ConditionCheckbox
                id="dents"
                name="dents"
                label="Dents"
                checked={product?.dents ?? false}
              />
              <div hidden={!isAppleDevice}>
                <ConditionCheckbox
                  id="serviceBattery"
                  name="serviceBattery"
                  label="Service Battery"
                  checked={product?.serviceBattery ?? false}
                />
              </div>
              <div hidden={!isAppleDevice}>
                <ConditionCheckbox
                  id="faceIdNotWorking"
                  name="faceIdNotWorking"
                  label="Face ID Not Working"
                  checked={product?.faceIdNotWorking ?? false}
                />
              </div>
            </div>
          </div>
          {productType === "DEVICE" && condition === "FOR_PARTS" && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="salvagedParts">Salvaged Parts</Label>
              <Textarea
                id="salvagedParts"
                name="salvagedParts"
                defaultValue={product?.salvagedParts || ""}
                placeholder="List which parts have already been taken/salvaged, e.g. screen, battery"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Note which parts have already been removed from this unit.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Identification (for devices) */}
      {productType === "DEVICE" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Device Identification</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                name="color"
                maxLength={LIMITS.color}
                defaultValue={product?.color || ""}
                placeholder="e.g., Midnight"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              {fieldError("serialNumber")}
              <Input
                id="serialNumber"
                name="serialNumber"
                maxLength={LIMITS.serialNumber}
                {...fieldProps("serialNumber")}
                defaultValue={product?.serialNumber || ""}
                placeholder="e.g., F9GQ3X7KPM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imei">IMEI</Label>
              {fieldError("imei")}
              <Input
                id="imei"
                name="imei"
                inputMode="numeric"
                maxLength={LIMITS.imei}
                {...fieldProps("imei")}
                defaultValue={product?.imei || ""}
                placeholder="e.g., 354789102345678"
              />
            </div>
            {isAppleDevice && (
              <div className="space-y-2">
                <Label htmlFor="batteryHealth">Battery Health (%)</Label>
                {fieldError("batteryHealth")}
                <Input
                  id="batteryHealth"
                  name="batteryHealth"
                  {...fieldProps("batteryHealth")}
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  defaultValue={product?.batteryHealth ?? ""}
                  placeholder="e.g., 92"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quantity (for accessories) */}
      {productType === "ACCESSORY" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stock Quantity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity in Stock</Label>
              {fieldError("quantity")}
              <Input
                id="quantity"
                name="quantity"
                max={LIMITS.maxQuantity}
                {...fieldProps("quantity")}
                type="number"
                min="0"
                defaultValue={product?.quantity ?? 1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
              {fieldError("lowStockThreshold")}
              <Input
                id="lowStockThreshold"
                name="lowStockThreshold"
                {...fieldProps("lowStockThreshold")}
                type="number"
                min="0"
                defaultValue={product?.lowStockThreshold ?? ""}
                placeholder="e.g., 5"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
            {fieldError("purchasePrice")}
            <Input
              id="purchasePrice"
              name="purchasePrice"
              inputMode="decimal"
              max={LIMITS.maxPrice}
              {...fieldProps("purchasePrice")}
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.purchasePrice?.toString() || ""}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sellingPrice">Selling Price ($)</Label>
            {fieldError("sellingPrice")}
            <Input
              id="sellingPrice"
              name="sellingPrice"
              inputMode="decimal"
              max={LIMITS.maxPrice}
              {...fieldProps("sellingPrice")}
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.sellingPrice?.toString() || ""}
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            name="notes"
            maxLength={LIMITS.notes}
            defaultValue={product?.notes || ""}
            placeholder="Additional details about this product..."
            rows={3}
          />
        </CardContent>
      </Card>

      {!isEdit && (
        <p className="text-sm text-muted-foreground -mt-2">
          Photos can be added once the product is created — you&apos;ll be taken to its page next.
        </p>
      )}

      {formError && !formError.field && (
        <div
          id="form-error"
          role="alert"
          tabIndex={-1}
          className="rounded-lg border border-destructive bg-card px-4 py-3 text-sm text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {formError.message}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEdit ? "Updating..." : "Creating..."}
            </>
          ) : (
            isEdit ? "Update Product" : "Create Product"
          )}
        </Button>
      </div>
    </form>
  );
}
