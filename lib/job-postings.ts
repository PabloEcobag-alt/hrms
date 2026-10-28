import { deliverAnnouncements } from "./job-posting-announcements";
import { auditedMutation, retryJobPostingAudit } from "./job-posting-audit";
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
  openings: number | null;
};
export type JobPosting = JobPostingFields & {
  id: string;
  status: JobPostingStatus;
  firstPublishedAt: Date | null;
  updatedAt: Date;
};

/** List-only projection; Applications remain owned by Careers. */
export type JobPostingListItem = JobPosting & { readonly applicantCount: number };

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
  screening_criteria AS "screeningCriteria", openings, deadline, status, first_published_at AS "firstPublishedAt", updated_at AS "updatedAt"`;

/** Internal maintenance entry point; callers must authenticate the scheduled request. */
export async function closeExpiredJobPostings(db: PostingDatabase = database): Promise<void> {
  await db.query(`UPDATE public.job_postings SET status = 'closed', updated_at = clock_timestamp()
    WHERE status = 'open' AND deadline <= clock_timestamp()`);
}

const fieldColumns = {
  title: "title", department: "department", employmentType: "employment_type",
  location: "location", description: "description", requirements: "requirements",
  requiredDocuments: "required_documents", screeningCriteria: "screening_criteria", deadline: "deadline", openings: "openings",
} as const;
// Match the positive PostgreSQL integer range before sending values to the driver.
function invalidOpenings(value: number | null | undefined): boolean {
  return value !== undefined && value !== null &&
    (!Number.isInteger(value) || value <= 0 || value > 2_147_483_647);
}

function validatePostingOpenings(fields: Partial<JobPostingFields>) {
  if (invalidOpenings(fields.openings)) {
    throw new JobPostingError("validation", { openings: "openings must be a positive integer" });
  }
}

// ECMAScript trim whitespace, shared by SQL validation and field error reporting.
const whitespace = " \t\n\r\v\f\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff";

/** Server-side interface. Pass the opaque Portal session handle from the request.
 * Each operation asks the Portal anew, so revocation takes effect immediately.
 */
export function jobPostingsFor(sessionHandle: string | undefined, db: PostingDatabase = database) {
  async function authorize() {
    const result = await accessFor(sessionHandle).check("Recruitment and Hiring");
    if (result.decision !== "allowed") throw new JobPostingError(result.decision);
    return result.staff;
  }

  async function draftMissing(id: string): Promise<never> {
    const { rows } = await db.query(`SELECT id FROM public.job_postings WHERE id = $1`, [id]);
    throw new JobPostingError(rows.length ? "not-draft" : "not-found");
  }

  const expire = () => closeExpiredJobPostings(db);

  async function change(id: string, status: "draft" | "open", fields: Partial<JobPostingFields>, target: JobPostingStatus) {
    const staff = await authorize();
    validatePostingOpenings(fields);
    await expire();
    if (fields.deadline && !Number.isFinite(fields.deadline.getTime())) {
      throw new JobPostingError("validation", { deadline: "deadline must be a valid future date" });
    }
    const names = fieldColumns;
    const values: unknown[] = [id, status, target, whitespace];
    const expressions: Record<string, string> = { ...names };
    const updates = ["status = $3", "updated_at = clock_timestamp()"];
    if (status === "draft" && target === "open") {
      updates.push("first_published_at = COALESCE(first_published_at, clock_timestamp())");
    }
    for (const field of Object.keys(names) as (keyof JobPostingFields)[]) {
      if (fields[field] === undefined) continue;
      const json = field === "requiredDocuments" || field === "screeningCriteria";
      values.push(json ? JSON.stringify(fields[field]) : fields[field]);
      const expression = `$${values.length}${json ? "::jsonb" : field === "deadline" ? "::timestamptz" : field === "openings" ? "::integer" : "::text"}`;
      expressions[field] = expression;
      updates.push(`${names[field]} = ${expression}`);
    }
    const required = ["title", "department", "employmentType", "location", "description"] as const;
    // Validate the resulting row inside the write, including concurrent edits.
    const validation = target === "open"
      ? required.map((field) => `length(btrim(${expressions[field]}, $4::text)) > 0`)
        .concat([`${expressions.deadline} > clock_timestamp()`]).join(" AND ")
      : "TRUE";
    const action = target === "closed" ? "job_posting.closed" : target === "filled" ? "job_posting.filled" : status === "draft" ? "job_posting.published" : "job_posting.updated";
    const { rows } = await auditedMutation<JobPosting>(db, staff, action,
      `UPDATE public.job_postings SET ${updates.join(", ")}
       WHERE id = $1 AND status = $2 AND $4::text IS NOT NULL AND (${validation})
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
      const staff = await authorize();
      validatePostingOpenings(fields);
      const { rows } = await auditedMutation<JobPosting>(db, staff, "job_posting.created",
        `INSERT INTO public.job_postings
          (id, title, department, employment_type, location, description, requirements,
           required_documents, screening_criteria, openings, deadline, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11,'draft') RETURNING ${columns}`,
        [randomUUID(), fields.title ?? "", fields.department ?? "", fields.employmentType ?? "",
          fields.location ?? "", fields.description ?? "", fields.requirements ?? "",
          JSON.stringify(fields.requiredDocuments ?? []), JSON.stringify(fields.screeningCriteria ?? []),
          fields.openings ?? null, fields.deadline ?? null],
      );
      return rows[0];
    },
    async editDraft(id: string, fields: Partial<JobPostingFields>): Promise<JobPosting> {
      const staff = await authorize();
      validatePostingOpenings(fields);
      const names = fieldColumns;
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
      const { rows } = await auditedMutation<JobPosting>(db, staff, "job_posting.updated", sql, values);
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
    async list(filters: { status?: JobPostingStatus; search?: string } = {}): Promise<JobPostingListItem[]> {
      await authorize();
      await expire();
      return (await db.query<JobPostingListItem>(
        `SELECT ${columns},
           coalesce(application_counts.total, 0) AS "applicantCount"
         FROM public.job_postings
         LEFT JOIN (
           SELECT job_posting_id, count(*)::integer AS total
           FROM public.applications WHERE status <> 'Withdrawn'
           GROUP BY job_posting_id
         ) AS application_counts ON application_counts.job_posting_id = job_postings.id
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

export type JobTemplateFields = Omit<JobPostingFields, "deadline">;
export type JobTemplate = JobTemplateFields & { id: string; updatedAt: Date };

export class JobTemplateError extends Error {
  constructor(public readonly reason: "denied" | "invalid" | "unavailable" | "not-found" | "validation", public readonly fieldErrors: Partial<Record<keyof JobTemplateFields, string>> = {}) {
    super(`Job Template: ${reason}`);
  }
}

const templateColumns = `id, title, department, employment_type AS "employmentType",
  location, description, requirements, required_documents AS "requiredDocuments",
  screening_criteria AS "screeningCriteria", openings, updated_at AS "updatedAt"`;

/** Explicit template saves only. Postings keep copied values, never a template id. */
export function jobTemplatesFor(sessionHandle: string | undefined, db: PostingDatabase = database) {
  async function authorize() {
    const result = await accessFor(sessionHandle).check("Recruitment and Hiring");
    if (result.decision !== "allowed") throw new JobTemplateError(result.decision);
    return result.staff;
  }

  return {
    async create(fields: Partial<JobTemplateFields>): Promise<JobTemplate> {
      const staff = await authorize();
      if (invalidOpenings(fields.openings)) throw new JobTemplateError("validation", { openings: "openings must be a positive integer" });
      return (await auditedMutation<JobTemplate>(db, staff, "job_template.created",
        `INSERT INTO public.job_templates
          (id, title, department, employment_type, location, description, requirements,
           required_documents, screening_criteria, openings)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10) RETURNING ${templateColumns}`,
        [randomUUID(), fields.title ?? "", fields.department ?? "", fields.employmentType ?? "",
          fields.location ?? "", fields.description ?? "", fields.requirements ?? "",
          JSON.stringify(fields.requiredDocuments ?? []), JSON.stringify(fields.screeningCriteria ?? []), fields.openings ?? null],
      )).rows[0];
    },
    async edit(id: string, fields: Partial<JobTemplateFields>): Promise<JobTemplate> {
      const staff = await authorize();
      if (invalidOpenings(fields.openings)) throw new JobTemplateError("validation", { openings: "openings must be a positive integer" });
      const values: unknown[] = [id];
      const updates: string[] = [];
      for (const field of Object.keys(fieldColumns) as (keyof JobPostingFields)[]) {
        if (field === "deadline" || fields[field] === undefined) continue;
        const json = field === "requiredDocuments" || field === "screeningCriteria";
        values.push(json ? JSON.stringify(fields[field]) : fields[field]);
        updates.push(`${fieldColumns[field]} = $${values.length}${json ? "::jsonb" : ""}`);
      }
      const sql = updates.length
        ? `UPDATE public.job_templates SET ${updates.join(", ")}, updated_at = clock_timestamp()
           WHERE id = $1 RETURNING ${templateColumns}`
        : `SELECT ${templateColumns} FROM public.job_templates WHERE id = $1`;
      const { rows } = await auditedMutation<JobTemplate>(db, staff, "job_template.updated", sql, values);
      if (!rows[0]) throw new JobTemplateError("not-found");
      return rows[0];
    },
    async delete(id: string): Promise<void> {
      const staff = await authorize();
      const { rows } = await auditedMutation(db, staff, "job_template.deleted", `DELETE FROM public.job_templates WHERE id = $1 RETURNING id, title`, [id]);
      if (!rows.length) throw new JobTemplateError("not-found");
    },
    async startPosting(id: string): Promise<JobPosting> {
      const staff = await authorize();
      const { rows } = await auditedMutation<JobPosting>(db, staff, "job_posting.created",
        `INSERT INTO public.job_postings
          (id, title, department, employment_type, location, description, requirements,
           required_documents, screening_criteria, openings, deadline, status)
         SELECT $2, title, department, employment_type, location, description, requirements,
           required_documents, screening_criteria, openings, NULL, 'draft'
         FROM public.job_templates WHERE id = $1 RETURNING ${columns}`, [id, randomUUID()],
      );
      if (!rows[0]) throw new JobTemplateError("not-found");
      return rows[0];
    },
    async list(): Promise<JobTemplate[]> {
      await authorize();
      return (await db.query<JobTemplate>(`SELECT ${templateColumns} FROM public.job_templates ORDER BY updated_at DESC, id`)).rows;
    },
  };
}

/** Called only after authenticating the maintenance request. */
export async function retryJobPostingAuditDelivery(db: PostingDatabase = database) {
  await retryJobPostingAudit(db);
}

/** Authenticated maintenance only; announcement delivery never runs on the publish path. */
export async function retryJobPostingAnnouncements(db: PostingDatabase = database) {
  await deliverAnnouncements(db);
  await retryJobPostingAudit(db);
}
