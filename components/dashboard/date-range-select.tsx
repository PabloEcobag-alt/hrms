"use client";

import { useRouter } from "next/navigation";
import { Calendar, Check, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RANGE_OPTIONS, type RangeId } from "@/lib/dashboard";

/** The Dashboard Range lives in the URL, so a refresh or a shared link keeps it; a preset applies at once. */
export function DateRangeSelect({ selected, label }: { selected: RangeId; label: string }) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-[34px] w-full items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm sm:w-auto data-[state=open]:border-[#8b5cf6] data-[state=open]:shadow-[0_0_0_.5px_#8b5cf6]">
        <Calendar className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">{label}</span>
        <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(220px,calc(100vw-2rem))] gap-[2px] rounded-[10px] border-[#e4e4e7] p-[6px] shadow-[0_1px_1.5px_rgba(0,0,0,0.06),0_8px_12px_rgba(0,0,0,0.1)]">
        {RANGE_OPTIONS.map((option) => (
          <DropdownMenuItem key={option.id} onSelect={() => router.push(`/dashboard?range=${option.id}`)} className="justify-between">
            {option.name}
            {option.id === selected && <Check className="size-4" aria-label="Selected" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
