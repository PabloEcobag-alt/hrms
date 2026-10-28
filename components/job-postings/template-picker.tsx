"use client";

import Link from "next/link";
import { Bookmark, Briefcase, ChevronDown, Settings2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { templateSummary } from "@/lib/job-posting-form";
import type { JobTemplate } from "@/lib/job-postings";
import { cn } from "@/lib/utils";

/** The Templates (N) dropdown in the Job title field. Choosing one fills the form; nothing links back to it. */
export function TemplatePicker({
  templates,
  onPick,
}: {
  templates: JobTemplate[];
  onPick: (template: JobTemplate) => void;
}) {
  const empty = templates.length === 0;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={empty}
        className={cn(
          "flex shrink-0 cursor-pointer items-center gap-[6px] self-stretch border-l border-[#e4e4e7] bg-white pl-[14px] pr-[12px] text-[13px] font-medium text-primary data-[state=open]:bg-[#f5f0ff]",
          empty && "cursor-not-allowed bg-[#fafafa] text-[#a1a1aa]",
        )}
      >
        <Bookmark className="size-[14px]" />
        Templates ({templates.length})
        <ChevronDown className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="flex w-[min(662px,calc(100vw-2rem))] flex-col gap-[2px] rounded-[10px] border-[#e4e4e7] p-[6px]"
      >
        <div className="flex items-center gap-sm px-[10px] pb-[6px] pt-[8px]">
          <p className="flex-1 text-[11px] font-semibold uppercase text-[#a1a1aa]">Saved templates</p>
          <p className="text-xs text-[#71717a]">Picking one fills in the form</p>
        </div>
        {templates.map((template) => (
          <DropdownMenuItem
            key={template.id}
            onSelect={() => onPick(template)}
            className="gap-[12px] rounded-md px-[10px] py-[9px]"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
              <Briefcase className="size-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <span className="truncate text-sm font-medium text-[#18181b]">
                {template.title || template.name || "Untitled template"}
              </span>
              <span className="truncate text-xs text-[#71717a]">{templateSummary(template)}</span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="my-[2px] bg-[#ebebeb]" />
        <DropdownMenuItem asChild className="gap-sm rounded-md px-[10px] py-[9px]">
          <Link href="/job-templates" className="text-[13px] font-medium text-primary">
            <Settings2 className="size-4" /> Manage templates
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
