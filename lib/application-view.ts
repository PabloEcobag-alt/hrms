import type { ApplicationProfile, ApplicationStage, ApplicationTab } from "./applications";

export const STAGE_BADGE = {
  New: "info",
  Screening: "warning",
  Interview: "purple",
  Offer: "info",
  Hired: "success",
  Rejected: "destructive",
  Withdrawn: "secondary",
} as const satisfies Record<ApplicationStage, string>;

/** A missing, malformed or non-positive page in the URL means the first page. */
export function pageFromParam(value: string | undefined): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 && page <= 1_000_000 ? page : 1;
}

/** "132 applicants · 18 new this week". */
export function formatSubtitle(total: number, newThisWeek: number) {
  return `${total} ${total === 1 ? "applicant" : "applicants"} · ${newThisWeek} new this week`;
}

/** The day an Application was received, in Manila time, e.g. "22 Oct 2026". */
export const formatApplied = (appliedAt: Date) =>
  appliedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Manila" });

/** "Showing 26–50 of 132 applicants"; the range is empty when the page is past the end. */
export function formatRange(page: number, pageSize: number, total: number, rowCount: number) {
  if (total === 0) return "No applicants";
  if (rowCount === 0) return `${total} ${total === 1 ? "applicant" : "applicants"}`;
  const start = (page - 1) * pageSize + 1;
  return `Showing ${start}–${start + rowCount - 1} of ${total} applicants`;
}

export const pageCount = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / pageSize));

export const STAGE_TABS: ApplicationTab[] = ["All", "New", "Screening", "Interview", "Offer", "Hired", "Rejected"];

/** An unknown or missing Stage in the URL means the All tab. */
export const stageFromParam = (value: string | undefined): ApplicationTab => STAGE_TABS.find((tab) => tab === value) ?? "All";

/** Blank search in the URL means no search. */
export const searchFromParam = (value: string | undefined) => value?.trim() || undefined;

/** Blank Job in the URL means all jobs. */
export const jobFromParam = (value: string | undefined) => value?.trim() || undefined;

