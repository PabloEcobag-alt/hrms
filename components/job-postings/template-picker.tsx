"use client";

import Link from "next/link";
import { useState } from "react";
import { Briefcase, Bookmark, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type TemplateOption = {
  id: string;
  title: string;
  department: string;
  employmentType: string;
  location: string;
  salaryFrom: number | null;
  salaryTo: number | null;
};

const peso = (amount: number) => amount.toLocaleString("en-PH");

/** "Production · Full-time · Main kitchen · ₱16,000–18,000"; unset parts are left out. */
function describe(template: TemplateOption) {
  const { salaryFrom, salaryTo } = template;
  const salary =
    salaryFrom !== null && salaryTo !== null
      ? `₱${peso(salaryFrom)}–${peso(salaryTo)}`
      : salaryFrom !== null
        ? `From ₱${peso(salaryFrom)}`
        : salaryTo !== null
          ? `Up to ₱${peso(salaryTo)}`
          : "";
  return [template.department, template.employmentType, template.location, salary].filter(Boolean).join(" · ");
}

/** The Job title input with a "Templates" dropdown; picking one starts the posting from that template. */
export function TitleCombobox({
  defaultValue,
  templates,
  ...aria
}: {
  defaultValue?: string;
  templates: TemplateOption[];
} & React.AriaAttributes) {
  const [open, setOpen] = useState(false);
  const empty = templates.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="flex overflow-hidden rounded-lg border border-[#e4e4e7] bg-white focus-within:border-[#8b5cf6] has-[[aria-invalid=true]]:border-destructive">
          <input
            id="title"
            name="title"
            {...aria}
            defaultValue={defaultValue}
            placeholder="e.g. Production Staff"
            className="min-w-0 flex-1 bg-transparent px-[12px] py-[10px] text-sm text-[#18181b] outline-none placeholder:text-[#a1a1aa]"
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={empty}
              className={cn(
                "flex shrink-0 cursor-pointer items-center gap-[6px] self-stretch border-l border-[#e4e4e7] pl-[14px] pr-[12px] text-[13px] font-medium text-primary",
                open ? "bg-[#f5f0ff]" : "bg-white",
                empty && "cursor-not-allowed bg-[#fafafa] text-[#a1a1aa]",
              )}
            >
              <Bookmark className="size-[14px]" />
              Templates ({templates.length})
              <ChevronDown className="size-4" />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={0}
        className="flex w-[var(--radix-popper-anchor-width)] flex-col gap-[2px] rounded-[10px] border-[#e4e4e7] p-[6px] shadow-[0_1px_1.5px_rgba(0,0,0,0.06),0_8px_12px_rgba(0,0,0,0.1)]"
      >
        <div className="flex items-center gap-sm px-[10px] pb-[6px] pt-[8px]">
          <p className="flex-1 text-[11px] font-semibold uppercase text-[#a1a1aa]">Saved templates</p>
          <p className="text-xs text-[#71717a]">Picking one fills in the form</p>
        </div>
        {templates.map((template) => (
          <Link
            key={template.id}
            href={`/job-postings/new?template=${template.id}`}
            className="flex items-center gap-[12px] rounded-md px-[10px] py-[9px] hover:bg-[#f4f4f5]"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-primary">
              <Briefcase className="size-4" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <span className="truncate text-sm font-medium text-[#18181b]">{template.title || "Untitled template"}</span>
              <span className="truncate text-xs text-[#71717a]">{describe(template)}</span>
            </span>
          </Link>
        ))}
        <div className="my-[2px] h-px bg-[#ebebeb]" />
        <Link
          href="/job-templates"
          className="flex items-center gap-sm rounded-md px-[10px] py-[9px] text-[13px] font-medium text-primary hover:bg-[#f4f4f5]"
        >
          <SlidersHorizontal className="size-4" />
          Manage templates
        </Link>
      </PopoverContent>
    </Popover>
  );
}
