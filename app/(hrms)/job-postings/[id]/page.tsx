import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE, STATUS_LABEL } from "@/lib/job-posting-view";
import { editFooter } from "@/lib/job-posting-form";
import { JobPostingForm } from "@/components/job-postings/job-posting-form";
import { postingsForRequest } from "@/lib/portal/postings";
import { requireModule } from "@/lib/portal/staff";
import { saveAsTemplate } from "../../job-templates/actions";
import {
  closePosting,
  fillPosting,
  removeDraft,
  updateDraft,
  updateOpen,
} from "../actions";

const INTRO = {
  draft: "This Job Posting is a Draft, so it is still hidden from Careers.",
  open: "This Job Posting is Published and visible on Careers.",
  closed:
    "This Job Posting is Closed. It can no longer be changed or reopened.",
  filled:
    "This Job Posting is Filled. It can no longer be changed or reopened.",
} as const;

export default async function Page({
  params,
}: PageProps<"/job-postings/[id]">) {
  await requireModule("Recruitment and Hiring");
  const { id } = await params;
  const posting = await (await postingsForRequest()).read(id);

  if (!posting) notFound();
  const footer = editFooter(posting.status);

  return (
    <div className="flex flex-col gap-md p-md sm:p-lg">
      <div>
        <Link
          href="/job-postings"
          className="flex items-center gap-xs text-body-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Job Postings
        </Link>
        <div className="flex items-center gap-sm">
          <h1 className="text-headline-md">
            {posting.status === "draft" ? "Edit Job Posting" : posting.title}
          </h1>
          <Badge variant={STATUS_BADGE[posting.status]}>
            {STATUS_LABEL[posting.status]}
          </Badge>
        </div>
        <p className="text-body-sm text-muted-foreground">
          {INTRO[posting.status]}
        </p>
      </div>
      <JobPostingForm
        posting={posting}
        action={
          footer.saveAsDraft
            ? updateDraft.bind(null, id)
            : footer.saveChanges
              ? updateOpen.bind(null, id)
              : undefined
        }
        deleteAction={footer.delete ? removeDraft.bind(null, id) : undefined}
        closeAction={footer.close ? closePosting.bind(null, id) : undefined}
        fillAction={footer.fill ? fillPosting.bind(null, id) : undefined}
        canPublish={footer.publish}
        readOnly={!footer.saveAsDraft && !footer.saveChanges}
        saveTemplateAction={saveAsTemplate}
      />
    </div>
  );
}
