"use client";

import { useRouter } from "next/navigation";
import { Briefcase, Check, ChevronDown, Info } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { applicantsHref } from "@/lib/application-view";
import type { ApplicationJobPostingOption, ApplicationTab } from "@/lib/applications";

type Props = {
  stage: ApplicationTab;
  search?: string;
  job?: string;
  options: ApplicationJobPostingOption[];
  /** Every Application across all jobs; only known while no job is chosen. */
  allCount?: number;
};

/** Job lives in the URL beside Stage and search; choosing one keeps both and returns to page 1. */
export function ApplicantJobFilter({ stage, search, job, options, allCount }: Props) {
  const router = useRouter();
  // A job that is no longer Open still filters, even though it is not listed.
  const label = job === undefined ? "All jobs" : (options.find((option) => option.id === job)?.title ?? "Unlisted job");
  const choose = (next?: string) => router.push(applicantsHref({ stage, search, job: next }));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-[34px] w-full items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm sm:w-[300px] data-[state=open]:border-[#8b5cf6] data-[state=open]:shadow-[0_0_0_.5px_#8b5cf6]">
        <Briefcase className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">Job:</span>
        <span className="truncate font-medium">{label}</span>
        <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[min(340px,calc(100vw-2rem))] gap-[2px] rounded-[10px] border-[#e4e4e7] p-[6px] shadow-[0_1px_1.5px_rgba(0,0,0,0.06),0_8px_12px_rgba(0,0,0,0.1)]">
        <DropdownMenuLabel className="px-[10px] pb-[6px] pt-[8px] text-[11px] font-semibold uppercase text-[#a1a1aa]">Posted jobs</DropdownMenuLabel>
        <JobItem label="All jobs" count={allCount} selected={job === undefined} onSelect={() => choose()} />
        {options.map((option) => (
          <JobItem key={option.id} label={option.title} count={option.applicationCount} selected={option.id === job} onSelect={() => choose(option.id)} />
        ))}
        <DropdownMenuSeparator className="mx-0 my-0 bg-[#ebebeb]" />
        <p className="flex gap-2 px-[10px] py-2 text-xs text-[#71717a]">
          <Info className="size-[14px] shrink-0" />
          Only open jobs are listed. Drafts, closed and filled jobs are hidden.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function JobItem({ label, count, selected, onSelect }: { label: string; count?: number; selected: boolean; onSelect: () => void }) {
  return (
    <DropdownMenuItem onSelect={onSelect} aria-current={selected ? "true" : undefined} className={cn("gap-[10px] rounded-[6px] px-[10px] py-[9px] text-sm", selected && "bg-[#f4f4f5] font-medium")}>
      <span className="truncate">{label}</span>
      {count !== undefined && <span className="ml-auto text-xs font-normal text-[#71717a]">{count}</span>}
      <Check className={selected ? "size-4 text-primary" : "size-4 opacity-0"} />
    </DropdownMenuItem>
  );
}
