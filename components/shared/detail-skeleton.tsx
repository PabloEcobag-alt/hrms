import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface DetailSkeletonProps {
  /** Number of placeholder info/section cards. */
  cards?: number;
}

/**
 * Loading placeholder for detail / full-screen pages.
 *
 * Renders a shimmering title block and a set of section cards so detail pages
 * fade in as skeletons instead of showing a spinner icon.
 */
export function DetailSkeleton({ cards = 3 }: DetailSkeletonProps) {
  return (
    <div
      className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto animate-in fade-in duration-300"
      role="status"
      aria-label="Loading"
      data-testid="detail-skeleton"
    >
      {/* Back button placeholder */}
      <Skeleton className="h-8 w-28 rounded-md" />

      {/* Title block */}
      <div className="space-y-sm">
        <Skeleton className="h-8 w-64 rounded" />
        <Skeleton className="h-4 w-96 max-w-full rounded" />
      </div>

      {/* Section cards */}
      <div className="grid gap-lg md:grid-cols-2">
        {Array.from({ length: cards }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border p-lg space-y-md"
          >
            <Skeleton className="h-5 w-40 rounded" />
            <div className="space-y-sm">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Loading&#x2026;</span>
    </div>
  );
}
