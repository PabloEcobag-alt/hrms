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
    <div className="flex flex-col gap-lg p-md sm:p-lg">
      <h1 className="text-headline-md">Edit Draft</h1>
      <JobPostingForm
        posting={posting}
        action={updateDraft.bind(null, id)}
        deleteAction={removeDraft.bind(null, id)}
      />
    </div>
  );
}
