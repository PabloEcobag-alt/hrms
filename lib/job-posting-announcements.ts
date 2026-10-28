import type { PostingDatabase } from "./job-postings";

/** Snapshot the audience once; retries keep the original payload and recipient keys. */
export async function deliverAnnouncements(db: PostingDatabase): Promise<void> {
  try {
    const base = new URL(process.env.CAREERS_URL ?? "");
    if (base.protocol !== "https:") throw new Error("CAREERS_URL must use HTTPS");
    const pending = await db.query<{ posting_id: string; title: string }>(
      `SELECT posting_id, title FROM public.hrms_posting_announcements
       WHERE completed_at IS NULL AND NOT audience_ready ORDER BY posting_id LIMIT 20`);
    for (const announcement of pending.rows) {
      const link = new URL(`/careers/${encodeURIComponent(announcement.posting_id)}`, base).href;
      const title = `New Job Posting: ${announcement.title}`;
      const body = `Applications are now open for ${announcement.title}. View the Job Posting to apply.`;
      await db.query(`WITH claimed AS (
        UPDATE public.hrms_posting_announcements SET audience_ready = true
        WHERE posting_id = $1 AND audience_ready = false RETURNING posting_id
      ), audience AS (
        SELECT u.id, u.email, u."emailVerified" AND COALESCE(p.job_alerts_opt_in, false) AS email_eligible
        FROM neon_auth."user" u LEFT JOIN public.applicant_profiles p ON p.applicant_id = u.id
      ) INSERT INTO public.hrms_announcement_deliveries (id, posting_id, path, payload)
      SELECT 'job-posting.opened:' || c.posting_id || ':in-app:' || a.id, c.posting_id,
        '/notifications/notifications', jsonb_build_object(
          'sendingApp', 'hrms', 'targetApp', 'careers', 'userIds', jsonb_build_array(a.id),
          'type', 'job-posting.opened', 'title', $2::text, 'body', $3::text, 'link', $4::text,
          'idempotencyKey', 'job-posting.opened:' || c.posting_id)
      FROM claimed c CROSS JOIN audience a
      UNION ALL
      SELECT 'job-posting.opened:' || c.posting_id || ':email:' || a.id, c.posting_id,
        '/notifications/emails/app', jsonb_build_object('to', a.email, 'app', 'careers',
          'title', $2::text, 'body', $3::text,
          'button', jsonb_build_object('label', 'View Job Posting', 'link', $4::text))
      FROM claimed c CROSS JOIN audience a WHERE a.email_eligible`, [announcement.posting_id, title, body, link]);
    }
    // Bounded work per maintenance request. Concurrent workers use identical gateway keys.
    const { rows } = await db.query<{ id: string; path: string; payload: unknown }>(
      `SELECT id, path, payload FROM public.hrms_announcement_deliveries
       WHERE delivered_at IS NULL AND next_attempt_at <= clock_timestamp()
       ORDER BY next_attempt_at, id LIMIT 50`);
    for (const row of rows) {
      try {
        const url = process.env.API_GATEWAY_URL;
        const key = process.env.API_GATEWAY_KEY;
        if (!url || !key) throw new Error("Gateway configuration missing");
        const response = await fetch(`${url.replace(/\/$/, "")}${row.path}`, {
          method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json", "idempotency-key": row.id },
          body: JSON.stringify(row.payload), cache: "no-store", signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) throw new Error("Announcement rejected");
        await db.query(`UPDATE public.hrms_announcement_deliveries SET delivered_at = clock_timestamp() WHERE id = $1`, [row.id]);
      } catch {
        console.error("Job Posting announcement failed; retained for retry", { deliveryId: row.id });
        await db.query(`UPDATE public.hrms_announcement_deliveries SET attempts = attempts + 1,
          next_attempt_at = clock_timestamp() + interval '1 minute' * LEAST(60, attempts + 1) WHERE id = $1`, [row.id]);
      }
    }
    await db.query(`WITH completed AS (
      UPDATE public.hrms_posting_announcements a SET completed_at = clock_timestamp()
      WHERE completed_at IS NULL AND audience_ready AND NOT EXISTS (
        SELECT 1 FROM public.hrms_announcement_deliveries d WHERE d.posting_id = a.posting_id AND d.delivered_at IS NULL
      ) RETURNING posting_id, audit_id, completed_at
    ), marked AS (
      UPDATE public.job_postings p SET announced_at = c.completed_at FROM completed c WHERE p.id = c.posting_id
    ) UPDATE public.hrms_audit_outbox o SET payload = jsonb_set(payload, '{metadata,applicants_notified}', 'true')
      FROM completed c WHERE o.id = c.audit_id`);
  } catch {
    console.error("Job Posting announcement retry unavailable; work retained");
  }
}
