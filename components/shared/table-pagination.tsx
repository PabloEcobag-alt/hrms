"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** The single, shared page size for every list table in the app. */
export const TABLE_PAGE_SIZE = 20;

export interface ClientPagination<T> {
  page: number;
  totalPages: number;
  pageItems: T[];
  total: number;
  rangeStart: number;
  rangeEnd: number;
  setPage: (page: number) => void;
  goPrev: () => void;
  goNext: () => void;
}

/**
 * Client-side pagination over an in-memory array, shared by every list table so
 * paging behaves identically everywhere. Clamps the current page when the data
 * shrinks (e.g. after filtering) and exposes the visible slice plus the
 * "Showing X–Y of Z" range for the footer.
 */
export function useClientPagination<T>(
  items: T[],
  pageSize: number = TABLE_PAGE_SIZE
): ClientPagination<T> {
  const [page, setPage] = useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((current - 1) * pageSize, current * pageSize),
    [items, current, pageSize]
  );

  return {
    page: current,
    totalPages,
    pageItems,
    total,
    rangeStart: total === 0 ? 0 : (current - 1) * pageSize + 1,
    rangeEnd: Math.min(current * pageSize, total),
    setPage,
    goPrev: () => setPage((p) => Math.max(1, p - 1)),
    goNext: () => setPage((p) => Math.min(totalPages, p + 1)),
  };
}

interface TablePaginationProps {
  pagination: ClientPagination<unknown>;
  /** Noun for the range summary, e.g. "companies". Defaults to "items". */
  itemLabel?: string;
}

/**
 * Uniform pagination footer: "Showing X–Y of Z <label>" on the left, prev/next
 * with the current page indicator on the right. Rendered beneath a
 * `<ScrollableTable>` so all list pages share the same paged layout.
 */
export function TablePagination({
  pagination,
  itemLabel = "items",
}: TablePaginationProps) {
  const { page, totalPages, total, rangeStart, rangeEnd, goPrev, goNext } =
    pagination;

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm text-muted-foreground">
        {total === 0
          ? `No ${itemLabel}`
          : `Showing ${rangeStart}–${rangeEnd} of ${total} ${itemLabel}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          aria-label="Previous page"
          onClick={goPrev}
          disabled={page <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          aria-label="Next page"
          onClick={goNext}
          disabled={page >= totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
