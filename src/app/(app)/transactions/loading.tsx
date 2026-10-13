import { ListPageSkeleton } from "@/components/ui/list-skeleton";

export default function Loading() {
  // Transactions table: Type, Product, Contact, Date, Amount, Profit
  // Filters: Type
  return <ListPageSkeleton columns={6} filters={1} />;
}
