import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { jobPostingsFor, retryJobPostingAnnouncements } from "@/lib/job-postings";
import { FAKE_PORTAL_URL, FAKE_SECRET, FAKE_SYSTEM, FakePortal, portalFetch } from "./fake-portal";

let db: PGlite;
let handle: string;
let sends: { path: string; body: Record<string, unknown>; key: string | null }[];
let fail = false;
beforeEach(async () => {
  db = new PGlite();
  await db.exec(await readFile(new URL("./fixtures/careers-job-postings.sql", import.meta.url), "utf8"));
  for (const name of ["0001-job-posting-drafts", "0002-job-templates", "0003-job-posting-audit", "0004-job-posting-announcements", "0005-job-posting-first-published", "0006-job-openings"]) {
    await db.exec(await readFile(new URL(`../migrations/${name}.sql`, import.meta.url), "utf8"));
  }
  await db.exec(`CREATE SCHEMA neon_auth;
    CREATE TABLE neon_auth."user" (id text PRIMARY KEY, email text, "emailVerified" boolean);
    CREATE TABLE applicant_profiles (applicant_id text PRIMARY KEY, job_alerts_opt_in boolean NOT NULL DEFAULT false);
    INSERT INTO neon_auth."user" VALUES ('yes','yes@example.test',true), ('no','no@example.test',true),
      ('unverified','unverified@example.test',false), ('no-profile','missing@example.test',false);
    INSERT INTO applicant_profiles VALUES ('yes',true), ('no',false), ('unverified',true);`);
  const portal = new FakePortal();
  handle = portal.signIn({ name: "Ada", username: "ada", email: "ada@example.test", role: "HR Officer" }, ["Recruitment and Hiring"]);
  const boundary = portalFetch(portal);
  sends = [];
  fail = false;
  vi.stubEnv("PORTAL_URL", FAKE_PORTAL_URL);
  vi.stubEnv("PORTAL_SYSTEM_NAME", FAKE_SYSTEM);
  vi.stubEnv("PORTAL_SYSTEM_SECRET", FAKE_SECRET);
  vi.stubEnv("HRMS_DEV_BYPASS", "");
  vi.stubEnv("API_GATEWAY_URL", "https://gateway.test");
  vi.stubEnv("API_GATEWAY_KEY", "hrms-key");
  vi.stubEnv("CAREERS_URL", "https://careers.test");
  vi.stubGlobal("fetch", async (input: string | URL | Request, init?: RequestInit) => {
    if (!String(input).startsWith("https://gateway.test")) return boundary(input, init);
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer hrms-key");
    sends.push({ path: new URL(String(input)).pathname, body: JSON.parse(String(init?.body)), key: new Headers(init?.headers).get("idempotency-key") });
    return Response.json({}, { status: fail ? 503 : 202 });
  });
});
afterEach(async () => { await db.close(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("announces only the first publish to every registered Applicant and emails only Verified opt-ins", async () => {
  const postings = jobPostingsFor(handle, db);
  const draft = await postings.saveDraft({ title: "Recruiter", department: "People", employmentType: "Full time", location: "Manila", description: "Hire Staff", deadline: new Date("2030-01-01") });
  await postings.publish(draft.id);
  await retryJobPostingAnnouncements(db);
  const emails = sends.filter(s => s.path === "/notifications/emails/app");
  expect(emails.map(s => s.body.to)).toEqual(["yes@example.test"]);
  expect(emails[0].body).toMatchObject({ app: "careers", button: { link: `https://careers.test/careers/${draft.id}` } });
  const inbox = sends.filter(s => s.path === "/notifications/notifications");
  expect(inbox.flatMap(s => s.body.userIds).sort()).toEqual(["no", "no-profile", "unverified", "yes"]);
  expect(inbox[0].body).toMatchObject({ sendingApp: "hrms", targetApp: "careers", type: "job-posting.opened", link: `https://careers.test/careers/${draft.id}`, idempotencyKey: expect.any(String) });
  expect(sends.find(s => s.body.action === "job_posting.published")?.body.metadata).toEqual({ applicants_notified: true });
  expect((await db.query("SELECT announced_at FROM job_postings WHERE id=$1", [draft.id])).rows[0]).toMatchObject({ announced_at: expect.any(Date) });
  const count = sends.filter(s => s.path.startsWith("/notifications")).length;
  await expect(postings.publish(draft.id)).rejects.toMatchObject({ reason: "not-draft" });
  await postings.editOpen(draft.id, { title: "Senior Recruiter" });
  await postings.close(draft.id);
  await retryJobPostingAnnouncements(db);
  expect(sends.filter(s => s.path.startsWith("/notifications"))).toHaveLength(count);
});

it("publishes during gateway failure, retries stable payloads after restart and completes the original audit once", async () => {
  const postings = jobPostingsFor(handle, db);
  const draft = await postings.saveDraft({ title: "Recruiter", department: "People", employmentType: "Full time", location: "Manila", description: "Hire Staff", deadline: new Date("2030-01-01") });
  sends = [];
  fail = true;
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    expect(await postings.publish(draft.id)).toMatchObject({ status: "open" });
    expect(sends).toEqual([]); // No gateway I/O on publish.
    await retryJobPostingAnnouncements(db);
    const attempts = [...sends];
    expect(attempts).toHaveLength(5);
    expect((await db.query("SELECT announced_at FROM job_postings WHERE id=$1", [draft.id])).rows[0]).toEqual({ announced_at: null });
    expect(sends.some(s => s.body.action === "job_posting.published")).toBe(false);
    // New registrations never expand an already snapshotted audience.
    await db.exec(`INSERT INTO neon_auth."user" VALUES ('later','later@example.test',true);
      UPDATE hrms_announcement_deliveries SET next_attempt_at = '2000-01-01';`);
    fail = false;
    sends = [];
    await Promise.all([retryJobPostingAnnouncements(db), retryJobPostingAnnouncements(db)]);
    for (const attempt of attempts) {
      expect(attempt.key).toBeTruthy();
      expect(sends).toContainEqual(attempt);
    }
    expect(sends.filter(s => s.path.startsWith('/notifications')).every(s => attempts.some(a => a.key === s.key && JSON.stringify(a.body) === JSON.stringify(s.body)))).toBe(true);
    const audits = sends.filter(s => s.body.action === "job_posting.published");
    expect(audits.length).toBeGreaterThanOrEqual(1);
    expect(new Set(audits.map(s => s.body.idempotency_key)).size).toBe(1);
    expect(audits[0].body.metadata).toEqual({ applicants_notified: true });
    sends = [];
    await retryJobPostingAnnouncements(db);
    expect(sends).toEqual([]);
  } finally { log.mockRestore(); }
});

it("does not announce historical Open postings or mark a failed audience lookup complete", async () => {
  await db.exec(`INSERT INTO job_postings (id,title,department,employment_type,location,description,requirements,required_documents,screening_criteria,deadline,status)
    VALUES ('historical','Existing','People','Full time','Manila','Hire','','[]','[]','2030-01-01','open')`);
  await retryJobPostingAnnouncements(db);
  expect(sends).toEqual([]);
  const postings = jobPostingsFor(handle, db);
  const draft = await postings.saveDraft({ title: "Recruiter", department: "People", employmentType: "Full time", location: "Manila", description: "Hire Staff", deadline: new Date("2030-01-01") });
  await postings.publish(draft.id);
  await db.exec('ALTER TABLE neon_auth."user" RENAME TO unavailable');
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try { await retryJobPostingAnnouncements(db); } finally { log.mockRestore(); }
  expect((await db.query("SELECT announced_at FROM job_postings WHERE id=$1", [draft.id])).rows[0]).toEqual({ announced_at: null });
  await db.exec('ALTER TABLE neon_auth.unavailable RENAME TO "user"');
  await retryJobPostingAnnouncements(db);
  expect(sends.filter(s => s.path === "/notifications/notifications")).toHaveLength(4);
});

it("keeps announcing later postings when twenty earlier announcements cannot complete", async () => {
  const postings = jobPostingsFor(handle, db);
  const fields = { title: "Recruiter", department: "People", employmentType: "Full time", location: "Manila", description: "Hire Staff", deadline: new Date("2030-01-01") };
  for (let i = 0; i < 20; i++) {
    const draft = await postings.saveDraft(fields);
    await postings.publish(draft.id);
  }
  fail = true;
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    // All earlier audiences exist, but none of their deliveries can finish.
    await retryJobPostingAnnouncements(db);
    await retryJobPostingAnnouncements(db);
    const later = await postings.saveDraft({ ...fields, title: "New opening" });
    await postings.publish(later.id);
    sends = [];
    fail = false;
    await retryJobPostingAnnouncements(db);
    expect(sends.filter(s => s.body.title === "New Job Posting: New opening")).toHaveLength(5);
  } finally { log.mockRestore(); }
});
