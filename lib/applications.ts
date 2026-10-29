import { database, type Database } from "./database";
import { accessFor } from "./portal/access";

export type ApplicationStage = "New" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected" | "Withdrawn";
export type ApplicationListItem = {
  id: number;
  applicantName: string;
  applicantEmail: string;
  jobPostingId: string;
  jobPostingTitle: string;
  location: string;
  appliedAt: Date;
  stage: ApplicationStage;
  nextStep: string;
};
export type ApplicationTab = "All" | Exclude<ApplicationStage, "Withdrawn">;
export type ApplicationJobPostingOption = { id: string; title: string; applicationCount: number };
export type ApplicationPage = { jobPostingOptions: ApplicationJobPostingOption[]; newThisWeek: number; stageCounts: Record<ApplicationTab, number>; rows: ApplicationListItem[]; total: number; page: number; pageSize: 25 };

export class ApplicationError extends Error {
  constructor(public readonly reason: "denied" | "invalid" | "unavailable" | "validation") {
    super(`Application: ${reason}`);
  }
}

const nextSteps: Record<ApplicationStage, string> = {
  New: "Review application",
  Screening: "Schedule interview",
  Interview: "Awaiting result",
  Offer: "Awaiting offer decision",
  Hired: "Hired",
  Rejected: "In talent pool",
  Withdrawn: "Withdrawn by applicant",
};

/** Server-side boundary. Recheck the Portal on every operation, including repeated reads. */
export function applicationsFor(sessionHandle: string | undefined, db: Database = database) {
  return {
    async list({ page = 1, stage = "All", search = "", jobPostingId }: { jobPostingId?: string; page?: number; stage?: ApplicationTab; search?: string } = {}): Promise<ApplicationPage> {
      const access = await accessFor(sessionHandle).check("Recruitment and Hiring");
      if (access.decision !== "allowed") throw new ApplicationError(access.decision);
      if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger((page - 1) * 25)
        || !["All", "New", "Screening", "Interview", "Offer", "Hired", "Rejected"].includes(stage)
        || typeof search !== "string"
        || (jobPostingId !== undefined && (typeof jobPostingId !== "string" || jobPostingId.trim() === ""))) {
        throw new ApplicationError("validation");
      }
      // One statement keeps rows and counts on the same snapshot, even for an empty page.
      const { rows } = await db.query<{ total: number; new_this_week: number; stage_counts: Record<ApplicationTab, number>; job_posting_options: ApplicationJobPostingOption[]; items: (Omit<ApplicationListItem, "nextStep" | "appliedAt"> & { appliedAt: string })[] }>(`
        WITH searched AS (
          SELECT * FROM public.hrms_careers_applications
          WHERE ($4::text IS NULL OR job_posting_id = $4)
            AND (strpos(lower(applicant_name), lower($3::text)) > 0
              OR strpos(lower(applicant_email), lower($3::text)) > 0)
        )
        SELECT (SELECT COALESCE(jsonb_agg(to_jsonb(options) ORDER BY options.title, options.id), '[]'::jsonb)
          FROM (
            SELECT j.id, j.title, count(a.id)::integer AS "applicationCount"
            FROM public.job_postings j
            LEFT JOIN public.applications a ON a.job_posting_id = j.id
            WHERE j.status = 'open'
            GROUP BY j.id, j.title
          ) options) AS job_posting_options,
          (SELECT count(*)::integer FROM searched WHERE ($2::text = 'All' OR stage = $2)) AS total,
          (SELECT count(*)::integer FROM public.hrms_careers_applications
            WHERE applied_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
              AND applied_at <= CURRENT_TIMESTAMP) AS new_this_week,
          (SELECT jsonb_build_object(
            'All', count(*)::integer,
            'New', count(*) FILTER (WHERE stage = 'New')::integer,
            'Screening', count(*) FILTER (WHERE stage = 'Screening')::integer,
            'Interview', count(*) FILTER (WHERE stage = 'Interview')::integer,
            'Offer', count(*) FILTER (WHERE stage = 'Offer')::integer,
            'Hired', count(*) FILTER (WHERE stage = 'Hired')::integer,
            'Rejected', count(*) FILTER (WHERE stage = 'Rejected')::integer
          ) FROM searched) AS stage_counts,
          COALESCE(jsonb_agg(to_jsonb(items) ORDER BY items."appliedAt" DESC, items.id DESC)
            FILTER (WHERE items.id IS NOT NULL), '[]'::jsonb) AS items
        FROM (
          SELECT id, applicant_name AS "applicantName", applicant_email AS "applicantEmail",
            job_posting_id AS "jobPostingId", job_posting_title AS "jobPostingTitle",
            location, applied_at AS "appliedAt", stage
          FROM searched
          WHERE ($2::text = 'All' OR stage = $2)
          ORDER BY applied_at DESC, id DESC LIMIT 25 OFFSET $1
        ) items`, [(page - 1) * 25, stage, search, jobPostingId ?? null]);
      return {
        rows: rows[0].items.map((item) => ({ ...item, appliedAt: new Date(item.appliedAt), nextStep: nextSteps[item.stage] })),
        jobPostingOptions: rows[0].job_posting_options,
        newThisWeek: rows[0].new_this_week, stageCounts: rows[0].stage_counts, total: rows[0].total, page, pageSize: 25,
      };
    },
  };
}
