import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { JobPostingForm } from "@/components/job-postings/job-posting-form";
import { requireModule } from "@/lib/portal/staff";
import { createTemplate } from "../actions";

export default async function Page() {
  await requireModule("Recruitment and Hiring");

  return (
    <div className="flex flex-col gap-md p-md sm:p-lg">
      <div>
        <Link
          href="/job-templates"
          className="flex items-center gap-xs text-body-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Job Templates
        </Link>
        <h1 className="text-headline-md">New Job Template</h1>
        <p className="text-body-sm text-muted-foreground">
          Save a role you post often. Nothing is required.
        </p>
      </div>
      <JobPostingForm template action={createTemplate} />
    </div>
  );
}
