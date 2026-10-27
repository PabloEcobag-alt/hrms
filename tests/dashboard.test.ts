import { describe, expect, it } from "vitest";
import { cardsFor, widgetRowsFor, type DashboardSummary } from "@/lib/dashboard";

const ALL = ["/dashboard", "/attendance", "/employee-information", "/recruitment-and-hiring"];

const labels = (pages: string[], summary: DashboardSummary = {}) =>
  cardsFor(pages, summary).map((c) => c.label);

describe("Key Summary Cards", () => {
  it("are shown in fixed order regardless of the order pages are held", () => {
    expect(labels([...ALL].reverse())).toEqual([
      "Total Employee",
      "New Hire",
      "Open Positions",
      "Attendance Rate",
      "Pending Leaves",
    ]);
  });

  it("only include cards whose Module is held", () => {
    expect(labels(["/attendance"])).toEqual(["Attendance Rate", "Pending Leaves"]);
    expect(labels(["/employee-information"])).toEqual(["Total Employee", "New Hire"]);
    expect(labels(["/recruitment-and-hiring"])).toEqual(["Open Positions"]);
  });

  it("are empty when none of the owning Modules is held, ignoring unknown addresses", () => {
    expect(cardsFor(["/dashboard", "/payroll-ess", "/not-a-module"], {})).toEqual([]);
  });

  it("have no figure when their data is missing", () => {
    expect(cardsFor(ALL, {}).map((c) => c.figure)).toEqual([null, null, null, null, null]);
  });

  it("derive the Total Employee figure as the sum of statuses", () => {
    const [total] = cardsFor(ALL, { totalEmployee: { regular: 10, probationary: 3, ojt: 2 } });
    expect(total.figure).toBe("15");
  });

  it("show New Hire, Open Positions and Pending Leaves figures", () => {
    const cards = cardsFor(ALL, {
      newHire: { count: 4 },
      openPositions: { openRequisitions: 12, targetHires: 20 },
      pendingLeaves: { total: 0 },
    });
    expect(cards.map((c) => c.figure)).toEqual([null, "4", "12 open / 20 target", null, "0"]);
  });

  it("round Attendance Rate to a whole percent", () => {
    const rate = (present: number, expected: number) =>
      cardsFor(ALL, { attendanceRate: { present, expected } })[3].figure;
    expect(rate(2, 3)).toBe("67%");
    expect(rate(1, 3)).toBe("33%");
    expect(rate(5, 5)).toBe("100%");
  });

  it("show no Attendance Rate figure when nobody is expected", () => {
    expect(cardsFor(ALL, { attendanceRate: { present: 0, expected: 0 } })[3].figure).toBeNull();
  });
});

const NOW = new Date(2026, 9, 27, 12); // 27 Oct 2026

describe("Widgets", () => {
  const names = (pages: string[], summary: DashboardSummary = {}) =>
    widgetRowsFor(pages, summary, NOW).map((row) => row.map((w) => w.label));

  it("are laid out two per row in fixed order", () => {
    expect(names(ALL)).toEqual([
      ["Headcount Trend", "Department Distribution"],
      ["Recent Activity", "Upcoming Events"],
    ]);
  });

  it("only include Widgets whose Module is held, a lone Widget forming its own row", () => {
    expect(names(["/attendance"])).toEqual([["Upcoming Events"]]);
    expect(names(["/employee-information"])).toEqual([
      ["Headcount Trend", "Department Distribution"],
      ["Recent Activity"],
    ]);
  });

  it("are absent when neither Module is held", () => {
    expect(names(["/dashboard", "/recruitment-and-hiring", "/nope"])).toEqual([]);
  });

  it("have no data without a supply from their Module", () => {
    expect(widgetRowsFor(ALL, {}, NOW).flat().map((w) => w.data)).toEqual([null, null, null, null]);
  });
});

describe("Headcount Trend", () => {
  const trend = (summary: DashboardSummary) =>
    widgetRowsFor(["/employee-information"], summary, NOW)[0][0].data as
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
});

describe("Department Distribution", () => {
  const slices = (summary: DashboardSummary) =>
    widgetRowsFor(["/employee-information"], summary, NOW)[0][1].data;

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
    widgetRowsFor(["/employee-information"], summary, NOW)[1][0].data as { id: string; ago: string }[] | null;

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
  const ev = (id: string, date: string, kind: "holiday" | "leave" = "holiday") => ({
    id,
    kind,
    title: id,
    date,
    description: "",
  });
  const items = (summary: DashboardSummary) =>
    widgetRowsFor(["/attendance"], summary, NOW)[0][0].data as { id: string }[] | null;

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

  it("shows at most 10", () => {
    const many = Array.from({ length: 15 }, (_, i) => ev(`e${i}`, "2026-11-01"));
    expect(items({ upcomingEvents: many })).toHaveLength(10);
  });

  it("is absent when nothing is coming up", () => {
    expect(items({ upcomingEvents: [ev("past", "2026-01-01")] })).toBeNull();
  });
});
