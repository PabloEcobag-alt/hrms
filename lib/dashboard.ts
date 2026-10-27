import type { Module } from "@/lib/modules";

/** Data each owning Module supplies for its Key Summary Cards. Absent until the Module has data. */
export interface DashboardSummary {
  totalEmployee?: { regular: number; probationary: number; ojt: number };
  newHire?: { count: number };
  openPositions?: { openRequisitions: number; targetHires: number };
  attendanceRate?: { present: number; expected: number };
  pendingLeaves?: { total: number };
}

export interface KeySummaryCard {
  label: string;
  module: Module["name"];
  /** The headline figure, or null when the owning Module has no data to show yet. */
  figure: string | null;
}

interface CardSpec {
  label: string;
  module: Module["name"];
  href: Module["href"];
  figure: (summary: DashboardSummary) => string | null;
}

const CARDS: readonly CardSpec[] = [
  {
    label: "Total Employee",
    module: "Employee Information",
    href: "/employee-information",
    figure: ({ totalEmployee: d }) =>
      d ? String(d.regular + d.probationary + d.ojt) : null,
  },
  {
    label: "New Hire",
    module: "Employee Information",
    href: "/employee-information",
    figure: ({ newHire: d }) => (d ? String(d.count) : null),
  },
  {
    label: "Open Positions",
    module: "Recruitment and Hiring",
    href: "/recruitment-and-hiring",
    figure: ({ openPositions: d }) =>
      d ? `${d.openRequisitions} open / ${d.targetHires} target` : null,
  },
  {
    label: "Attendance Rate",
    module: "Attendance",
    href: "/attendance",
    figure: ({ attendanceRate: d }) =>
      d && d.expected > 0 ? `${Math.round((d.present / d.expected) * 100)}%` : null,
  },
  {
    label: "Pending Leaves",
    module: "Attendance",
    href: "/attendance",
    figure: ({ pendingLeaves: d }) => (d ? String(d.total) : null),
  },
];

/**
 * The Key Summary Cards a Staff member sees, in fixed order: one per card whose owning Module they
 * hold. Unknown addresses are ignored, so only real Modules can produce a card.
 */
export function cardsFor(
  permittedPages: readonly string[],
  summary: DashboardSummary,
): KeySummaryCard[] {
  return CARDS.filter((c) => permittedPages.includes(c.href)).map((c) => ({
    label: c.label,
    module: c.module,
    figure: c.figure(summary),
  }));
}
