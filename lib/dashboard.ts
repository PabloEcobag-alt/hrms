import type { Module } from "@/lib/modules";

/** Data each owning Module supplies for its Key Summary Cards. Absent until the Module has data. */
export interface DashboardSummary {
  totalEmployee?: { regular: number; probationary: number; ojt: number };
  newHire?: { count: number };
  openPositions?: { openRequisitions: number; targetHires: number };
  attendanceRate?: { present: number; expected: number };
  pendingLeaves?: { total: number };
  /** Month-end Total Employee figures, `month` as "YYYY-MM". The current month is taken from `totalEmployee`. */
  headcountHistory?: { month: string; total: number }[];
  /** Employee count per department; a null department means the employee has none. */
  departmentCounts?: { department: string | null; count: number }[];
  recentActivity?: ActivityEvent[];
  /** Company holidays and approved leave not yet started. */
  upcomingEvents?: UpcomingEvent[];
}

export interface ActivityEvent {
  id: string;
  kind: "hire" | "transfer" | "status-change" | "separation";
  employeeName: string;
  photoUrl?: string;
  title: string;
  description: string;
  /** ISO timestamp. */
  at: string;
}

export interface UpcomingEvent {
  id: string;
  kind: "holiday" | "leave";
  title: string;
  /** "YYYY-MM-DD"; the start date for multi-day leave. */
  date: string;
  description: string;
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

export interface HeadcountPoint {
  month: string;
  total: number | null;
}

export interface DepartmentSlice {
  department: string;
  count: number;
}

export interface ActivityItem extends ActivityEvent {
  ago: string;
}

/** A Widget and the data it shows; `data` is null when its owning Module has none yet. */
export type Widget = {
  label: string;
  module: Module["name"];
} & (
  | { id: "headcount-trend"; data: HeadcountPoint[] | null }
  | { id: "department-distribution"; data: DepartmentSlice[] | null }
  | { id: "recent-activity"; data: ActivityItem[] | null }
  | { id: "upcoming-events"; data: UpcomingEvent[] | null }
);

const MS_PER_DAY = 86_400_000;
const TREND_MONTHS = 12;
const ACTIVITY_LIMIT = 10;
const EVENT_LIMIT = 10;
const EVENT_WINDOW_DAYS = 30;

/** "YYYY-MM" of the month `offset` months from `now`'s; the Date constructor rolls the year over. */
const monthKey = (now: Date, offset: number) => {
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// Whole local days, so DST shifts cannot move an event across a day boundary.
const dayNumber = (d: Date) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_PER_DAY);

function headcountTrend(summary: DashboardSummary, now: Date): HeadcountPoint[] | null {
  const t = summary.totalEmployee;
  const current = t ? t.regular + t.probationary + t.ojt : null;
  const history = new Map((summary.headcountHistory ?? []).map((h) => [h.month, h.total]));
  const points = Array.from({ length: TREND_MONTHS }, (_, i) => {
    const month = monthKey(now, i - (TREND_MONTHS - 1));
    const isCurrent = i === TREND_MONTHS - 1;
    return { month, total: isCurrent ? current : (history.get(month) ?? null) };
  });
  return points.some((p) => p.total !== null) ? points : null;
}

function departmentDistribution(summary: DashboardSummary): DepartmentSlice[] | null {
  const byName = new Map<string, number>();
  for (const { department, count } of summary.departmentCounts ?? []) {
    if (count <= 0) continue;
    const name = department ?? "Unassigned";
    byName.set(name, (byName.get(name) ?? 0) + count);
  }
  return byName.size > 0
    ? [...byName].map(([department, count]) => ({ department, count }))
    : null;
}

function relativeTime(at: Date, now: Date): string {
  const days = Math.max(0, dayNumber(now) - dayNumber(at));
  return days === 0 ? "Today" : `${days}d ago`;
}

function recentActivity(summary: DashboardSummary, now: Date): ActivityItem[] | null {
  const items = [...(summary.recentActivity ?? [])]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, ACTIVITY_LIMIT)
    .map((e) => ({ ...e, ago: relativeTime(new Date(e.at), now) }));
  return items.length > 0 ? items : null;
}

function upcomingEvents(summary: DashboardSummary, now: Date): UpcomingEvent[] | null {
  const from = dayNumber(now);
  const day = (e: UpcomingEvent) => dayNumber(new Date(`${e.date}T00:00`));
  const items = (summary.upcomingEvents ?? [])
    .filter((e) => day(e) >= from && day(e) <= from + EVENT_WINDOW_DAYS)
    .sort((a, b) => day(a) - day(b))
    .slice(0, EVENT_LIMIT);
  return items.length > 0 ? items : null;
}

interface WidgetSpec {
  href: Module["href"];
  build: (summary: DashboardSummary, now: Date) => Widget;
}

/** Fixed order; consecutive pairs form the rows of the Dashboard grid. */
const WIDGETS: readonly WidgetSpec[] = [
  {
    href: "/employee-information",
    build: (s, now) => ({
      id: "headcount-trend",
      label: "Headcount Trend",
      module: "Employee Information",
      data: headcountTrend(s, now),
    }),
  },
  {
    href: "/employee-information",
    build: (s) => ({
      id: "department-distribution",
      label: "Department Distribution",
      module: "Employee Information",
      data: departmentDistribution(s),
    }),
  },
  {
    href: "/employee-information",
    build: (s, now) => ({
      id: "recent-activity",
      label: "Recent Activity",
      module: "Employee Information",
      data: recentActivity(s, now),
    }),
  },
  {
    href: "/attendance",
    build: (s, now) => ({
      id: "upcoming-events",
      label: "Upcoming Events",
      module: "Attendance",
      data: upcomingEvents(s, now),
    }),
  },
];

/**
 * The Widgets a Staff member sees, grouped into the two fixed grid rows (Headcount Trend |
 * Department Distribution, then Recent Activity | Upcoming Events). Widgets whose Module is not held
 * are dropped; a row left with one Widget spans the full width and an empty row disappears.
 */
export function widgetRowsFor(
  permittedPages: readonly string[],
  summary: DashboardSummary,
  now: Date,
): Widget[][] {
  const rows: Widget[][] = [];
  for (let i = 0; i < WIDGETS.length; i += 2) {
    const row = WIDGETS.slice(i, i + 2)
      .filter((w) => permittedPages.includes(w.href))
      .map((w) => w.build(summary, now));
    if (row.length > 0) rows.push(row);
  }
  return rows;
}
