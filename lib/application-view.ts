import type { ApplicationStage } from "./applications";

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
