import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { CELL, HEAD, PAGE, PageHeader, PersonCell } from "@/components/hiring/parts";
import { ApplicationError, type ApplicationListItem, type ApplicationPage } from "@/lib/applications";
import { STAGE_BADGE, formatApplied, formatRange, formatSubtitle, pageCount, pageFromParam } from "@/lib/application-view";
import { applicationsForRequest } from "@/lib/portal/applications";
import { requireModule } from "@/lib/portal/staff";

const TITLE = "Applicants";

function Notice({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-sm p-xl text-center text-muted-foreground">
      {children}
      {action}
    </div>
  );
}

function ApplicantsTable({ rows }: { rows: ApplicationListItem[] }) {
  return (
    <Table className="table-fixed min-w-[900px]">
      <TableHeader>
        <TableRow className="border-border-subtle hover:bg-transparent">
          <TableHead className={`${HEAD} w-[30%]`}>Applicant</TableHead>
          <TableHead className={`${HEAD} w-[24%]`}>Applied for</TableHead>
          <TableHead className={`${HEAD} w-[13%]`}>Applied</TableHead>
          <TableHead className={`${HEAD} w-[13%]`}>Stage</TableHead>
          <TableHead className={HEAD}>Next step</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} className="relative border-border-subtle">
            <TableCell className={CELL}>
              <PersonCell name={row.applicantName} subtitle={row.applicantEmail} href={`/applicants/${row.id}`} />
            </TableCell>
            <TableCell className={CELL}>
              <p>{row.jobPostingTitle}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{row.location}</p>
            </TableCell>
            <TableCell className={CELL}>{formatApplied(row.appliedAt)}</TableCell>
            <TableCell className={CELL}>
              <Badge variant={STAGE_BADGE[row.stage]}>{row.stage}</Badge>
            </TableCell>
            <TableCell className={`${CELL} ${row.stage === "New" || row.stage === "Rejected" ? "text-muted-foreground" : ""}`}>
              {row.nextStep}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Pager({ result }: { result: ApplicationPage }) {
  const { page, pageSize, total, rows } = result;
  const last = pageCount(total, pageSize);
  const href = (target: number) => (target === 1 ? "/applicants" : `/applicants?page=${target}`);
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between pt-2">
      <p className="text-sm text-muted-foreground">{formatRange(page, pageSize, total, rows.length)}</p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" aria-label="Previous page" disabled={page <= 1} asChild={page > 1}>
          {page > 1 ? <Link href={href(page - 1)}><ChevronLeft className="size-4" /></Link> : <ChevronLeft className="size-4" />}
        </Button>
        <span className="text-sm font-medium">{page} / {last}</span>
        <Button variant="outline" size="sm" aria-label="Next page" disabled={page >= last} asChild={page < last}>
          {page < last ? <Link href={href(page + 1)}><ChevronRight className="size-4" /></Link> : <ChevronRight className="size-4" />}
        </Button>
      </div>
    </nav>
  );
}

async function Listing({ page }: { page: number }) {
  let result: ApplicationPage;
  try {
    result = await (await applicationsForRequest()).list({ page });
  } catch (error) {
    if (!(error instanceof ApplicationError)) throw error;
    return (
      <>
        <PageHeader title={TITLE} subtitle={" "} />
        <Card className="rounded-xl shadow-none">
          <p role="alert" className="p-xl text-center text-destructive">
            Applicants could not be loaded. Please try again in a moment.
          </p>
        </Card>
      </>
    );
  }

  const { rows, total, newThisWeek } = result;
  return (
    <>
      <PageHeader title={TITLE} subtitle={formatSubtitle(total, newThisWeek)} />
      <Card className="flex flex-col gap-[14px] overflow-auto rounded-xl p-[20px] shadow-none">
        {total === 0 ? (
          <Notice><p>No applicants yet.</p></Notice>
        ) : rows.length === 0 ? (
          <Notice action={<Button asChild><Link href="/applicants">Back to the first page</Link></Button>}>
            <p>There are no applicants on this page.</p>
          </Notice>
        ) : (
          <ApplicantsTable rows={rows} />
        )}
        {total > 0 && <Pager result={result} />}
      </Card>
    </>
  );
}

export default async function Page({ searchParams }: PageProps<"/applicants">) {
  await requireModule("Recruitment and Hiring");
  const { page } = await searchParams;

  return (
    <div className={PAGE}>
      <Suspense
        fallback={
          <>
            <PageHeader title={TITLE} subtitle={" "} />
            <TableSkeleton columns={5} showToolbar={false} />
          </>
        }
      >
        <Listing page={pageFromParam(Array.isArray(page) ? page[0] : page)} />
      </Suspense>
    </div>
  );
}
