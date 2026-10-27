import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { sidebarFor, sidebarSections } from "@/components/layout/sidebar-nav";
import { MODULES } from "@/lib/modules";

const ALL_PAGES = MODULES.map((m) => m.href);

const layout = (pages: string[]) =>
  sidebarFor(pages).map((section) => ({
    label: section.label,
    items: section.items.map((item) => item.name),
  }));

describe("sidebar", () => {
  it("lists Dashboard, RECRUITMENT, HIRING, then the remaining Module tabs", () => {
    expect(layout(ALL_PAGES)).toEqual([
      { label: undefined, items: ["Dashboard"] },
      { label: "RECRUITMENT", items: ["Job Postings", "Applicants"] },
      { label: "HIRING", items: ["Interviews", "Offers", "Hired"] },
      {
        label: undefined,
        items: ["Attendance", "Employee Information", "Payroll & ESS", "User Management"],
      },
    ]);
  });

  it("hides both groups without the Recruitment and Hiring Module", () => {
    const pages = ALL_PAGES.filter((href) => href !== "/job-postings");

    expect(layout(pages).flatMap((s) => s.items)).toEqual([
      "Dashboard",
      "Attendance",
      "Employee Information",
      "Payroll & ESS",
      "User Management",
    ]);
    expect(layout(pages).map((s) => s.label)).not.toContain("RECRUITMENT");
    expect(layout(pages).map((s) => s.label)).not.toContain("HIRING");
  });

  it("shows only the tabs the Staff member holds a Module for", () => {
    expect(layout(["/attendance"])).toEqual([{ label: undefined, items: ["Attendance"] }]);
  });

  it("belongs every tab to a Module, with a page and a loading state", () => {
    const moduleNames = MODULES.map((m) => m.name);

    for (const item of sidebarSections.flatMap((s) => s.items)) {
      expect(moduleNames).toContain(item.module);
      const dir = join(process.cwd(), "app/(hrms)", item.href);
      expect(existsSync(join(dir, "page.tsx"))).toBe(true);
      expect(existsSync(join(dir, "loading.tsx"))).toBe(true);
    }
  });
});
