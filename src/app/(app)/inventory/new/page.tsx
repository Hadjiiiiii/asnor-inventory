import { getCategories } from "../actions";
import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add Product</h1>
        <p className="text-muted-foreground mt-1">
          Add a new item to your inventory
        </p>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
