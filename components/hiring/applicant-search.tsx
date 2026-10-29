"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { applicantsHref } from "@/lib/application-view";
import type { ApplicationTab } from "@/lib/applications";

const DEBOUNCE_MS = 300;

/** Search lives in the URL beside the Stage tab; typing waits for a pause, keeps the tab and returns to page 1. */
export function ApplicantSearch({ stage, search }: { stage: ApplicationTab; search: string }) {
  const router = useRouter();
  const [value, setValue] = useState(search);
  const applied = useRef(search);

  useEffect(() => {
    const next = value.trim();
    if (next === applied.current) return;
    const timer = setTimeout(() => {
      applied.current = next;
      router.replace(applicantsHref({ stage, search: next }), { scroll: false });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, stage, router]);

  return (
    <form role="search" className="relative w-full sm:max-w-[16rem]" onSubmit={(event) => event.preventDefault()}>
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        name="q"
        aria-label="Search applicants by name or email"
        placeholder="Search name or email"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-[34px] rounded-lg pl-9"
      />
    </form>
  );
}
