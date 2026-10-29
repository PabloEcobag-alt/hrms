import { notFound } from "next/navigation";
import { Calendar, Check, MapPin, Video, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BackLink,
  CELL,
  HEAD,
  InfoNote,
  PAGE,
  PageHeader,
  PersonCell,
  PillTabs,
} from "@/components/hiring/parts";
import {
  InterviewResultDialog,
  ScheduleInterviewDialog,
} from "@/components/hiring/dialogs";
import {
  BRANCH_CASHIER_INTERVIEWS,
  INTERVIEW_JOBS,
  type InterviewResult,
  type InterviewRow,
} from "@/lib/hiring-mock";
import { requireModule } from "@/lib/portal/staff";

const RESULT_BADGE = {
  Waiting: "warning",
  Scheduled: "info",
  Passed: "success",
  "Not passed": "destructive",
} as const satisfies Record<InterviewResult, "warning" | "info" | "success" | "destructive">;

const MUTED = "text-zinc-400";

function InterviewCell({ row }: { row: InterviewRow }) {
  if (!row.date) return <span className={MUTED}>Not scheduled</span>;
  return (
    <div className="flex flex-col gap-[2px]">
      <span className="font-medium text-foreground">{row.date}</span>
      <span className="text-xs text-muted-foreground">{row.time}</span>
    </div>
  );
}

function TypeCell({ type }: { type: InterviewRow["type"] }) {
  if (!type) return <span className={MUTED}>—</span>;
  const Icon = type === "online" ? Video : MapPin;
  return (
    <span className="flex items-center gap-[6px]">
      <Icon className="size-4 text-zinc-500" />
      {type === "online" ? "Online · Meet" : "In person · Cainta"}
    </span>
  );
}

function Actions({ row }: { row: InterviewRow }) {
  if (row.result === "Waiting") {
    return (
      <ScheduleInterviewDialog
        trigger={
          <Button className="h-auto gap-[6px] rounded-lg px-[12px] py-[6px] text-[13px] font-medium shadow-none [&_svg]:size-[14px]">
            <Calendar /> Schedule interview
          </Button>
        }
      />
    );
  }
  if (row.result === "Scheduled") {
    const outline = "h-auto gap-[6px] rounded-lg px-[12px] py-[6px] text-[13px] shadow-none [&_svg]:size-[14px]";
    return (
      <div className="flex items-center justify-end gap-sm">
        <InterviewResultDialog
          trigger={
            <Button variant="outline" className={`${outline} text-red-700`}>
              <X /> Not passed
            </Button>
          }
        />
        <InterviewResultDialog
          trigger={
            <Button variant="outline" className={`${outline} text-[#1e6b3a]`}>
              <Check /> Passed
            </Button>
          }
        />
      </div>
    );
  }
  return <span className="text-xs text-muted-foreground">{row.note}</span>;
}

export default async function Page({
  params,
}: PageProps<"/interviews/[slug]">) {
  await requireModule("Recruitment and Hiring");
  const { slug } = await params;
  const job = INTERVIEW_JOBS.find((candidate) => candidate.slug === slug);
  if (!job) notFound();

  // Sample rows: every job shows the Branch Cashier applicants until this is wired to real data.
  const rows = BRANCH_CASHIER_INTERVIEWS;
  const count = (result: InterviewResult) =>
    rows.filter((row) => row.result === result).length;

  return (
    <div className={`${PAGE} !pt-[20px]`}>
      <div className="flex flex-col gap-xs">
        <BackLink href="/interviews">Interviews</BackLink>
        <PageHeader
          title={job.title}
          badge={<Badge variant="success">Published</Badge>}
          subtitle={`${job.meta} · ${rows.length} applicants in the interview stage`}
        >
          <Button variant="outline" className="h-auto rounded-lg px-[14px] py-[9px] shadow-none" asChild>
            <Link href="/job-postings">View job posting</Link>
          </Button>
        </PageHeader>
      </div>
      <PillTabs
        tabs={[
          { label: "All", count: rows.length },
          { label: "To schedule", count: count("Waiting") },
          { label: "Scheduled", count: count("Scheduled") },
          { label: "Passed", count: count("Passed") },
          { label: "Not passed", count: count("Not passed") },
        ]}
      />
      <Card className="flex flex-col gap-[14px] overflow-auto rounded-xl p-[20px] shadow-none">
        <Table className="table-fixed min-w-[1000px]">
          <TableHeader>
            <TableRow className="border-border-subtle hover:bg-transparent">
              <TableHead className={`${HEAD} w-[230px]`}>Applicant</TableHead>
              <TableHead className={`${HEAD} w-[170px]`}>Interview</TableHead>
              <TableHead className={`${HEAD} w-[160px]`}>Type</TableHead>
              <TableHead className={`${HEAD} w-[120px]`}>Interviewer</TableHead>
              <TableHead className={`${HEAD} w-[110px]`}>Result</TableHead>
              <TableHead className={`${HEAD} text-right`}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name} className="border-border-subtle">
                <TableCell className={CELL}>
                  <PersonCell name={row.name} subtitle={row.email} />
                </TableCell>
                <TableCell className={CELL}>
                  <InterviewCell row={row} />
                </TableCell>
                <TableCell className={CELL}>
                  <TypeCell type={row.type} />
                </TableCell>
                <TableCell className={`${CELL} ${row.interviewer ? "" : MUTED}`}>
                  {row.interviewer ?? "—"}
                </TableCell>
                <TableCell className={CELL}>
                  <Badge variant={RESULT_BADGE[row.result]}>{row.result}</Badge>
                </TableCell>
                <TableCell className={`${CELL} text-right`}>
                  <div className="flex justify-end">
                    <Actions row={row} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <InfoNote>
          Passed applicants move to Offers. Everyone gets a result email, sent
          at the time you choose when you record the result.
        </InfoNote>
      </Card>
    </div>
  );
}
