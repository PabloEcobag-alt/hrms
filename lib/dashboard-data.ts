import { database, type Database } from "./database";
import type { DashboardSummary } from "./dashboard";

/** Open Job Postings, read from the shared database: how many, their openings in total and their distinct locations. */
export async function openJobsSummary(db: Database = database): Promise<NonNullable<DashboardSummary["openJobs"]>> {
  const { rows } = await db.query<{ count: number; openings: number; locations: number }>(
    `SELECT count(*)::int AS count, coalesce(sum(openings), 0)::int AS openings, count(DISTINCT location)::int AS locations
     FROM public.job_postings WHERE status = 'open'`,
  );
  return rows[0];
}

/** The summary data for the Modules a Staff member holds; a Module they do not hold is never read. */
export async function dashboardSummaryFor(permittedPages: readonly string[], db: Database = database): Promise<DashboardSummary> {
  return permittedPages.includes("/job-postings") ? { openJobs: await openJobsSummary(db) } : {};
}
