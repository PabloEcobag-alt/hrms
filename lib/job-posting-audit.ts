import { randomUUID } from "node:crypto";
import type { PostingDatabase } from "./job-postings";
import type { Staff } from "./portal/client";

type AuditAction = "job_posting.created" | "job_posting.updated" | "job_posting.published"
  | "job_posting.closed" | "job_posting.filled" | "job_template.created"
  | "job_template.updated" | "job_template.deleted";

/** The mutation and its delivery record commit together in one SQL statement. */
export async function auditedMutation<T>(db: PostingDatabase, staff: Staff, action: AuditAction, sql: string, values: unknown[]) {
  const id = randomUUID();
  const type = action.split(".")[0];
  const event = {
    source: "HRMS", module: "Recruitment and Hiring", action, outcome: "success",
    actor: { type: "staff", id: staff.username, display_name: staff.name },
    customer_description: null, occurred_at: new Date().toISOString(), idempotency_key: id,
    description: `${staff.name} performed ${action}.`,
  };
  const result = await db.query<T>(`WITH changed AS (${sql}), queued AS (
    INSERT INTO public.hrms_audit_outbox (id, payload)
    SELECT $${values.length + 1}, $${values.length + 2}::jsonb || jsonb_build_object(
      'target', jsonb_build_object('type', $${values.length + 3}::text, 'id', id,
        'display_name', COALESCE(NULLIF(title, ''), id))) FROM changed
  ) SELECT * FROM changed`, [...values, id, JSON.stringify(event), type]);
  // Delivery failure is isolated from the already committed Staff action.
  if (result.rows.length) await retryJobPostingAudit(db, id);
  return result;
}

/** A durable retry boundary, also run by the authenticated maintenance route. */
export async function retryJobPostingAudit(db: PostingDatabase, eventId?: string): Promise<void> {
  try {
    const { rows } = await db.query<{ id: string; payload: unknown }>(
      `SELECT id, payload FROM public.hrms_audit_outbox
       WHERE ($1::text IS NULL OR id = $1) AND next_attempt_at <= clock_timestamp()
       ORDER BY next_attempt_at, id LIMIT 50`, [eventId ?? null]);
    for (const row of rows) {
      try {
        const url = process.env.API_GATEWAY_URL;
        const key = process.env.API_GATEWAY_KEY;
        if (!url || !key) throw new Error("Gateway configuration missing");
        const response = await fetch(`${url.replace(/\/$/, "")}/audit/events`, {
          method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
          body: JSON.stringify(row.payload), cache: "no-store", signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error("Audit gateway rejected event");
        await db.query("DELETE FROM public.hrms_audit_outbox WHERE id = $1", [row.id]);
      } catch {
        console.error("Job Posting audit delivery failed; retained for retry", { eventId: row.id });
        await db.query(`UPDATE public.hrms_audit_outbox SET attempts = attempts + 1,
          next_attempt_at = clock_timestamp() + interval '1 minute' * LEAST(60, attempts + 1)
          WHERE id = $1`, [row.id]);
      }
    }
  } catch {
    console.error("Job Posting audit retry unavailable; delivery records retained");
  }
}
