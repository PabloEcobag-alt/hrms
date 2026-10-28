import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { JobPostingForm } from "@/components/job-postings/job-posting-form";
import { JobTemplateError, type JobTemplate } from "@/lib/job-postings";
import { requireModule } from "@/lib/portal/staff";
import { templatesForRequest } from "@/lib/portal/templates";
import { createDraft } from "../actions";

export default async function Page({
  searchParams,
}: PageProps<"/job-postings/new">) {
  await requireModule("Recruitment and Hiring");
  const { template: param } = await searchParams;
  const templateId = Array.isArray(param) ? param[0] : param;
  let templates: JobTemplate[] = [];
  let unavailable = false;
  try {
    templates = await (await templatesForRequest()).list();
  } catch (error) {
    if (!(error instanceof JobTemplateError)) throw error;
    unavailable = true;
  }
  const template = templateId
    ? templates.find((t) => t.id === templateId)
    : undefined;

  return (
    <div className="flex flex-col gap-md px-md pt-[20px] sm:px-xl">
      <div className="flex flex-col gap-xs">
        <Link
          href="/job-postings"
          className="flex w-fit items-center gap-xs text-[13px] font-medium text-[#71717a] hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Job postings
        </Link>
        <h1 className="text-2xl font-semibold text-[#18181b]">New job posting</h1>
        <p className="text-sm text-[#71717a]">
          Published jobs appear on your careers page. Drafts stay private until
          you publish them.
        </p>
        {template && (
          <p className="text-sm text-[#71717a]">
            Started from the template “{template.title || "Untitled template"}”.
            Choose a deadline; the template stays as it was.
          </p>
        )}
        {templateId && !template && (
          <p role="alert" className="text-sm text-destructive">
            {unavailable
              ? "That Job Template could not be loaded."
              : "That Job Template no longer exists."}{" "}
            You can still type a role freehand.
          </p>
        )}
      </div>
      <JobPostingForm
        action={createDraft}
        isNew
        posting={template && { ...template, deadline: null }}
        canSaveTemplate
        templates={templates.map((t) => ({
          id: t.id,
          title: t.title,
          department: t.department,
          employmentType: t.employmentType,
          location: t.location,
          salaryFrom: t.salaryFrom,
          salaryTo: t.salaryTo,
        }))}
      />
    </div>
  );
}
