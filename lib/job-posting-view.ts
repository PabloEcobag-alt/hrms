import type { JobPostingStatus } from "./job-postings";

export const STATUS_FILTERS: { value: "" | JobPostingStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "open", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
  { value: "filled", label: "Filled" },
];

export const STATUS_LABEL: Record<JobPostingStatus, string> = {
  draft: "Draft",
  open: "Published",
  closed: "Closed",
  filled: "Filled",
};

export const STATUS_BADGE = {
  draft: "secondary",
  open: "success",
  closed: "destructive",
  filled: "info",
} as const;

/** Tab counts for the postings matching the current search; "" is All. */
export function statusCounts(postings: { status: JobPostingStatus }[]): Record<"" | JobPostingStatus, number> {
  const counts = { "": postings.length, draft: 0, open: 0, closed: 0, filled: 0 };
  for (const posting of postings) counts[posting.status] += 1;
  return counts;
}

/** An unknown status in the URL means no filter, never an error. */
export function statusFromParam(value: string | undefined): JobPostingStatus | undefined {
  return (Object.keys(STATUS_LABEL) as JobPostingStatus[]).find((status) => status === value);
}

/** Delete is offered only for Drafts. */
export const canDelete = (status: JobPostingStatus) => status === "draft";

/** The day a posting was first published, in Manila time; a dash when it never was. */
export const formatPosted = (firstPublishedAt: Date | null) =>
  firstPublishedAt
    ? firstPublishedAt.toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" })
    : "—";

/** How many Applicants applied; a Draft has none to show, so it gets a dash. */
export const formatApplicants = (posting: { status: JobPostingStatus; applicantCount: number }) =>
  posting.status === "draft" ? "—" : String(posting.applicantCount);

/** "Department · N openings" under the title; either part is left out when unset. */
export function formatSubtitle(posting: { department: string; openings: number | null }): string {
  const openings = posting.openings === null ? "" : `${posting.openings} ${posting.openings === 1 ? "opening" : "openings"}`;
  return [posting.department, openings].filter(Boolean).join(" · ") || "—";
}
