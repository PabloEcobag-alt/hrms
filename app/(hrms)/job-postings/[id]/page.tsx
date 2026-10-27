import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { JobPostingForm } from "@/components/job-postings/job-posting-form";
import { canDelete } from "@/lib/job-posting-view";
import { postingsForRequest } from "@/lib/portal/postings";
import { requireModule } from "@/lib/portal/staff";
import { removeDraft, updateDraft } from "../actions";

export default async function Page({ params }: PageProps<"/job-postings/[id]">) {
  await requireModule("Recruitment and Hiring");
  const { id } = await params;
  const posting = await (await postingsForRequest()).read(id);

  if (!posting) notFound();
  // Only a Draft can be edited here; anything else goes back to the list.
  if (!canDelete(posting.status)) redirect("/job-postings");

  return (
    <div className="flex flex-col gap-md p-md sm:p-lg">
      <div>
        <Link href="/job-postings" className="flex items-center gap-xs text-body-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Job Postings
        </Link>
        <h1 className="text-headline-md">Edit Job Posting</h1>
        <p className="text-body-sm text-muted-foreground">This Job Posting is a Draft, so it is still hidden from Careers.</p>
      </div>
      <JobPostingForm
        posting={posting}
        action={updateDraft.bind(null, id)}
        deleteAction={removeDraft.bind(null, id)}
      />
    </div>
  );
}