/** The list URL for a view; defaults are left out so the plain list keeps its plain link. */
export function applicantsHref({ stage, search, job, page }: { stage?: ApplicationTab; search?: string; job?: string; page?: number }) {
  const params = new URLSearchParams();
  if (stage && stage !== "All") params.set("stage", stage);
  if (search) params.set("q", search);
  if (job) params.set("job", job);
  if (page && page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/applicants?${query}` : "/applicants";
}

/** "Showing 132 applicants": everything the current Stage and search match, across pages. */
export const formatShowing = (total: number) => `Showing ${total} ${total === 1 ? "applicant" : "applicants"}`;

/** The CSV download for a view: the same filters as the list, with no page so every match comes back. */
export function exportHref({ stage, search, job }: { stage?: ApplicationTab; search?: string; job?: string }) {
  const params = new URLSearchParams();
  if (stage && stage !== "All") params.set("stage", stage);
  if (search) params.set("q", search);
  if (job) params.set("job", job);
  const query = params.toString();
  return query ? `/api/applications/export?${query}` : "/api/applications/export";
}

/** "applicants-2026-10-22.csv": the day of the export in Manila time. */
export const exportFileName = (now: Date) =>
  `applicants-${now.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })}.csv`;

export type TrackerStep = { label: string; state: "done" | "current" | "upcoming"; date: string };

const TRACKER_STAGES = ["New", "Screening", "Interview", "Offer", "Hired"] as const;
const TRACKER_LABEL: Record<(typeof TRACKER_STAGES)[number], string> = { New: "Applied", Screening: "Screening", Interview: "Interview", Offer: "Offer", Hired: "Hired" };

const manila = (date: Date, options: Intl.DateTimeFormatOptions) => date.toLocaleString("en-GB", { timeZone: "Asia/Manila", ...options });

/**
 * The five tracker steps. Reached steps are done and the current Stage is marked; later steps are empty with no date.
 * A Rejected or Withdrawn Application has no current step: the steps it reached stay done.
 */
export function trackerSteps(stage: ApplicationStage, stageDates: Partial<Record<ApplicationStage, Date>>): TrackerStep[] {
  const at = TRACKER_STAGES.indexOf(stage as (typeof TRACKER_STAGES)[number]);
  return TRACKER_STAGES.map((step, index) => {
    const reached = at >= 0 ? index <= at : stageDates[step] !== undefined;
    const date = stageDates[step];
    return {
      label: TRACKER_LABEL[step],
      state: !reached ? "upcoming" : index === at && step !== "Hired" ? "current" : "done",
      date: !reached || !date ? "—"
        : step === "Interview" ? `${manila(date, { day: "numeric", month: "short" })}, ${manila(date, { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase()}`
        : manila(date, { day: "numeric", month: "short" }),
    };
  });
}

/** "₱16,000 / month", or a dash when the Applicant gave none. */
export const formatSalary = (salary: number | null) => salary === null ? "—" : `₱${salary.toLocaleString("en-US")} / month`;

/** "3 Nov 2026" from a date or timestamp string; a dash when missing or unreadable. */
export function formatAvailableFrom(value: string | null) {
  const date = value ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value) : null;
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: /^\d{4}-\d{2}-\d{2}$/.test(value!) ? "UTC" : "Asia/Manila" })
    : "—";
}

/** "Applied for Branch Cashier · Cainta branch · 20 Oct 2026". */
export const formatAppliedFor = (title: string, location: string, appliedAt: Date) => `Applied for ${title} · ${location} · ${formatApplied(appliedAt)}`;

/** A blank detail reads as a dash. */
export const detailOrDash = (value: string | null) => value?.trim() || "—";

/** "312 KB" or "1.2 MB": the size of a submitted file. */
export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Number((bytes / (1024 * 1024)).toFixed(1))} MB`;
}

export type ActivityEntry = { tone: "purple" | "blue" | "green" | "red"; title: string; detail: string };

/**
 * The timeline, newest first, ending with the application itself. Scheduling an interview from Screening is one
 * stored event that reads as two entries: the interview, then the Stage move it caused.
 */
export function activityEntries({ activity, interviews, jobPostingTitle, appliedAt }: Pick<ApplicationProfile, "activity" | "interviews" | "jobPostingTitle" | "appliedAt">): ActivityEntry[] {
  const day = (date: Date) => manila(date, { day: "numeric", month: "short" });
  const entries = activity.flatMap((event): ActivityEntry[] => {
    const by = `by ${event.actorName}`;
    const interview = interviews.find((item) => item.id === event.interviewId);
    const moved: ActivityEntry = event.toStage === "Rejected"
      ? { tone: "red", title: "Rejected", detail: [day(event.occurredAt), by, event.reason].filter(Boolean).join(" · ") }
      : { tone: "blue", title: `Moved to ${event.toStage}`, detail: `${day(event.occurredAt)} · ${by}` };
    if (event.interviewId === undefined) return [moved];
    if (event.reason) {
      const score = interview?.score == null ? null : `score ${interview.score} / 5`;
      return [{ tone: "green", title: `${interview?.type ?? ""} interview completed`.trim().replace(/^./, (c) => c.toUpperCase()),
        detail: [day(event.occurredAt), interview?.result, score, by].filter(Boolean).join(" · ") }];
    }
    const when = interview ? `${day(interview.startsAt)}, ${manila(interview.startsAt, { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase()} at ${interview.location}` : null;
    const scheduled: ActivityEntry = { tone: "purple", title: "Interview scheduled", detail: [day(event.occurredAt), when, by].filter(Boolean).join(" · ") };
    return event.fromStage === event.toStage ? [scheduled] : [scheduled, moved];
  });
  return [...entries, { tone: "purple", title: "Applied", detail: `${day(appliedAt)} · ${jobPostingTitle}` }];
}
