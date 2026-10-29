import { get } from "@vercel/blob";
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
type SubmittedDocument = { id: number; name: string; size: number; contentType: string; requiredFor: string };
export type ApplicationDocument = (SubmittedDocument & { status: "Submitted"; downloadUrl: string })
  | { requiredFor: string; status: "Requested" };
export type ApplicationProfile = Omit<ApplicationListItem, "nextStep"> & {
  documents: ApplicationDocument[];
  mobile: string | null;
  address: string | null;
  expectedSalary: number | null;
  availableFrom: string | null;
};
export type ApplicationTab = "All" | Exclude<ApplicationStage, "Withdrawn">;
export type ApplicationFilters = { jobPostingId?: string; stage?: ApplicationTab; search?: string };
export type ApplicationJobPostingOption = { id: string; title: string; applicationCount: number };
export type ApplicationPage = { jobPostingOptions: ApplicationJobPostingOption[]; newThisWeek: number; stageCounts: Record<ApplicationTab, number>; rows: ApplicationListItem[]; total: number; page: number; pageSize: 25 };

export class ApplicationError extends Error {
  constructor(public readonly reason: "denied" | "invalid" | "unavailable" | "validation" | "not-found") {
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
  async function read({ page = 1, stage = "All", search = "", jobPostingId }: ApplicationFilters & { page?: number } = {}, paginated = true): Promise<ApplicationPage> {
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
        ORDER BY applied_at DESC, id DESC LIMIT $5 OFFSET $1
      ) items`, [(page - 1) * 25, stage, search, jobPostingId ?? null, paginated ? 25 : null]);
    return {
      rows: rows[0].items.map((item) => ({ ...item, appliedAt: new Date(item.appliedAt), nextStep: nextSteps[item.stage] })),
      jobPostingOptions: rows[0].job_posting_options,
      newThisWeek: rows[0].new_this_week, stageCounts: rows[0].stage_counts, total: rows[0].total, page, pageSize: 25,
    };
  }

  return {
    async downloadDocument(id: number, documentId: number): Promise<Response> {
      const access = await accessFor(sessionHandle).check("Recruitment and Hiring");
      if (access.decision !== "allowed") throw new ApplicationError(access.decision);
      if (![id, documentId].every((value) => Number.isInteger(value) && value > 0 && value <= 2_147_483_647)) {
        throw new ApplicationError("validation");
      }
      // Resolve storage only for a snapshot member owned by the same Applicant.
      const { rows } = await db.query<SubmittedDocument & { pathname: string }>(`
        SELECT snapshot->>'name' AS name, (snapshot->>'size')::integer AS size,
          snapshot->>'contentType' AS "contentType", d.blob_pathname AS pathname
        FROM public.applications a
        CROSS JOIN LATERAL jsonb_array_elements(a.documents_snapshot) snapshot
        JOIN public.applicant_documents d ON d.id = $2 AND d.applicant_id = a.applicant_id
        WHERE a.id = $1 AND snapshot->>'id' = $2::text`, [id, documentId]);
      const document = rows[0];
      if (!document) throw new ApplicationError("not-found");
      let blob;
      try {
        blob = await get(document.pathname, { access: "private", useCache: false });
      } catch {
        throw new ApplicationError("unavailable");
      }
      if (!blob) throw new ApplicationError("not-found");
      if (blob.statusCode !== 200) throw new ApplicationError("unavailable");
      const filename = encodeURIComponent(document.name).replace(/[!'()*]/g, (character) =>
        `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
      return new Response(blob.stream, { headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      } });
    },
    async readProfile(id: number): Promise<ApplicationProfile> {
      const access = await accessFor(sessionHandle).check("Recruitment and Hiring");
      if (access.decision !== "allowed") throw new ApplicationError(access.decision);
      if (!Number.isInteger(id) || id < 1 || id > 2_147_483_647) throw new ApplicationError("validation");
      // Careers snapshots use phone/location. Older snapshots omit email and the
      // optional salary/availability fields; only email has a legacy identity fallback.
      const { rows } = await db.query<Omit<ApplicationProfile, "documents"> & { documents_snapshot: SubmittedDocument[]; required_documents: string[] }>(`
        SELECT a.documents_snapshot, j.required_documents, a.id, a.profile_snapshot->>'fullName' AS "applicantName",
          COALESCE(a.profile_snapshot->>'email', p.email) AS "applicantEmail",
          a.profile_snapshot->>'phone' AS mobile,
          a.profile_snapshot->>'location' AS address,
          (a.profile_snapshot->>'expectedSalary')::double precision AS "expectedSalary",
          a.profile_snapshot->>'availableFrom' AS "availableFrom",
          a.job_posting_id AS "jobPostingId", j.title AS "jobPostingTitle", j.location,
          a.created_at AS "appliedAt",
          CASE WHEN a.status = 'Received' THEN 'New' ELSE a.status END AS stage
        FROM public.applications a
        LEFT JOIN public.applicant_profiles p ON p.applicant_id = a.applicant_id
        JOIN public.job_postings j ON j.id = a.job_posting_id
        WHERE a.id = $1`, [id]);
      if (!rows[0]) throw new ApplicationError("not-found");
      const { documents_snapshot, required_documents, ...profile } = rows[0];
      return { ...profile, documents: [
        ...documents_snapshot.map((document): ApplicationDocument => ({ ...document, status: "Submitted",
          downloadUrl: `/api/applications/${id}/documents/${document.id}` })),
        ...required_documents.filter((required) => !documents_snapshot.some((document) => document.requiredFor === required))
          .map((requiredFor): ApplicationDocument => ({ requiredFor, status: "Requested" })),
      ] };
    },
    list: (filters: ApplicationFilters & { page?: number } = {}) => read(filters),
    async exportCsv({ jobPostingId, stage, search }: ApplicationFilters = {}): Promise<string> {
      const { rows } = await read({ jobPostingId, stage, search }, false);
      const records = [
        ["name", "email", "Job Posting", "location", "applied date", "Stage", "Next step"],
        ...rows.map((row) => [row.applicantName, row.applicantEmail, row.jobPostingTitle,
          row.location, row.appliedAt.toISOString(), row.stage, row.nextStep]),
      ];
      return records.map((record) => record.map((value) => /[",\r\n]/.test(value)
        ? `"${value.replaceAll('"', '""')}"` : value).join(",")).join("\r\n") + "\r\n";
    },
  };
}
