import type { Module } from "@/lib/modules";

/** Data each owning Module supplies for its Key Summary Cards. Absent until the Module has data. */
export interface DashboardSummary {
  totalEmployee?: { regular: number; probationary: number; ojt: number };
  newHire?: { count: number };
  /** Open Job Postings: how many, the openings they list in total (postings that give no number add none) and their distinct locations. */
  openJobs?: { count: number; openings: number; locations: number };
  /** Applications received in the Dashboard Range and in its Previous period. */
  applicants?: { current: number; previous: number };
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

export type UpcomingEvent = {
  id: string;
  title: string;
  /** "YYYY-MM-DD"; the start date for multi-day leave. */
  date: string;
  description: string;
} & ({ kind: "holiday" } | { kind: "leave"; status: "approved" | "pending" });

export interface KeySummaryCard {
  label: string;
  module: Module["name"];
  /** The headline figure, or null when the owning Module has no data to show yet. */
  figure: string | null;
  /** The line under the figure, or null when there is none. */
  caption: string | null;
  /** The comparison the caption states, for its colour and arrow; null when the card makes none. */
  comparison: Comparison | null;
}

export interface Comparison {
  /** E.g. "12% vs last month" or "No change vs last month". */
  text: string;
  /** Green for improvement, red for adverse, grey for none. */
  tone: "good" | "bad" | "none";
  /** The direction the number moved; none when there was no change. */
  arrow: "up" | "down" | "none";
}

/** Percent change from the Previous period, whole numbers. Left out (null) when either period has no data: a null figure, or a Previous period of zero to divide by. A counted zero is data. */
export function compare(
  current: number | null,
  previous: number | null,
  wording: string,
  better: "higher" | "lower" = "higher",
): Comparison | null {
  if (current === null || !previous) return null;
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.5) return { text: `No change ${wording}`, tone: "none", arrow: "none" };
  const up = change > 0;
  return {
    text: `${Math.round(Math.abs(change))}% ${wording}`,
    tone: up === (better === "higher") ? "good" : "bad",
    arrow: up ? "up" : "down",
  };
}

export const RANGE_IDS = ["this-month", "last-month", "last-30-days", "last-90-days", "year-to-date"] as const;
export type RangeId = (typeof RANGE_IDS)[number];

export interface RangePeriod {
  /** First and last day, "YYYY-MM-DD" in Manila time. */
  start: string;
  end: string;
}

/** The Dashboard Range: the period the range-dependent cards cover, and the Previous period they compare with. */
export interface DashboardRange extends RangePeriod {
  id: RangeId;
  name: string;
  /** "This month · 1–28 Oct 2026". */
  label: string;
  /** Manila midnight starting the first day, and starting the day after the last: query `>= from AND < to`. */
  from: Date;
  to: Date;
  previous: RangePeriod & { wording: string; from: Date; to: Date };
}

export const RANGE_OPTIONS: readonly { id: RangeId; name: string }[] = [
  { id: "this-month", name: "This month" },
  { id: "last-month", name: "Last month" },
  { id: "last-30-days", name: "Last 30 days" },
  { id: "last-90-days", name: "Last 90 days" },
  { id: "year-to-date", name: "Year to date" },
];

/** A known preset from the URL, otherwise This month. */
export function parseRangeId(value: unknown): RangeId {
  return RANGE_IDS.find((id) => id === value) ?? "this-month";
}

// Manila has no daylight saving, so a fixed +08:00 offset is exact. Days are handled as UTC dates standing for Manila calendar days.
const MANILA_OFFSET_MS = 8 * 3_600_000;
const day = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d));
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * MS_PER_DAY);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysInMonth = (y: number, m: number) => day(y, m + 1, 0).getUTCDate();
const manilaMidnight = (d: Date) => new Date(`${iso(d)}T00:00:00+08:00`);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function periodLabel(start: Date, end: Date): string {
  const [sd, sm, sy] = [start.getUTCDate(), MONTHS[start.getUTCMonth()], start.getUTCFullYear()];
  const [ed, em, ey] = [end.getUTCDate(), MONTHS[end.getUTCMonth()], end.getUTCFullYear()];
  if (sy !== ey) return `${sd} ${sm} ${sy} – ${ed} ${em} ${ey}`;
  if (sm !== em) return `${sd} ${sm} – ${ed} ${em} ${ey}`;
  return sd === ed ? `${sd} ${sm} ${sy}` : `${sd}–${ed} ${sm} ${sy}`;
}

