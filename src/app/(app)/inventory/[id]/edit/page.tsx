import { notFound } from "next/navigation";
import { getProduct, getCategories } from "../../actions";
import { ProductForm } from "../../product-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProduct(id),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Product</h1>
        <p className="text-muted-foreground mt-1">
          Update {product.name}
        </p>
      </div>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
