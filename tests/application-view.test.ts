import { describe, expect, it } from "vitest";
import { applicantsHref, exportFileName, exportHref, detailOrDash, formatAppliedFor, formatAvailableFrom, formatFileSize, formatSalary, trackerSteps, formatApplied, formatRange, formatShowing, formatSubtitle, jobFromParam, pageCount, pageFromParam, searchFromParam, stageFromParam } from "@/lib/application-view";

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

  it("links the export to the current Stage, search and Job, never a page", () => {
    expect(exportHref({})).toBe("/api/applications/export");
    expect(exportHref({ stage: "Screening", search: "ana", job: "7" })).toBe("/api/applications/export?stage=Screening&q=ana&job=7");
  });

  it("dates the export file in Manila time", () => {
    expect(exportFileName(new Date("2026-10-21T17:00:00Z"))).toBe("applicants-2026-10-22.csv");
  });
});

describe("application profile view", () => {
  const dates = {
    New: new Date("2026-10-20T01:00:00Z"),
    Screening: new Date("2026-10-23T01:00:00Z"),
    Interview: new Date("2026-10-30T02:00:00Z"),
  };

  it("fills reached steps, marks the current one and leaves later steps empty", () => {
    expect(trackerSteps("Interview", dates)).toEqual([
      { label: "Applied", state: "done", date: "20 Oct" },
      { label: "Screening", state: "done", date: "23 Oct" },
      { label: "Interview", state: "current", date: "30 Oct, 10:00 AM" },
      { label: "Offer", state: "upcoming", date: "—" },
      { label: "Hired", state: "upcoming", date: "—" },
    ]);
  });

  it("shows a hired Application as complete", () => {
    expect(trackerSteps("Hired", { ...dates, Offer: dates.Interview, Hired: dates.Interview }).map((step) => step.state))
      .toEqual(["done", "done", "done", "done", "done"]);
  });

  it("keeps the steps a rejected Application reached and marks none current", () => {
    expect(trackerSteps("Rejected", { New: dates.New, Screening: dates.Screening, Rejected: dates.Interview }).map((step) => step.state))
      .toEqual(["done", "done", "upcoming", "upcoming", "upcoming"]);
  });

  it("formats details, with dashes for missing ones", () => {
    expect(formatSalary(16000)).toBe("₱16,000 / month");
    expect(formatSalary(null)).toBe("—");
    expect(formatAvailableFrom("2026-11-03")).toBe("3 Nov 2026");
    expect(formatAvailableFrom(null)).toBe("—");
    expect(formatAvailableFrom("soon")).toBe("—");
    expect(detailOrDash("  ")).toBe("—");
    expect(formatAppliedFor("Branch Cashier", "Cainta branch", new Date("2026-10-20T01:00:00Z"))).toBe("Applied for Branch Cashier · Cainta branch · 20 Oct 2026");
  });

  it("sizes a file the way the Documents card reads it", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(312 * 1024)).toBe("312 KB");
    expect(formatFileSize(1.2 * 1024 * 1024)).toBe("1.2 MB");
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
    expect(formatFileSize(0)).toBe("0 B");
  });
});
