import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface ListPageSkeletonProps {
  /** Number of table columns to mimic. */
  columns?: number;
  /** Number of placeholder rows to render. */
  rows?: number;
  /** Number of filter dropdowns shown above the table. */
  filters?: number;
  /** Reserve the row for a segmented switch (inventory's Units / Accessories). */
  switcher?: boolean;
}

/**
 * Loading placeholder for list pages (inventory, transactions, contacts,
 * users). Mirrors the header + toolbar + filters + table layout so the page
 * doesn't shift when real content streams in.
 */
export function ListPageSkeleton({
  columns = 6,
  rows = 8,
  filters = 1,
  switcher = false,
}: ListPageSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-1 h-6 w-64" />
      </div>

      <div className="space-y-4">
        {/* Toolbar: search + primary action */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <Skeleton className="h-10 pointer-coarse:h-11 w-full max-w-md" />
          <Skeleton className="h-10 pointer-coarse:h-11 w-36" />
        </div>

        {switcher && <Skeleton className="h-11 w-56 rounded-lg" />}

        {/* Filters */}
        {filters > 0 && (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: filters }).map((_, i) => (
              <Skeleton key={i} className="h-10 pointer-coarse:h-11 w-36" />
            ))}
          </div>
        )}

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {/* Header row */}
            <div className="flex items-center gap-4 border-b px-4 h-11">
              {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
            {/* Body rows */}
            {Array.from({ length: rows }).map((_, r) => (
              <div
                key={r}
                className="flex items-center gap-4 border-b last:border-0 px-4 py-3.5"
              >
                {Array.from({ length: columns }).map((_, c) => (
                  <Skeleton key={c} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
