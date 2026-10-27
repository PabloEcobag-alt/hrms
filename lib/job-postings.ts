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
  constructor(public readonly reason: "denied" | "invalid" | "unavailable" | "not-found" | "not-draft" | "not-open" | "validation", public readonly fieldErrors: Partial<Record<keyof JobPostingFields, string>> = {}) {
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

  async function expire() {
    await db.query(`UPDATE public.job_postings SET status = 'closed', updated_at = clock_timestamp()
      WHERE status = 'open' AND deadline <= clock_timestamp()`);
  }

  async function change(id: string, status: "draft" | "open", fields: Partial<JobPostingFields>, target: JobPostingStatus) {
    await authorize();
    await expire();
    if (fields.deadline && !Number.isFinite(fields.deadline.getTime())) {
      throw new JobPostingError("validation", { deadline: "deadline must be a valid future date" });
    }
    const names = {
      title: "title", department: "department", employmentType: "employment_type",
      location: "location", description: "description", requirements: "requirements",
      requiredDocuments: "required_documents", screeningCriteria: "screening_criteria", deadline: "deadline",
    } as const;
    const values: unknown[] = [id, status, target];
    const expressions: Record<string, string> = { ...names };
    const updates = ["status = $3", "updated_at = clock_timestamp()"];
    for (const field of Object.keys(names) as (keyof JobPostingFields)[]) {
      if (fields[field] === undefined) continue;
      const json = field === "requiredDocuments" || field === "screeningCriteria";
      values.push(json ? JSON.stringify(fields[field]) : fields[field]);
      const expression = `$${values.length}${json ? "::jsonb" : field === "deadline" ? "::timestamptz" : "::text"}`;
      expressions[field] = expression;
      updates.push(`${names[field]} = ${expression}`);
    }
    const required = ["title", "department", "employmentType", "location", "description"] as const;
    // Validate the resulting row inside the write, including concurrent edits.
    const validation = target === "open"
      ? required.map((field) => `length(btrim(${expressions[field]}, E' \t\n\r')) > 0`)
        .concat([`${expressions.deadline} > clock_timestamp()`]).join(" AND ")
      : "TRUE";
    const { rows } = await db.query<JobPosting>(
      `UPDATE public.job_postings SET ${updates.join(", ")}
       WHERE id = $1 AND status = $2 AND (${validation})
         AND (status != 'open' OR deadline > clock_timestamp()) RETURNING ${columns}`, values,
    );
    if (rows[0]) return rows[0];
    await expire();
    const current = (await db.query<JobPosting>(`SELECT ${columns} FROM public.job_postings WHERE id = $1`, [id])).rows[0];
    if (!current) throw new JobPostingError("not-found");
    if (current.status !== status) throw new JobPostingError(status === "draft" ? "not-draft" : "not-open");
    const candidate = { ...current, ...Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined)) };
    const errors: Partial<Record<keyof JobPostingFields, string>> = {};
    for (const field of required) {
      if (!candidate[field].trim()) errors[field] = `${field} is required`;
    }
    if (!candidate.deadline || candidate.deadline.getTime() <= Date.now()) {
      errors.deadline = "deadline must be a valid future date";
    }
    throw new JobPostingError("validation", errors);
  }

  return {
    publish: (id: string) => change(id, "draft", {}, "open"),
    editOpen: (id: string, fields: Partial<JobPostingFields>) => change(id, "open", fields, "open"),
    close: (id: string) => change(id, "open", {}, "closed"),
    markFilled: (id: string) => change(id, "open", {}, "filled"),
    async closeExpired(): Promise<void> {
      await authorize();
      await expire();
    },
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
      await expire();
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
      await expire();
      return (await db.query<JobPosting>(`SELECT ${columns} FROM public.job_postings WHERE id = $1`, [id])).rows[0];
    },
  };
}
