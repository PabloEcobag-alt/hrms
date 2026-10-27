import Link from "next/link";
import { Suspense } from "react";
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
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { DeleteDraftButton } from "@/components/job-postings/delete-draft-button";
import { Card } from "@/components/ui/card";
import { JobPostingFilters } from "@/components/job-postings/job-posting-filters";
import {
  canDelete,
  STATUS_LABEL,
  statusFromParam,
} from "@/lib/job-posting-view";
import {
  JobPostingError,
  type JobPosting,
  type JobPostingStatus,
} from "@/lib/job-postings";
import { postingsForRequest } from "@/lib/portal/postings";
import { requireModule } from "@/lib/portal/staff";
import { removeDraft } from "./actions";

const STATUS_BADGE = {
  draft: "secondary",
  open: "success",
  closed: "destructive",
  filled: "info",
} as const;

const formatDeadline = (deadline: Date | null) =>
  deadline
    ? deadline.toLocaleDateString("en-PH", {
        dateStyle: "medium",
        timeZone: "UTC",
      })
    : "—";

const titleOf = (posting: JobPosting) => posting.title || "Untitled Draft";

function Notice({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-sm p-xl text-center text-muted-foreground">
      {children}
      {action}
    </div>
  );
}

function PostingsTable({ postings }: { postings: JobPosting[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
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
            <TableCell className="font-medium text-primary">
              <Link
                href={`/job-postings/${posting.id}`}
                className="hover:underline"
              >
                {titleOf(posting)}
              </Link>
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
  );
}

async function Listing({
  status,
  search,
}: {
  status?: JobPostingStatus;
  search?: string;
}) {
  let matching: JobPosting[];
  try {
    matching = await (await postingsForRequest()).list({ search });
  } catch (error) {
    if (!(error instanceof JobPostingError)) throw error;
    return (
      <Card>
        <p role="alert" className="p-xl text-center text-destructive">
          Job Postings could not be loaded. Please try again in a moment.
        </p>
      </Card>
    );
  }

  // Tab counts reflect the search, so they always add up to what the table would show.
  const counts: Record<string, number> = { "": matching.length };
  for (const posting of matching)
    counts[posting.status] = (counts[posting.status] ?? 0) + 1;
  const postings = status
    ? matching.filter((posting) => posting.status === status)
    : matching;

  return (
    <>
      <JobPostingFilters counts={counts}>
        <Card className="overflow-auto p-md">
          {postings.length === 0 ? (
            status || search ? (
              <Notice>
                <p>No Job Postings match your filters.</p>
              </Notice>
            ) : (
              <Notice
                action={
                  <Button asChild>
                    <Link href="/job-postings/new">Create the first Draft</Link>
                  </Button>
                }
              >
                <p>No Job Postings yet.</p>
              </Notice>
            )
          ) : (
            <PostingsTable postings={postings} />
          )}
        </Card>
      </JobPostingFilters>
    </>
  );
}

export default async function Page({
  searchParams,
}: PageProps<"/job-postings">) {
  await requireModule("Recruitment and Hiring");
  const { status, q } = await searchParams;
  const one = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  return (
    <div className="flex flex-col gap-lg p-md sm:p-lg">
      <div className="flex items-start justify-between gap-md">
        <div>
          <h1 className="text-headline-md">Job Postings</h1>
          <p className="text-body-sm text-muted-foreground">
            Roles Staff write here. Applicants see a Job Posting on Careers once
            it is Open.
          </p>
        </div>
        <Button asChild>
          <Link href="/job-postings/new">New Job Posting</Link>
        </Button>
      </div>
      <Suspense fallback={<TableSkeleton columns={4} />}>
        <Listing
          status={statusFromParam(one(status))}
          search={one(q)?.trim() || undefined}
        />
      </Suspense>
    </div>
  );
}
