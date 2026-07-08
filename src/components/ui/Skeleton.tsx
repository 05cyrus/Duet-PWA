import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-2xl", className)} />;
}

/** A card-shaped loading placeholder used across pages. */
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="glass space-y-3 rounded-3xl p-5">
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4" />
      ))}
    </div>
  );
}
