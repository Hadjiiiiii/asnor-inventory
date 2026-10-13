import { redirect } from "next/navigation";
import { getProducts, getCategories } from "./actions";
import { InventoryList } from "./inventory-list";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    search?: string;
    category?: string;
    condition?: string;
    status?: string;
    type?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function InventoryPage({ searchParams }: Props) {
  const params = await searchParams;
  // ?page=abc, 0 or -3 would otherwise reach the query as NaN or a negative offset.
  const requestedPage = Number.parseInt(params.page ?? "", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  // Default to Units (devices) view when no type is specified, matching the
  // Units/Accessories switch default in the list component.
  const type = params.type === "ACCESSORY" ? "ACCESSORY" : "DEVICE";

  const [{ products, total, pages, currentPage }, categories] = await Promise.all([
    getProducts({
      search: params.search,
      category: params.category,
      condition: params.condition,
      status: params.status,
      type,
      sortBy: params.sort,
      page,
    }),
    getCategories(),
  ]);

  // A bookmarked or stale page number past the end (after deletes or a filter) lands on the last page,
  // not on an empty state that claims there are no products.
  if (total > 0 && page > pages) {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => typeof v === "string") as [string, string][]);
    query.set("page", String(pages));
    redirect(`/inventory?${query.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <p className="text-muted-foreground mt-1">
          Manage your products and stock levels
        </p>
      </div>
      <InventoryList
        products={products}
        categories={categories}
        total={total}
        pages={pages}
        currentPage={currentPage}
      />
    </div>
  );
}
