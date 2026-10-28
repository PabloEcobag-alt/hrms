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
export type ApplicationPage = { rows: ApplicationListItem[]; total: number; page: number; pageSize: 25 };

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
    async list({ page = 1 }: { page?: number } = {}): Promise<ApplicationPage> {
      const access = await accessFor(sessionHandle).check("Recruitment and Hiring");
      if (access.decision !== "allowed") throw new ApplicationError(access.decision);
      if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger((page - 1) * 25)) {
        throw new ApplicationError("validation");
      }
      // One statement keeps the page and total on the same snapshot, even for an empty page.
      const { rows } = await db.query<{ total: number; items: (Omit<ApplicationListItem, "nextStep" | "appliedAt"> & { appliedAt: string })[] }>(`
        SELECT (SELECT count(*)::integer FROM public.hrms_careers_applications) AS total,
          COALESCE(jsonb_agg(to_jsonb(items) ORDER BY items."appliedAt" DESC, items.id DESC)
            FILTER (WHERE items.id IS NOT NULL), '[]'::jsonb) AS items
        FROM (
          SELECT id, applicant_name AS "applicantName", applicant_email AS "applicantEmail",
            job_posting_id AS "jobPostingId", job_posting_title AS "jobPostingTitle",
            location, applied_at AS "appliedAt", stage
          FROM public.hrms_careers_applications
          ORDER BY applied_at DESC, id DESC LIMIT 25 OFFSET $1
        ) items`, [(page - 1) * 25]);
      return {
        rows: rows[0].items.map((item) => ({ ...item, appliedAt: new Date(item.appliedAt), nextStep: nextSteps[item.stage] })),
        total: rows[0].total, page, pageSize: 25,
      };
    },
  };
}
