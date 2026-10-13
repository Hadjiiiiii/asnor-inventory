import { ListPageSkeleton } from "@/components/ui/list-skeleton";

export default function Loading() {
  // Contacts table: Name, Type, Phone, Email, Transactions, Actions
  // Filters: Type
  return <ListPageSkeleton columns={6} filters={1} />;
}
