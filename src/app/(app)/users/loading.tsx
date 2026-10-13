import { ListPageSkeleton } from "@/components/ui/list-skeleton";

export default function Loading() {
  // Users table: Name, Email, Role, Joined, Actions (no standalone filter row)
  return <ListPageSkeleton columns={5} filters={0} />;
}
