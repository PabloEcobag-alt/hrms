import type { JobPostingStatus } from "./job-postings";

export const STATUS_FILTERS: { value: "" | JobPostingStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "filled", label: "Filled" },
];

export const STATUS_LABEL: Record<JobPostingStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  filled: "Filled",
};

/** An unknown status in the URL means no filter, never an error. */
export function statusFromParam(value: string | undefined): JobPostingStatus | undefined {
  return (Object.keys(STATUS_LABEL) as JobPostingStatus[]).find((status) => status === value);
}

/** Delete is offered only for Drafts. */
export const canDelete = (status: JobPostingStatus) => status === "draft";
