import { describe, expect, it } from "vitest";
import { cardRowsFor, detailWidgetRowsFor, type DashboardSummary, type UpcomingEvent } from "@/lib/dashboard";

const ALL = ["/dashboard", "/attendance", "/employee-information", "/job-postings"];

const cardRows = (pages: string[], summary: DashboardSummary = {}) => cardRowsFor(pages, summary);
const cards = (pages: string[], summary: DashboardSummary = {}) => cardRows(pages, summary).flat();
const labels = (pages: string[], summary: DashboardSummary = {}) => cards(pages, summary).map((c) => c.label);
const rowLabels = (pages: string[]) => cardRows(pages).map((row) => row.map((c) => c.label));

describe("Key Summary Cards", () => {
  it("put the hiring cards in their own row above the existing cards, in fixed order", () => {
    expect(rowLabels([...ALL].reverse())).toEqual([
      ["Open jobs"],
      ["Total Employee", "New Hire", "Attendance Rate", "Pending Leaves"],
    ]);
  });

  it("no longer include Open Positions", () => {
    expect(labels(ALL)).not.toContain("Open Positions");
  });

  it("only include rows and cards whose Module is held", () => {
    expect(rowLabels(["/attendance"])).toEqual([["Attendance Rate", "Pending Leaves"]]);
    expect(rowLabels(["/employee-information"])).toEqual([["Total Employee", "New Hire"]]);
    expect(rowLabels(["/job-postings"])).toEqual([["Open jobs"]]);
  });

  it("are empty when none of the owning Modules is held, ignoring unknown addresses", () => {
    expect(cardRowsFor(["/dashboard", "/payroll-ess", "/not-a-module"], {})).toEqual([]);
  });

  it("have no figure or caption when their data is missing", () => {
    expect(cards(ALL).map((c) => c.figure)).toEqual([null, null, null, null, null]);
    expect(cards(ALL).map((c) => c.caption)).toEqual([null, null, null, null, null]);
  });

  it("derive the Total Employee figure as the sum of statuses", () => {
    const total = cards(ALL, { totalEmployee: { regular: 10, probationary: 3, ojt: 2 } }).find((c) => c.label === "Total Employee");
    expect(total?.figure).toBe("15");
  });

  it("show New Hire and Pending Leaves figures", () => {
    const found = cards(ALL, { newHire: { count: 4 }, pendingLeaves: { total: 0 } });
    expect(found.map((c) => c.figure)).toEqual([null, null, "4", null, "0"]);
  });

  it("show Open jobs as the count of Open Job Postings with openings and locations in the caption", () => {
    const [open] = cards(ALL, { openJobs: { count: 5, openings: 18, locations: 3 } });
    expect(open).toMatchObject({ label: "Open jobs", figure: "5", caption: "18 openings · 3 locations" });
  });

  it("use singular wording in the Open jobs caption", () => {
    const [open] = cards(ALL, { openJobs: { count: 1, openings: 1, locations: 1 } });
    expect(open.caption).toBe("1 opening · 1 location");
  });

  it("leave openings out of the Open jobs caption when no posting says how many", () => {
    const [open] = cards(ALL, { openJobs: { count: 3, openings: 0, locations: 2 } });
    expect(open).toMatchObject({ figure: "3", caption: "2 locations" });
  });

  it("show nothing for Open jobs when there is no Open Job Posting", () => {
    const [open] = cards(ALL, { openJobs: { count: 0, openings: 0, locations: 0 } });
    expect(open).toMatchObject({ figure: null, caption: null });
  });

  it("round Attendance Rate to a whole percent", () => {
    const rate = (present: number, expected: number) =>
      cards(ALL, { attendanceRate: { present, expected } }).find((c) => c.label === "Attendance Rate")?.figure;
    expect(rate(2, 3)).toBe("67%");
    expect(rate(1, 3)).toBe("33%");
    expect(rate(5, 5)).toBe("100%");
  });

  it("show no Attendance Rate figure when nobody is expected", () => {
    expect(cards(ALL, { attendanceRate: { present: 0, expected: 0 } }).find((c) => c.label === "Attendance Rate")?.figure).toBeNull();
  });
});

const NOW = new Date(2026, 9, 27, 12); // 27 Oct 2026

describe("Detail Widgets", () => {
  const names = (pages: string[], summary: DashboardSummary = {}) =>
    detailWidgetRowsFor(pages, summary, NOW).map((row) => row.map((w) => w.label));

  it("are laid out two per row in fixed order", () => {
    expect(names(ALL)).toEqual([
      ["Headcount Trend", "Department Distribution"],
      ["Recent Activity", "Upcoming Events"],
    ]);
  });

  it("only include Detail Widgets whose Module is held, a lone Detail Widget forming its own row", () => {
    expect(names(["/attendance"])).toEqual([["Upcoming Events"]]);
    expect(names(["/employee-information"])).toEqual([
      ["Headcount Trend", "Department Distribution"],
      ["Recent Activity"],
    ]);
  });

  it("are absent when neither Module is held", () => {
    expect(names(["/dashboard", "/job-postings", "/nope"])).toEqual([]);
  });

  it("have no data without a supply from their Module", () => {
    expect(detailWidgetRowsFor(ALL, {}, NOW).flat().map((w) => w.data)).toEqual([null, null, null, null]);
  });
});

