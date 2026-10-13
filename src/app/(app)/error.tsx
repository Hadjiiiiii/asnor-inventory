"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <h1 className="text-2xl font-semibold">This page couldn&apos;t load</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Something went wrong on our side, or the connection dropped. Nothing you saved has been lost.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={() => unstable_retry()} className={buttonVariants()}>
          Try again
        </button>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
