import { describe, expect, it } from "vitest";
import { applicantsHref, formatApplied, formatRange, formatShowing, formatSubtitle, jobFromParam, pageCount, pageFromParam, searchFromParam, stageFromParam } from "@/lib/application-view";

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

  it("reads the Stage tab from the URL, defaulting to All", () => {
    expect(stageFromParam("Screening")).toBe("Screening");
    for (const bad of [undefined, "", "screening", "Withdrawn", "nope"]) expect(stageFromParam(bad)).toBe("All");
  });

  it("trims the search from the URL and treats blank as none", () => {
    expect(searchFromParam("  maria ")).toBe("maria");
    expect(searchFromParam("   ")).toBeUndefined();
    expect(searchFromParam(undefined)).toBeUndefined();
  });

  it("builds list links that keep Stage and search and omit defaults", () => {
    expect(applicantsHref({})).toBe("/applicants");
    expect(applicantsHref({ stage: "All", page: 1 })).toBe("/applicants");
    expect(applicantsHref({ stage: "Offer", search: "a&b", page: 3 })).toBe("/applicants?stage=Offer&q=a%26b&page=3");
  });

  it("keeps the Job in list links and reads it from the URL", () => {
    expect(applicantsHref({ job: "12", stage: "Offer", search: "ana", page: 2 })).toBe("/applicants?stage=Offer&q=ana&job=12&page=2");
    expect(applicantsHref({ job: "12" })).toBe("/applicants?job=12");
    expect(jobFromParam(" 12 ")).toBe("12");
    expect(jobFromParam("  ")).toBeUndefined();
    expect(jobFromParam(undefined)).toBeUndefined();
  });

  it("words the Showing line", () => {
    expect(formatShowing(132)).toBe("Showing 132 applicants");
    expect(formatShowing(1)).toBe("Showing 1 applicant");
    expect(formatShowing(0)).toBe("Showing 0 applicants");
  });
});
