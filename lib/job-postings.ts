import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { accessFor } from "./portal/access";

export type JobPostingStatus = "draft" | "open" | "closed" | "filled";
export type JobPostingFields = {
  title: string;
  department: string;
  employmentType: string;
  location: string;
  description: string;
  requirements: string;
  requiredDocuments: string[];
  screeningCriteria: string[];
  deadline: Date | null;
};
export type JobPosting = JobPostingFields & {
  id: string;
  status: JobPostingStatus;
  updatedAt: Date;
};

/** A Postgres connection; tests supply disposable Postgres, never shared data. */
export type PostingDatabase = {
  query<T>(sql: string, values?: unknown[]): Promise<{ rows: T[] }>;
};

let pool: Pool | undefined;
const database: PostingDatabase = {
  async query<T>(sql: string, values?: unknown[]) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
    if (!pool) {
      pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
      attachDatabasePool(pool);
    }
    const result = await pool.query(sql, values);
    return { rows: result.rows as T[] };
  },
};

export class JobPostingError extends Error {
  constructor(public readonly reason: "denied" | "invalid" | "unavailable" | "not-found" | "not-draft") {
    super(`Job Posting: ${reason}`);
  }
}

const columns = `id, title, department, employment_type AS "employmentType",
  location, description, requirements, required_documents AS "requiredDocuments",
  screening_criteria AS "screeningCriteria", deadline, status, updated_at AS "updatedAt"`;

/** Server-side interface. Pass the opaque Portal session handle from the request.
 * Each operation asks the Portal anew, so revocation takes effect immediately.
 */
export function jobPostingsFor(sessionHandle: string | undefined, db: PostingDatabase = database) {
  async function authorize() {
    const result = await accessFor(sessionHandle).check("Recruitment and Hiring");
    if (result.decision !== "allowed") throw new JobPostingError(result.decision);
  }

  async function draftMissing(id: string): Promise<never> {
    const { rows } = await db.query(`SELECT id FROM public.job_postings WHERE id = $1`, [id]);
    throw new JobPostingError(rows.length ? "not-draft" : "not-found");
  }

  return {
    async saveDraft(fields: Partial<JobPostingFields>): Promise<JobPosting> {
      await authorize();
      const { rows } = await db.query<JobPosting>(
        `INSERT INTO public.job_postings
          (id, title, department, employment_type, location, description, requirements,
           required_documents, screening_criteria, deadline, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,'draft') RETURNING ${columns}`,
        [randomUUID(), fields.title ?? "", fields.department ?? "", fields.employmentType ?? "",
          fields.location ?? "", fields.description ?? "", fields.requirements ?? "",
          JSON.stringify(fields.requiredDocuments ?? []), JSON.stringify(fields.screeningCriteria ?? []),
          fields.deadline ?? null],
      );
      return rows[0];
    },
    async editDraft(id: string, fields: Partial<JobPostingFields>): Promise<JobPosting> {
      await authorize();
      const names = {
        title: "title", department: "department", employmentType: "employment_type",
        location: "location", description: "description", requirements: "requirements",
        requiredDocuments: "required_documents", screeningCriteria: "screening_criteria", deadline: "deadline",
      } as const;
      const values: unknown[] = [id];
      const updates: string[] = [];
      for (const field of Object.keys(names) as (keyof JobPostingFields)[]) {
        if (fields[field] === undefined) continue;
        const json = field === "requiredDocuments" || field === "screeningCriteria";
        values.push(json ? JSON.stringify(fields[field]) : fields[field]);
        updates.push(`${names[field]} = $${values.length}${json ? "::jsonb" : ""}`);
      }
      const sql = updates.length
        ? `UPDATE public.job_postings SET ${updates.join(", ")}, updated_at = clock_timestamp()
           WHERE id = $1 AND status = 'draft' RETURNING ${columns}`
        : `SELECT ${columns} FROM public.job_postings WHERE id = $1 AND status = 'draft'`;
      const { rows } = await db.query<JobPosting>(sql, values);
      if (!rows[0]) await draftMissing(id);
      return rows[0];
    },
    async deleteDraft(id: string): Promise<void> {
      await authorize();
      const { rows } = await db.query(
        `DELETE FROM public.job_postings WHERE id = $1 AND status = 'draft' RETURNING id`, [id],
      );
      if (!rows.length) await draftMissing(id);
    },
    async list(filters: { status?: JobPostingStatus; search?: string } = {}): Promise<JobPosting[]> {
      await authorize();
      return (await db.query<JobPosting>(
        `SELECT ${columns} FROM public.job_postings
         WHERE ($1::text IS NULL OR status = $1)
           AND ($2::text IS NULL OR strpos(lower(title), lower($2)) > 0)
         ORDER BY updated_at DESC, id`,
        [filters.status ?? null, filters.search ?? null],
      )).rows;
    },
    async read(id: string): Promise<JobPosting | undefined> {
      await authorize();
      return (await db.query<JobPosting>(`SELECT ${columns} FROM public.job_postings WHERE id = $1`, [id])).rows[0];
    },
  };
}
