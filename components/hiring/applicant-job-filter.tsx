"use client";

import { useRouter } from "next/navigation";
import { Briefcase, Check, ChevronDown, Info } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
      <DropdownMenuTrigger className="flex h-[34px] w-full items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm sm:w-[13.5rem]">
        <Briefcase className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">Job:</span>
        <span className="truncate font-medium">{label}</span>
        <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[14.5rem] p-1">
        <DropdownMenuLabel className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Posted jobs</DropdownMenuLabel>
        <JobItem label="All jobs" count={allCount} selected={job === undefined} onSelect={() => choose()} />
        {options.map((option) => (
          <JobItem key={option.id} label={option.title} count={option.applicationCount} selected={option.id === job} onSelect={() => choose(option.id)} />
        ))}
        <p className="mt-1 flex gap-2 border-t px-2 pt-2 pb-1 text-[11px] text-muted-foreground">
          <Info className="mt-px size-3 shrink-0" />
          Only open jobs are listed. Drafts, closed and filled jobs are hidden.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function JobItem({ label, count, selected, onSelect }: { label: string; count?: number; selected: boolean; onSelect: () => void }) {
  return (
    <DropdownMenuItem onSelect={onSelect} aria-current={selected ? "true" : undefined} className="gap-2 text-[13px]">
      <span className="truncate">{label}</span>
      {count !== undefined && <span className="ml-auto text-xs text-muted-foreground">{count}</span>}
      <Check className={selected ? "size-4 text-primary" : "size-4 opacity-0"} />
    </DropdownMenuItem>
  );
}