describe("Headcount Trend", () => {
  const trend = (summary: DashboardSummary) =>
    detailWidgetRowsFor(["/employee-information"], summary, NOW)[0][0].data as
      | { month: string; total: number | null }[]
      | null;

  it("covers the last 12 months ending this month", () => {
    const t = trend({ totalEmployee: { regular: 1, probationary: 0, ojt: 0 } })!;
    expect(t).toHaveLength(12);
    expect(t[0].month).toBe("2025-11");
    expect(t[11].month).toBe("2026-10");
  });

  it("ends on today's Total Employee figure", () => {
    const t = trend({
      totalEmployee: { regular: 10, probationary: 3, ojt: 2 },
      headcountHistory: [{ month: "2026-10", total: 99 }],
    })!;
    expect(t[11].total).toBe(15);
  });

  it("leaves months without data as gaps, not zero", () => {
    const t = trend({
      totalEmployee: { regular: 5, probationary: 0, ojt: 0 },
      headcountHistory: [{ month: "2026-08", total: 4 }],
    })!;
    expect(t.map((p) => p.total)).toEqual([
      null, null, null, null, null, null, null, null, null, 4, null, 5,
    ]);
  });

  it("is absent when there is no data at all", () => {
    expect(trend({})).toBeNull();
  });

  it("leaves the current month a gap when only history has it, so it never disagrees with the card", () => {
    const t = trend({ headcountHistory: [{ month: "2026-10", total: 99 }, { month: "2026-09", total: 7 }] })!;
    expect(t[11].total).toBeNull();
    expect(t[10].total).toBe(7);
  });

  it("ends on the figure the Total Employee card shows", () => {
    const summary = { totalEmployee: { regular: 8, probationary: 1, ojt: 4 } };
    const [card] = cards(["/employee-information"], summary);
    expect(String(trend(summary)!.at(-1)!.total)).toBe(card.figure);
  });
});

describe("Department Distribution", () => {
  const slices = (summary: DashboardSummary) =>
    detailWidgetRowsFor(["/employee-information"], summary, NOW)[0][1].data as
      | { department: string; count: number }[]
      | null;

  it("merges employees with no department into one Unassigned slice and drops empty ones", () => {
    expect(
      slices({
        departmentCounts: [
          { department: "Sales", count: 4 },
          { department: null, count: 2 },
          { department: "Ops", count: 0 },
          { department: null, count: 1 },
        ],
      }),
    ).toEqual([
      { department: "Sales", count: 4 },
      { department: "Unassigned", count: 3 },
    ]);
  });

  it("sums to Total Employee, putting employees missing from the counts into Unassigned", () => {
    const got = slices({
      totalEmployee: { regular: 8, probationary: 1, ojt: 1 },
      departmentCounts: [
        { department: "Sales", count: 4 },
        { department: null, count: 2 },
      ],
    })!;
    expect(got).toEqual([
      { department: "Sales", count: 4 },
      { department: "Unassigned", count: 6 },
    ]);
    expect(got.reduce((sum, s) => sum + s.count, 0)).toBe(10);
  });

  it("is absent when no employee is counted", () => {
    expect(slices({ departmentCounts: [] })).toBeNull();
    expect(slices({})).toBeNull();
  });
});

describe("Recent Activity", () => {
  const entry = (id: string, at: string) => ({
    id,
    kind: "hire" as const,
    employeeName: "Ana Cruz",
    title: "New hire",
    description: "Joined Sales",
    at,
  });
  const items = (summary: DashboardSummary) =>
    detailWidgetRowsFor(["/employee-information"], summary, NOW)[1][0].data as { id: string; ago: string }[] | null;

  it("lists the latest 10 newest first with relative times", () => {
    const events = Array.from({ length: 12 }, (_, i) =>
      entry(`e${i}`, new Date(2026, 9, 27 - i, 9).toISOString()),
    );
    const got = items({ recentActivity: events })!;
    expect(got).toHaveLength(10);
    expect(got[0]).toMatchObject({ id: "e0", ago: "Today" });
    expect(got[3].ago).toBe("3d ago");
    expect(items({ recentActivity: [...events].reverse() })!.map((e) => e.id)).toEqual(
      got.map((e) => e.id),
    );
  });

  it("is absent when there are no events", () => {
    expect(items({ recentActivity: [] })).toBeNull();
  });
});

describe("Upcoming Events", () => {
  const ev = (id: string, date: string, kind: "holiday" | "leave" = "holiday"): UpcomingEvent =>
    kind === "leave"
      ? { id, kind, status: "approved", title: id, date, description: "" }
      : { id, kind, title: id, date, description: "" };
  const items = (summary: DashboardSummary) =>
    detailWidgetRowsFor(["/attendance"], summary, NOW)[0][0].data as { id: string }[] | null;

  it("keeps events in the next 30 days, soonest first", () => {
    const got = items({
      upcomingEvents: [
        ev("late", "2026-11-26"),
        ev("past", "2026-10-26"),
        ev("too-far", "2026-11-27"),
        ev("today", "2026-10-27"),
        ev("soon", "2026-10-30", "leave"),
      ],
    });
    expect(got!.map((e) => e.id)).toEqual(["today", "soon", "late"]);
  });

  it("excludes leave that is still pending", () => {
    const pending: UpcomingEvent = { ...ev("p", "2026-10-30", "leave"), status: "pending" } as UpcomingEvent;
    expect(items({ upcomingEvents: [pending, ev("ok", "2026-10-30", "leave")] })!.map((e) => e.id)).toEqual(["ok"]);
  });

  it("shows at most 10", () => {
    const many = Array.from({ length: 15 }, (_, i) => ev(`e${i}`, "2026-11-01"));
    expect(items({ upcomingEvents: many })).toHaveLength(10);
  });

  it("is absent when nothing is coming up", () => {
    expect(items({ upcomingEvents: [ev("past", "2026-01-01")] })).toBeNull();
  });
});
