import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  /** Number of placeholder rows. */
  rows?: number;
  showToolbar?: boolean;
  /** Number of placeholder columns. */
  columns?: number;
}

/**
 * Loading placeholder for table/list content.
 *
 * Renders a shimmering search bar, header row, and body rows so tables fade in
 * as skeletons instead of showing a spinner icon.
 */
export function TableSkeleton({ rows = 8, columns = 5, showToolbar = true }: TableSkeletonProps) {
  return (
    <div
      className="animate-in fade-in duration-300 space-y-md"
      role="status"
      aria-label="Loading table"
      data-testid="table-skeleton"
    >
      {/* Search / toolbar row */}
      {showToolbar && <div className="flex items-center justify-between gap-md">
        <Skeleton className="h-9 w-full max-w-[20rem] rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>}

      {/* Header row */}
      <div className="flex items-center gap-md border-b border-border pb-sm">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1 rounded" />
        ))}
      </div>

      {/* Body rows */}
      <div className="space-y-sm">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`r-${r}`} className="flex items-center gap-md py-sm">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={`c-${r}-${c}`}
                className="h-4 flex-1 rounded"
                style={{ maxWidth: c === 0 ? "100%" : `${70 + ((r + c) * 7) % 30}%` }}
              />
            ))}
          </div>
        ))}
      </div>

      <span className="sr-only">Loading&#x2026;</span>
    </div>
  );
}
