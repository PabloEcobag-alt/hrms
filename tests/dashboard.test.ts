import { describe, expect, it } from "vitest";
import { cardsFor, type DashboardSummary } from "@/lib/dashboard";

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
    expect(cards.map((c) => c.figure)).toEqual(["0", "4", "12 open / 20 target", null, "0"]);
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
