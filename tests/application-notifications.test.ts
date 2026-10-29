import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { retryApplicationNotifications } from "@/lib/application-notifications";
import { applicationsFor } from "@/lib/applications";
import { FAKE_PORTAL_URL, FAKE_SECRET, FAKE_SYSTEM, FakePortal, portalFetch } from "./fake-portal";

let db: PGlite;
let portal: FakePortal;
let handle: string;
const staff = { name: "Ada Okafor", username: "ada", email: "ada@example.test", role: "HR Officer" };

beforeEach(async () => {
  db = new PGlite();
  await db.exec(await readFile(new URL("./fixtures/careers-job-postings.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("./fixtures/careers-applications.sql", import.meta.url), "utf8"));
  await db.exec(`CREATE TABLE applicant_profiles (applicant_id text PRIMARY KEY, full_name text NOT NULL, email text NOT NULL UNIQUE)`);
  const directory = new URL("../migrations/", import.meta.url);
  for (const name of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(name, directory), "utf8"));
  }
  await db.exec(`CREATE SCHEMA neon_auth; CREATE TABLE neon_auth."user" (id text PRIMARY KEY);`);
  portal = new FakePortal();
  handle = portal.signIn(staff, ["Recruitment and Hiring"]);
  vi.stubGlobal("fetch", portalFetch(portal));
  vi.stubEnv("PORTAL_URL", FAKE_PORTAL_URL);
  vi.stubEnv("PORTAL_SYSTEM_NAME", FAKE_SYSTEM);
  vi.stubEnv("PORTAL_SYSTEM_SECRET", FAKE_SECRET);
  vi.stubEnv("HRMS_DEV_BYPASS", "");
});

afterEach(async () => {
  if (!db.closed) await db.close();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function seed(index: number, status = "Received", postingStatus = "open", appliedAt = "2026-10-01T08:00:00Z") {
  await db.query(`INSERT INTO job_postings
    (id,title,department,description,requirements,employment_type,location,required_documents,screening_criteria,status)
    VALUES ($1,'Cashier','Retail','','','Full time','Manila','[]','[]',$2)`, [`posting-${index}`, postingStatus]);
  await db.query(`INSERT INTO applicant_profiles VALUES ($1,'Live profile name',$2)`, [`person-${index}`, `person${index}@example.test`]);
  return (await db.query<{ id: number }>(`INSERT INTO applications
    (applicant_id,job_posting_id,reference_number,status,profile_snapshot,documents_snapshot,consented_at,created_at)
    VALUES ($1,$2,$3,$4,$5::jsonb,'[]',$6,$6) RETURNING id`,
    [`person-${index}`, `posting-${index}`, `REF-${index}`, status, JSON.stringify({ fullName: `Applicant ${index}` }), appliedAt])).rows[0].id;
}

it("notifies each changed Stage except Screening, with fixed rejection wording and no email", async () => {
  const id = await seed(1);
  const rejected = await seed(2);
  await db.exec(`INSERT INTO neon_auth."user" VALUES ('person-1'), ('person-2')`);
  const sends: { key: string | null; body: Record<string, unknown> }[] = [];
  const boundary = portalFetch(portal);
  vi.stubEnv("API_GATEWAY_URL", "https://gateway.test");
  vi.stubEnv("API_GATEWAY_KEY", "key");
  vi.stubGlobal("fetch", async (input: string | URL | Request, init?: RequestInit) => {
    if (!String(input).startsWith("https://gateway.test")) return boundary(input, init);
    expect(String(input)).toBe("https://gateway.test/notifications/notifications");
    sends.push({ key: new Headers(init?.headers).get("idempotency-key"), body: JSON.parse(String(init?.body)) });
    return new Response(null, { status: 202 });
  });
  const applications = applicationsFor(handle, db);
  await applications.moveStage(id, "New", "Screening");
  await retryApplicationNotifications(db);
  expect(sends).toEqual([]);
  await applications.moveStage(id, "Screening", "Interview");
  await applications.moveStage(id, "Interview", "Offer");
  await applications.moveStage(id, "Offer", "Hired");
  await applications.moveStage(rejected, "New", "Rejected", "Private HR reason");
  expect(sends).toEqual([]);
  await retryApplicationNotifications(db);
  expect(sends).toHaveLength(4);
  expect(new Set(sends.map(s => s.key)).size).toBe(4);
  expect(sends.map(s => s.body.type).sort()).toEqual(["application.hired", "application.interview", "application.offer", "application.rejected"]);
  expect(sends.find(s => s.body.type === "application.rejected")?.body).toMatchObject({
    sendingApp: "hrms", targetApp: "careers", userIds: ["person-2"],
    body: "Thank you for your interest. Your Application was not selected.",
  });
  expect(JSON.stringify(sends)).not.toContain("Private HR reason");
  await retryApplicationNotifications(db);
  expect(sends).toHaveLength(4);
});

it("keeps Stage changes successful during gateway failure and retries the same payload after restart", async () => {
  const id = await seed(1, "Screening");
  await db.exec(`INSERT INTO neon_auth."user" VALUES ('person-1')`);
  const boundary = portalFetch(portal);
  const attempts: { key: string | null; body: string }[] = [];
  let fail = true;
  vi.stubEnv("API_GATEWAY_URL", "https://gateway.test");
  vi.stubEnv("API_GATEWAY_KEY", "key");
  vi.stubGlobal("fetch", async (input: string | URL | Request, init?: RequestInit) => {
    if (!String(input).startsWith("https://gateway.test")) return boundary(input, init);
    attempts.push({ key: new Headers(init?.headers).get("idempotency-key"), body: String(init?.body) });
    if (fail) throw new Error("Gateway offline");
    return new Response(null, { status: 202 });
  });
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    await applicationsFor(handle, db).moveStage(id, "Screening", "Interview");
    expect((await applicationsFor(handle, db).readProfile(id)).stage).toBe("Interview");
    await retryApplicationNotifications(db);
    expect(attempts).toHaveLength(1);
    await retryApplicationNotifications(db);
    expect(attempts).toHaveLength(1);
    await db.exec("UPDATE hrms_application_notifications SET next_attempt_at = '2000-01-01'");
    fail = false;
    await Promise.all([retryApplicationNotifications(db), retryApplicationNotifications(db)]);
    expect(attempts.length).toBeGreaterThan(1);
    expect(attempts.every(attempt => JSON.stringify(attempt) === JSON.stringify(attempts[0]))).toBe(true);
    const count = attempts.length;
    await retryApplicationNotifications(db);
    expect(attempts).toHaveLength(count);
  } finally { log.mockRestore(); }
});

it("skips HR-added Applicants without a Careers account and rejects stale actions", async () => {
  const id = await seed(1, "Screening");
  const boundary = portalFetch(portal);
  const gateway = vi.fn();
  vi.stubEnv("API_GATEWAY_URL", "https://gateway.test");
  vi.stubEnv("API_GATEWAY_KEY", "key");
  vi.stubGlobal("fetch", (input: string | URL | Request, init?: RequestInit) => {
    if (String(input).startsWith("https://gateway.test")) return gateway(input, init);
    return boundary(input, init);
  });
  await applicationsFor(handle, db).moveStage(id, "Screening", "Interview");
  await expect(applicationsFor(handle, db).moveStage(id, "Screening", "Rejected")).rejects.toMatchObject({ reason: "conflict" });
  await retryApplicationNotifications(db);
  expect(gateway).not.toHaveBeenCalled();
});
