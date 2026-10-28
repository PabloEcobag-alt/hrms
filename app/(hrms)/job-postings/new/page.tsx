import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { JobPostingForm } from "@/components/job-postings/job-posting-form";
import { JobTemplateError } from "@/lib/job-postings";
import { requireModule } from "@/lib/portal/staff";
import { templatesForRequest } from "@/lib/portal/templates";
import { saveAsTemplate } from "../../job-templates/actions";
import { createDraft } from "../actions";

export default async function Page() {
  await requireModule("Recruitment and Hiring");
  // A failed lookup just leaves the picker empty; the form still works freehand.
  const templates = await (await templatesForRequest()).list().catch((error) => {
    if (!(error instanceof JobTemplateError)) throw error;
    return [];
  });

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
          Type a role freehand, or pick a template in the Title field. Save it as a Draft or publish it right away. A
          Draft stays hidden from Careers until it is published.
        </p>
      </div>
      <JobPostingForm
        action={createDraft}
        isNew
        saveTemplateAction={saveAsTemplate}
        templates={templates}
      />
    </div>
  );
}
