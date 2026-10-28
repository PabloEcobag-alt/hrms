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
import { Card } from "@/components/ui/card";
import { JobPostingFilters } from "@/components/job-postings/job-posting-filters";
import {
  STATUS_BADGE,
  STATUS_LABEL,
  formatApplicants,
  formatPosted,
  formatSubtitle,
  statusCounts,
  statusFromParam,
} from "@/lib/job-posting-view";
import {
  JobPostingError,
  JobTemplateError,
  type JobPosting,
  type JobPostingListItem,
  type JobPostingStatus,
} from "@/lib/job-postings";
import { postingsForRequest } from "@/lib/portal/postings";
import { requireModule } from "@/lib/portal/staff";
import { templatesForRequest } from "@/lib/portal/templates";

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

function PostingsTable({ postings }: { postings: JobPostingListItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Job</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Posted</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead>Applicants</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {postings.map((posting) => (
          <TableRow key={posting.id} className="relative">
            <TableCell>
              {/* One link per row: its ::after covers the whole row. */}
              <Link
                href={`/job-postings/${posting.id}`}
                className="font-medium text-primary after:absolute after:inset-0 hover:underline"
              >
                {titleOf(posting)}
              </Link>
              <p className="text-body-sm text-muted-foreground">
                {formatSubtitle(posting)}
              </p>
            </TableCell>
            <TableCell>{posting.location || "—"}</TableCell>
            <TableCell>{posting.employmentType || "—"}</TableCell>
            <TableCell>{formatPosted(posting.firstPublishedAt)}</TableCell>
            <TableCell>{formatDeadline(posting.deadline)}</TableCell>
            <TableCell>{formatApplicants(posting)}</TableCell>
            <TableCell>
              <Badge variant={STATUS_BADGE[posting.status]}>
                {STATUS_LABEL[posting.status]}
              </Badge>
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
  let matching: JobPostingListItem[];
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
  const counts = statusCounts(matching);
  const postings = status
    ? matching.filter((posting) => posting.status === status)
    : matching;

  // The hint is only useful once a template exists; a failed lookup just hides it.
  const hasTemplates = await (await templatesForRequest())
    .list()
    .then((templates) => templates.length > 0)
    .catch((error) => {
      if (!(error instanceof JobTemplateError)) throw error;
      return false;
    });

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
      {hasTemplates && (
        <p className="text-body-sm text-muted-foreground">
          Start a new Job Posting from a saved Job Template with New Job
          Posting, or manage them under Job Templates.
        </p>
      )}
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
            it is Published.
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <Button variant="outline" asChild>
            <Link href="/job-templates">Job Templates</Link>
          </Button>
          <Button asChild>
            <Link href="/job-postings/new">New Job Posting</Link>
          </Button>
        </div>
      </div>
      <Suspense fallback={<TableSkeleton columns={7} />}>
        <Listing
          status={statusFromParam(one(status))}
          search={one(q)?.trim() || undefined}
        />
      </Suspense>
    </div>
  );
}
