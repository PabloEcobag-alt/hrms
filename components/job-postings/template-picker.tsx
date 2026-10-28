"use client";

import Link from "next/link";
import { Bookmark, ChevronDown, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { templateSummary } from "@/lib/job-posting-form";
import type { JobTemplate } from "@/lib/job-postings";

/** The Templates (N) dropdown in the Job title field. Choosing one fills the form; nothing links back to it. */
export function TemplatePicker({
  templates,
  onPick,
}: {
  templates: JobTemplate[];
  onPick: (template: JobTemplate) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-7 gap-xs border-l rounded-none">
          <Bookmark className="h-4 w-4" /> Templates ({templates.length})
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-80">
        {templates.length === 0 ? (
          <p className="px-sm py-md text-center text-body-sm text-muted-foreground">
            No templates yet. Save one with “Save as template” on a Job Posting.
          </p>
        ) : (
          <>
            <DropdownMenuLabel className="flex justify-between text-xs font-normal uppercase text-muted-foreground">
              Saved templates
              <span className="normal-case">Picking one fills in the form</span>
            </DropdownMenuLabel>
            {templates.map((template) => (
              <DropdownMenuItem key={template.id} onSelect={() => onPick(template)} className="flex-col items-start gap-0">
                <span className="font-medium">{template.title || template.name || "Untitled template"}</span>
                <span className="text-body-sm text-muted-foreground">{templateSummary(template)}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/job-templates" className="text-primary">
            <Settings2 className="h-4 w-4" /> Manage templates
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
