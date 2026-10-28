import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { JobPostingForm } from "@/components/job-postings/job-posting-form";
import { JobTemplateError } from "@/lib/job-postings";
import { requireModule } from "@/lib/portal/staff";
import { templatesForRequest } from "@/lib/portal/templates";
import { saveAsTemplate } from "../../job-templates/actions";
import { createDraft } from "../actions";

export default async function Page({
  searchParams,
}: PageProps<"/job-postings/new">) {
  await requireModule("Recruitment and Hiring");
  const { template: param } = await searchParams;
  const templateId = Array.isArray(param) ? param[0] : param;
  let template;
  let unavailable = false;
  if (templateId) {
    try {
      template = (await (await templatesForRequest()).list()).find(
        (t) => t.id === templateId,
      );
    } catch (error) {
      if (!(error instanceof JobTemplateError)) throw error;
      unavailable = true;
    }
  }

  return (
    <div className="flex flex-col gap-md p-md sm:p-lg">
      <div>
        <Link
          href="/job-postings"
          className="flex items-center gap-xs text-body-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Job Postings
        </Link>
        <h1 className="text-headline-md">New Job Posting</h1>
        <p className="text-body-sm text-muted-foreground">
          {template
            ? `Started from the template “${template.title || "Untitled template"}”. Edit anything, then choose a deadline; the template stays as it was.`
            : "Type a role freehand and save it as a Draft or publish it right away. A Draft stays hidden from Careers until it is published."}
        </p>
        {templateId && !template && (
          <p role="alert" className="text-body-sm text-destructive">
            {unavailable
              ? "That Job Template could not be loaded."
              : "That Job Template no longer exists."}{" "}
            You can still type a role freehand.
          </p>
        )}
        <Link
          href="/job-templates"
          className="text-body-sm text-primary hover:underline"
        >
          {template
            ? "Choose a different template"
            : "Start from a Job Template"}
        </Link>
      </div>
      <JobPostingForm
        action={createDraft}
        isNew
        posting={template && { ...template, deadline: null }}
        saveTemplateAction={saveAsTemplate}
      />
    </div>
  );
}
