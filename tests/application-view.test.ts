import { describe, expect, it } from "vitest";
import { formatApplied, formatRange, formatSubtitle, pageCount, pageFromParam } from "@/lib/application-view";

describe("application list view", () => {
  it("reads the page from the URL, defaulting to the first", () => {
    expect(pageFromParam("3")).toBe(3);
    for (const bad of [undefined, "", "0", "-2", "1.5", "abc", "99999999999"]) expect(pageFromParam(bad)).toBe(1);
  });

  it("words the subtitle", () => {
    expect(formatSubtitle(132, 18)).toBe("132 applicants · 18 new this week");
    expect(formatSubtitle(1, 0)).toBe("1 applicant · 0 new this week");
  });

  it("formats the applied date in Manila time", () => {
    expect(formatApplied(new Date("2026-10-21T17:00:00Z"))).toBe("22 Oct 2026");
  });

  it("describes the visible range", () => {
    expect(formatRange(2, 25, 60, 25)).toBe("Showing 26–50 of 60 applicants");
    expect(formatRange(3, 25, 60, 10)).toBe("Showing 51–60 of 60 applicants");
    expect(formatRange(1, 25, 0, 0)).toBe("No applicants");
    expect(formatRange(9, 25, 60, 0)).toBe("60 applicants");
  });

  it("counts at least one page", () => {
    expect(pageCount(0, 25)).toBe(1);
    expect(pageCount(26, 25)).toBe(2);
  });
});
