import { describe, expect, it } from "vitest";
import { widgetsFor } from "@/lib/dashboard";

describe("Widgets", () => {
  it("are one per held Module, in Module order, without a Dashboard Widget", () => {
    const widgets = widgetsFor(["/payroll-ess", "/dashboard", "/attendance"]);

    expect(widgets.map((w) => w.name)).toEqual(["Attendance", "Payroll & ESS"]);
  });

  it("exclude Modules the Staff member does not hold", () => {
    const widgets = widgetsFor(["/dashboard", "/attendance", "/not-a-module"]);

    expect(widgets.map((w) => w.name)).toEqual(["Attendance"]);
  });

  it("are empty when only the Dashboard or unknown addresses are held", () => {
    expect(widgetsFor(["/dashboard"])).toEqual([]);
    expect(widgetsFor(["/not-a-module"])).toEqual([]);
  });
});
