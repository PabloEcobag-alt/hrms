import { describe, expect, it } from "vitest";
import { canDelete, STATUS_FILTERS, STATUS_LABEL, statusCounts, statusFromParam } from "@/lib/job-posting-view";

describe("job posting list view", () => {
  it("labels Open as Published everywhere", () => {
    expect(STATUS_LABEL.open).toBe("Published");
    expect(STATUS_LABEL.filled).toBe("Filled");
    expect(STATUS_FILTERS.map((filter) => filter.label)).toEqual(["All", "Published", "Draft", "Closed", "Filled"]);
  });

  it("counts tabs so they add up to the table under the current search", () => {
    const counts = statusCounts([{ status: "open" }, { status: "open" }, { status: "draft" }, { status: "filled" }]);
    expect(counts).toEqual({ "": 4, open: 2, draft: 1, closed: 0, filled: 1 });
    expect(counts.open + counts.draft + counts.closed + counts.filled).toBe(counts[""]);
  });

  it("ignores an unknown status filter", () => {
    expect(statusFromParam("open")).toBe("open");
    expect(statusFromParam("bogus")).toBeUndefined();
    expect(statusFromParam(undefined)).toBeUndefined();
  });

  it("offers delete only for Drafts", () => {
    expect(canDelete("draft")).toBe(true);
    for (const status of ["open", "closed", "filled"] as const) expect(canDelete(status)).toBe(false);
  });
});
