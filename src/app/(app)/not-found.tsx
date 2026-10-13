import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <h1 className="text-2xl font-semibold">We couldn&apos;t find that</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        It may have been deleted, or the link is out of date.
      </p>
      <Link href="/inventory" className={buttonVariants({ className: "mt-6" })}>
        Back to inventory
      </Link>
    </div>
  );
}
