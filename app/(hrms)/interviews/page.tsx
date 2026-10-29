import Link from "next/link";
import { Briefcase, Calendar, ChevronRight } from "lucide-react";
import { PAGE, PageHeader, InfoNote } from "@/components/hiring/parts";
import { INTERVIEW_JOBS, type InterviewJob } from "@/lib/hiring-mock";
import { requireModule } from "@/lib/portal/staff";
import { cn } from "@/lib/utils";

function Stat({
  value,
  label,
  valueClassName,
}: {
  value: number;
  label: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-[2px] rounded-lg bg-zinc-50 px-[10px] py-[8px]">
      <span className={cn("text-lg font-semibold leading-[normal]", value === 0 ? "text-zinc-400" : valueClassName ?? "text-zinc-900")}>
        {value}
      </span>
      <span className="whitespace-nowrap text-[11px] font-medium text-zinc-500">{label}</span>
    </div>
  );
}

function JobCard({ job }: { job: InterviewJob }) {
  const { toSchedule, scheduled, passed, notPassed } = job.counts;
  return (
    <Link
      href={`/interviews/${job.slug}`}
      className="flex flex-col gap-md rounded-xl border bg-card pb-md pl-[20px] pr-[20px] pt-[18px] hover:border-primary/40"
    >
      <div className="flex items-center gap-[12px]">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <Briefcase className="size-[18px]" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="truncate text-[15px] font-semibold text-zinc-900">{job.title}</span>
          <span className="truncate text-xs text-zinc-500">{job.meta}</span>
        </div>
        <ChevronRight className="size-4 shrink-0 text-zinc-500" />
      </div>
      <div className="flex gap-sm">
        <Stat value={toSchedule} label="To schedule" />
        <Stat value={scheduled} label="Scheduled" />
        <Stat value={passed} label="Passed" valueClassName="text-[#1e6b3a]" />
        <Stat value={notPassed} label="Not passed" valueClassName="text-red-700" />
      </div>
      <div className="flex items-center gap-sm border-t border-border-subtle pt-[12px]">
        <Calendar className={cn("size-[14px] shrink-0", job.next ? "text-primary" : "text-zinc-400")} />
        <span className={cn("flex-1 truncate text-[13px]", job.next ? "font-medium text-foreground" : "text-zinc-500")}>
          {job.next ? `Next: ${job.next}` : "No upcoming interviews"}
        </span>
      </div>
    </Link>
  );
}

export default async function Page() {
  await requireModule("Recruitment and Hiring");

  return (
    <div className={PAGE}>
      <PageHeader
        title="Interviews"
        subtitle="5 posted jobs · 6 interviews this week · 2 today"
      />
      <div className="grid gap-md md:grid-cols-2 xl:grid-cols-3">
        {INTERVIEW_JOBS.map((job) => (
          <JobCard key={job.slug} job={job} />
        ))}
      </div>
      <InfoNote>
        Only posted jobs with applicants in the interview stage are shown. Open
        a job to schedule interviews and record results.
      </InfoNote>
    </div>
  );
}
