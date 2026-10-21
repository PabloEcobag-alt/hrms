import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A fixed-height frame for data tables so every table across the app has the
 * SAME size regardless of row count. It is the single scroll container for BOTH
 * axes: rows scroll vertically and wide tables scroll horizontally, with the
 * horizontal scrollbar pinned to the BOTTOM of the fixed frame (always visible,
 * not buried at the end of the scrolled content). Keep the header sticky
 * (`sticky top-0 bg-background z-10` on `<TableHeader>`) so labels stay put.
 *
 * Height is fixed (not `max-h`) on purpose: a 3-row table and a 50-row table
 * occupy the same vertical space, giving list pages a consistent layout. Pair
 * with `<TablePagination>` beneath it for a uniform paged list.
 *
 * The shared `<Table>` wraps its `<table>` in its own `overflow-auto` div; the
 * `[&>div]:overflow-visible` override collapses that inner scroller so THIS
 * frame is the only one that scrolls - otherwise the horizontal bar would sit
 * at the content bottom instead of the frame bottom.
 */
export const SCROLL_TABLE_HEIGHT = "h-[560px]";

export function ScrollableTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        SCROLL_TABLE_HEIGHT,
        "overflow-auto border border-border rounded-lg",
        "[&>div]:overflow-visible",
        className
      )}
    >
      {children}
    </div>
  );
}
