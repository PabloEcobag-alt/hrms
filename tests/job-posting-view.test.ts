import { describe, expect, it } from "vitest";
import { canDelete, statusFromParam } from "@/lib/job-posting-view";

describe("job posting list view", () => {
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
