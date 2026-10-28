"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Card } from "@/components/ui/card";
import { STATUS_FILTERS } from "@/lib/job-posting-view";

/** Filter and search live in the URL, so the server renders exactly what the link says. */
export function JobPostingFilters({ counts, children }: { counts: Record<string, number>; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [optimisticParams, setOptimisticParams] = useOptimistic(params.toString());
  const status = new URLSearchParams(optimisticParams).get("status") ?? "";
  const [query, setQuery] = useState(params.get("q") ?? "");

  function update(next: { status?: string; q?: string }) {
    const search = new URLSearchParams(optimisticParams);
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
      else search.delete(key);
    }
    const qs = search.toString();
    startTransition(() => {
      setOptimisticParams(qs);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  return (
    <>
      <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={status} onValueChange={(status) => update({ status })}>
          <TabsList className="h-auto gap-xs bg-transparent p-0">
            {STATUS_FILTERS.map((filter) => (
              <TabsTrigger
                key={filter.value}
                value={filter.value}
                className="rounded-lg px-[14px] py-[8px] text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                {filter.label} {counts[filter.value] ?? 0}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <form
          className="relative w-full sm:max-w-[20rem]"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            update({ q: query.trim() });
          }}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            aria-label="Search Job Postings by title"
            placeholder="Search by title…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </form>
      </div>
      <div aria-busy={pending}>
        {pending ? <Card className="p-md"><TableSkeleton columns={4} showToolbar={false} /></Card> : children}
      </div>
    </>
  );
}
