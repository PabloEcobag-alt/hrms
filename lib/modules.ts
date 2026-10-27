// The Portal and HRMS use the same Module names (see CONTEXT.md).
export const MODULES = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Attendance", href: "/attendance" },
  { name: "Employee Information", href: "/employee-information" },
  { name: "Payroll & ESS", href: "/payroll-ess" },
  { name: "Recruitment and Hiring", href: "/job-postings" },
  { name: "User Management", href: "/user-management" },
] as const;

export type Module = (typeof MODULES)[number];
