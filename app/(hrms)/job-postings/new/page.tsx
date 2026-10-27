import { JobPostingForm } from "@/components/job-postings/job-posting-form";
import { requireModule } from "@/lib/portal/staff";
import { createDraft } from "../actions";

export default async function Page() {
  await requireModule("Recruitment and Hiring");

  return (
    <div className="flex flex-col gap-lg p-md sm:p-lg">
      <h1 className="text-headline-md">New Job Posting</h1>
      <JobPostingForm action={createDraft} />
    </div>
  );
}
