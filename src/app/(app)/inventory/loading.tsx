import { ListPageSkeleton } from "@/components/ui/list-skeleton";

export default function Loading() {
  // Inventory table: Product, Category, Condition (or Qty), Status, Price, Actions
  // Filters: Category, Condition, Status, Sort
  return <ListPageSkeleton columns={6} filters={4} switcher />;
}
