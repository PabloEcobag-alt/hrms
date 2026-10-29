import type { ApplicationStage, ApplicationTab } from "./applications";

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
