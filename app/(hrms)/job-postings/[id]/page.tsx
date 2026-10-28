import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE, STATUS_LABEL } from "@/lib/job-posting-view";
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
      {posting.status === "draft" && (
        <JobPostingForm
          posting={posting}
          action={updateDraft.bind(null, id)}
          deleteAction={removeDraft.bind(null, id)}
          canPublish
          saveTemplateAction={saveAsTemplate}
        />
      )}
      {posting.status === "open" && (
        <JobPostingForm
          posting={posting}
          action={updateOpen.bind(null, id)}
          closeAction={closePosting.bind(null, id)}
          fillAction={fillPosting.bind(null, id)}
          saveTemplateAction={saveAsTemplate}
        />
      )}
      {(posting.status === "closed" || posting.status === "filled") && (
        <JobPostingForm posting={posting} readOnly />
      )}
    </div>
  );
}
