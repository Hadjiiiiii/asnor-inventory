"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  /** Route to navigate within, e.g. "/contacts". Existing query params are kept. */
  basePath: string;
  currentPage: number;
  pages: number;
  total: number;
  pageSize: number;
  className?: string;
}

/** Previous/next controls with names, so they are usable without seeing the chevrons. */
export function Pagination({ basePath, currentPage, pages, total, pageSize, className }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  if (pages <= 1) return null;

  function go(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-between gap-3", className)}>
      <p className="text-sm text-muted-foreground">
        Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)} of {total}
      </p>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          aria-label="Previous page"
          disabled={currentPage <= 1}
          onClick={() => go(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-label="Next page"
          disabled={currentPage >= pages}
          onClick={() => go(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
