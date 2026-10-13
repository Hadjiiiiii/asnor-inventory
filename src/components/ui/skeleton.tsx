import { cn } from "@/lib/utils";

/**
 * Base skeleton block. Use to build placeholder loading states that match
 * the shape of the content being loaded.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