/** The same day-of-month `months` earlier, held at the end of a shorter month (31 Mar -> 28 Feb). */
function monthsBack(d: Date, months: number): Date {
  const first = day(d.getUTCFullYear(), d.getUTCMonth() - months, 1);
  const y = first.getUTCFullYear();
  const m = first.getUTCMonth();
  return day(y, m, Math.min(d.getUTCDate(), daysInMonth(y, m)));
}

/** The Dashboard Range for a preset, with `now` read as a Manila date. Pure: `now` is passed in. */
export function dashboardRange(id: unknown, now: Date): DashboardRange {
  const rangeId = parseRangeId(id);
  const m = new Date(now.getTime() + MANILA_OFFSET_MS);
  const [y, mo] = [m.getUTCFullYear(), m.getUTCMonth()];
  const today = day(y, mo, m.getUTCDate());

  let start: Date, end: Date, previousStart: Date, previousEnd: Date, wording: string;
  if (rangeId === "this-month") {
    start = day(y, mo, 1);
    end = today;
    previousStart = day(y, mo - 1, 1);
    previousEnd = monthsBack(today, 1);
    wording = "vs last month";
  } else if (rangeId === "last-month") {
    start = day(y, mo - 1, 1);
    end = day(y, mo, 0);
    previousStart = day(y, mo - 2, 1);
    previousEnd = day(y, mo - 1, 0);
    wording = "vs month before";
  } else if (rangeId === "year-to-date") {
    start = day(y, 0, 1);
    end = today;
    previousStart = day(y - 1, 0, 1);
    previousEnd = monthsBack(today, 12);
    wording = "vs last year";
  } else {
    const days = rangeId === "last-30-days" ? 30 : 90;
    start = addDays(today, 1 - days);
    end = today;
    previousStart = addDays(start, -days);
    previousEnd = addDays(start, -1);
    wording = `vs previous ${days} days`;
  }

  const name = RANGE_OPTIONS.find((o) => o.id === rangeId)!.name;
  return {
    id: rangeId,
    name,
    label: `${name} · ${periodLabel(start, end)}`,
    start: iso(start),
    end: iso(end),
    from: manilaMidnight(start),
    to: manilaMidnight(addDays(end, 1)),
    previous: {
      start: iso(previousStart),
      end: iso(previousEnd),
      wording,
      from: manilaMidnight(previousStart),
      to: manilaMidnight(addDays(previousEnd, 1)),
    },
  };
}

/** The hiring cards sit in a row of their own above the rest. */
type CardRow = "hiring" | "people";

interface CardSpec {
  label: string;
  module: Module["name"];
  href: Module["href"];
  row: CardRow;
  figure: (summary: DashboardSummary) => string | null;
  caption?: (summary: DashboardSummary) => string | null;
  /** The comparison with the Previous period, which doubles as the caption. */
  comparison?: (summary: DashboardSummary, range: DashboardRange) => Comparison | null;
}

const MS_PER_DAY = 86_400_000;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const CARDS: readonly CardSpec[] = [
  {
    label: "Open jobs",
    module: "Recruitment and Hiring",
    href: "/job-postings",
    row: "hiring",
    figure: ({ openJobs: d }) => (d && d.count > 0 ? String(d.count) : null),
    caption: ({ openJobs: d }) =>
      d && d.count > 0
        ? [d.openings > 0 ? plural(d.openings, "opening") : "", plural(d.locations, "location")].filter(Boolean).join(" · ")
        : null,
  },
  {
    label: "Applicants",
    module: "Recruitment and Hiring",
    href: "/job-postings",
    row: "hiring",
    figure: ({ applicants: d }) => (d ? String(d.current) : null),
    comparison: ({ applicants: d }, range) => (d ? compare(d.current, d.previous, range.previous.wording) : null),
  },
  {
    label: "Total Employee",
    module: "Employee Information",
    href: "/employee-information",
    row: "people",
    figure: ({ totalEmployee: d }) =>
      d ? String(d.regular + d.probationary + d.ojt) : null,
  },
  {
    label: "New Hire",
    module: "Employee Information",
    href: "/employee-information",
    row: "people",
    figure: ({ newHire: d }) => (d ? String(d.count) : null),
  },
  {
    label: "Attendance Rate",
    module: "Attendance",
    href: "/attendance",
    row: "people",
    figure: ({ attendanceRate: d }) =>
      d && d.expected > 0 ? `${Math.round((d.present / d.expected) * 100)}%` : null,
  },
  {
    label: "Pending Leaves",
    module: "Attendance",
    href: "/attendance",
    row: "people",
    figure: ({ pendingLeaves: d }) => (d ? String(d.total) : null),
  },
];

