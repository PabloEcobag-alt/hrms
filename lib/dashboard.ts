import { MODULES, type Module } from "@/lib/modules";

const PURPOSES: Record<Module["name"], string> = {
  Dashboard: "A summary of the Modules you can open.",
  Attendance: "Employee attendance and time records.",
  "Employee Information": "Employee records and details.",
  "Payroll & ESS": "Payroll runs and employee self-service.",
  "Recruitment and Hiring": "Job openings, applicants, and hiring.",
  "User Management": "Staff accounts and their access.",
};

export interface Widget {
  name: Module["name"];
  href: Module["href"];
  purpose: string;
}

/**
 * The Widgets a Staff member sees: one per Module they hold, in Module order. The Dashboard has
 * no Widget of its own. Unknown addresses are ignored, so only real Modules can produce one.
 */
export function widgetsFor(permittedPages: readonly string[]): Widget[] {
  return MODULES.filter(
    (m) => m.name !== "Dashboard" && permittedPages.includes(m.href),
  ).map((m) => ({ name: m.name, href: m.href, purpose: PURPOSES[m.name] }));
}
