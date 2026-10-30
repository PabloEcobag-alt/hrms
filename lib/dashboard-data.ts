import { database, type Database } from "./database";
import type { DashboardRange, DashboardSummary } from "./dashboard";

/** Open Job Postings, read from the shared database: how many, their openings in total and their distinct locations. */
export async function openJobsSummary(db: Database = database): Promise<NonNullable<DashboardSummary["openJobs"]>> {
  const { rows } = await db.query<{ count: number; openings: number; locations: number }>(
    `SELECT count(*)::int AS count, coalesce(sum(openings), 0)::int AS openings, count(DISTINCT location)::int AS locations
     FROM public.job_postings WHERE status = 'open'`,
  );
  return rows[0];
}

/** Applications received (every one in the shared list, whatever its Stage) in the range and in its Previous period. */
export async function applicantsSummary(range: DashboardRange, db: Database = database): Promise<NonNullable<DashboardSummary["applicants"]>> {
  const { rows } = await db.query<{ current: number; previous: number }>(
    `SELECT count(*) FILTER (WHERE applied_at >= $1 AND applied_at < $2)::int AS current,
            count(*) FILTER (WHERE applied_at >= $3 AND applied_at < $4)::int AS previous
     FROM public.hrms_all_applications`,
    [range.from.toISOString(), range.to.toISOString(), range.previous.from.toISOString(), range.previous.to.toISOString()],
  );
  return rows[0];
}

/** The summary data for the Modules a Staff member holds; a Module they do not hold is never read. */
export async function dashboardSummaryFor(
  permittedPages: readonly string[],
  range: DashboardRange,
  db: Database = database,
): Promise<DashboardSummary> {
  if (!permittedPages.includes("/job-postings")) return {};
  const [openJobs, applicants] = await Promise.all([openJobsSummary(db), applicantsSummary(range, db)]);
  return { openJobs, applicants };
}