const CARD_ROWS: readonly CardRow[] = ["hiring", "people"];

/**
 * The Key Summary Cards a Staff member sees, as the Dashboard rows (hiring first, then the rest), each
 * in fixed order: one card per card whose owning Module they hold. A row with no card is left out, and
 * unknown addresses are ignored, so only real Modules can produce a card.
 */
export function cardRowsFor(
  permittedPages: readonly string[],
  summary: DashboardSummary,
  range: DashboardRange,
): KeySummaryCard[][] {
  return CARD_ROWS.map((row) =>
    CARDS.filter((c) => c.row === row && permittedPages.includes(c.href)).map((c) => {
      const comparison = c.comparison?.(summary, range) ?? null;
      return {
        label: c.label,
        module: c.module,
        figure: c.figure(summary),
        caption: comparison?.text ?? c.caption?.(summary) ?? null,
        comparison,
      };
    }),
  ).filter((cards) => cards.length > 0);
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

/** A Detail Widget and the data it shows; `data` is null when its owning Module has none yet. */
export type DetailWidget = {
  label: string;
  module: Module["name"];
} & (
  | { id: "headcount-trend"; data: HeadcountPoint[] | null }
  | { id: "department-distribution"; data: DepartmentSlice[] | null }
  | { id: "recent-activity"; data: ActivityItem[] | null }
  | { id: "upcoming-events"; data: UpcomingEvent[] | null }
);

const TREND_MONTHS = 12;
const ACTIVITY_LIMIT = 10;
const EVENT_LIMIT = 10;
const EVENT_WINDOW_DAYS = 30;
const UNASSIGNED = "Unassigned";

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
    const name = department ?? UNASSIGNED;
    byName.set(name, (byName.get(name) ?? 0) + count);
  }
  // Slices must sum to Total Employee: anyone the counts miss has no department on record.
  const t = summary.totalEmployee;
  if (t && byName.size > 0) {
    const counted = [...byName.values()].reduce((sum, c) => sum + c, 0);
    const missing = t.regular + t.probationary + t.ojt - counted;
    if (missing > 0) byName.set(UNASSIGNED, (byName.get(UNASSIGNED) ?? 0) + missing);
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
    .filter((e) => e.kind === "holiday" || e.status === "approved")
    .filter((e) => day(e) >= from && day(e) <= from + EVENT_WINDOW_DAYS)
    .sort((a, b) => day(a) - day(b))
    .slice(0, EVENT_LIMIT);
  return items.length > 0 ? items : null;
}

interface DetailWidgetSpec {
  href: Module["href"];
  build: (summary: DashboardSummary, now: Date) => DetailWidget;
}

/** Fixed order; consecutive pairs form the rows of the Dashboard grid. */
const DETAIL_WIDGETS: readonly DetailWidgetSpec[] = [
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
 * The Detail Widgets a Staff member sees, grouped into the two fixed grid rows (Headcount Trend |
 * Department Distribution, then Recent Activity | Upcoming Events). Detail Widgets whose Module is not held
 * are dropped; a row left with one Detail Widget spans the full width and an empty row disappears.
 */
export function detailWidgetRowsFor(
  permittedPages: readonly string[],
  summary: DashboardSummary,
  now: Date,
): DetailWidget[][] {
  const rows: DetailWidget[][] = [];
  for (let i = 0; i < DETAIL_WIDGETS.length; i += 2) {
    const row = DETAIL_WIDGETS.slice(i, i + 2)
      .filter((w) => permittedPages.includes(w.href))
      .map((w) => w.build(summary, now));
    if (row.length > 0) rows.push(row);
  }
  return rows;
}
