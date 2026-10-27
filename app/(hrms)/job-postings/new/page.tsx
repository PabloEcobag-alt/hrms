import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { JobPostingForm } from "@/components/job-postings/job-posting-form";
import { requireModule } from "@/lib/portal/staff";
import { createDraft } from "../actions";

export default async function Page() {
  await requireModule("Recruitment and Hiring");

  return (
    <div className="flex flex-col gap-md p-md sm:p-lg">
      <div>
        <Link href="/job-postings" className="flex items-center gap-xs text-body-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Job Postings
        </Link>
        <h1 className="text-headline-md">New Job Posting</h1>
        <p className="text-body-sm text-muted-foreground">Type a role freehand and save it as a Draft. It stays hidden from Careers until it is published.</p>
      </div>
      <JobPostingForm action={createDraft} />
    </div>
  );
}
