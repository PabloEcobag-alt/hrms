import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteDraftButton } from "@/components/job-postings/delete-draft-button";
import { JobPostingFilters } from "@/components/job-postings/job-posting-filters";
import { canDelete, STATUS_LABEL, statusFromParam } from "@/lib/job-posting-view";
import { JobPostingError, type JobPosting, type JobPostingStatus } from "@/lib/job-postings";
import { postingsForRequest } from "@/lib/portal/postings";
import { requireModule } from "@/lib/portal/staff";
import { removeDraft } from "./actions";

const STATUS_BADGE = { draft: "secondary", open: "success", closed: "destructive", filled: "info" } as const;

const formatDeadline = (deadline: Date | null) =>
  deadline
    ? deadline.toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "UTC" })
    : "—";

const titleOf = (posting: JobPosting) => posting.title || "Untitled Draft";

async function Postings({ status, search }: { status?: JobPostingStatus; search?: string }) {
  let postings: JobPosting[];
  try {
    postings = await (await postingsForRequest()).list({ status, search });
  } catch (error) {
    if (!(error instanceof JobPostingError)) throw error;
    return (
      <p role="alert" className="p-xl text-destructive">
        Job Postings could not be loaded. Please try again in a moment.
      </p>
    );
  }

  if (postings.length === 0) {
    const filtered = Boolean(status || search);
    return (
      <div className="flex flex-col items-center gap-sm p-xl text-center text-muted-foreground">
        <p>{filtered ? "No Job Postings match your filters." : "No Job Postings yet."}</p>
        {!filtered && (
          <Button asChild>
            <Link href="/job-postings/new">Create the first Draft</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {postings.map((posting) => (
            <TableRow key={posting.id}>
              <TableCell className="font-medium">
                {posting.status === "draft" ? (
                  <Link href={`/job-postings/${posting.id}`} className="hover:underline">
                    {titleOf(posting)}
                  </Link>
                ) : (
                  posting.title
                )}
              </TableCell>
              <TableCell>{posting.department || "—"}</TableCell>
              <TableCell>
                <Badge variant={STATUS_BADGE[posting.status]}>
                  {STATUS_LABEL[posting.status]}
                </Badge>
              </TableCell>
              <TableCell>{formatDeadline(posting.deadline)}</TableCell>
              <TableCell>
                {canDelete(posting.status) && (
                  <DeleteDraftButton
                    compact
                    title={titleOf(posting)}
                    action={removeDraft.bind(null, posting.id)}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function Page({ searchParams }: PageProps<"/job-postings">) {
  await requireModule("Recruitment and Hiring");
  const { status, q } = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

  return (
    <div className="flex flex-col gap-lg p-md sm:p-lg">
      <div className="flex items-center justify-between gap-md">
        <h1 className="text-headline-md">Job Postings</h1>
        <Button asChild>
          <Link href="/job-postings/new">
            <Plus /> New Job Posting
          </Link>
        </Button>
      </div>
      <Suspense>
        <JobPostingFilters />
      </Suspense>
      <Suspense fallback={<p className="p-xl text-muted-foreground">Loading Job Postings…</p>}>
        <Postings status={statusFromParam(one(status))} search={one(q)?.trim() || undefined} />
      </Suspense>
    </div>
  );
}
