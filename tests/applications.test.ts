import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
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

it("returns Application identity, Job Posting and applied date through the authorised module", async () => {
  const id = await seed(1);
  expect(await applicationsFor(handle, db).list()).toEqual({
    rows: [{ id, applicantName: "Applicant 1", applicantEmail: "person1@example.test", jobPostingId: "posting-1",
      jobPostingTitle: "Cashier", location: "Manila", appliedAt: new Date("2026-10-01T08:00:00Z"), stage: "New", nextStep: "Review application" }],
    total: 1, page: 1, pageSize: 25,
  });
});

it("includes every Stage and Open, Closed and Filled Job Postings with fixed Next steps", async () => {
  const stages = ["Received", "Screening", "Interview", "Offer", "Hired", "Rejected", "Withdrawn"];
  for (const [index, stage] of stages.entries()) await seed(index, stage, ["open", "closed", "filled"][index % 3]);
  expect((await applicationsFor(handle, db).list()).rows.map(({ stage, nextStep }) => [stage, nextStep])).toEqual([
    ["Withdrawn", "Withdrawn by applicant"], ["Rejected", "In talent pool"], ["Hired", "Hired"],
    ["Offer", "Awaiting offer decision"], ["Interview", "Awaiting result"],
    ["Screening", "Schedule interview"], ["New", "Review application"],
  ]);
});

it("pages newest applied first with stable ties, a total and empty out-of-range pages", async () => {
  for (let i = 0; i < 27; i++) await seed(i, "Received", "closed", i === 0 ? "2026-10-02T08:00:00Z" : "2026-10-01T08:00:00Z");
  const applications = applicationsFor(handle, db);
  const first = await applications.list();
  expect(first).toMatchObject({ total: 27, page: 1, pageSize: 25 });
  expect(first.rows).toHaveLength(25);
  expect(first.rows.slice(0, 3).map((row) => row.applicantName)).toEqual(["Applicant 0", "Applicant 26", "Applicant 25"]);
  const second = await applications.list({ page: 2 });
  expect(second).toMatchObject({ total: 27, page: 2, pageSize: 25 });
  expect(second.rows.map((row) => row.applicantName)).toEqual(["Applicant 2", "Applicant 1"]);
  expect(await applications.list({ page: 3 })).toEqual({ rows: [], total: 27, page: 3, pageSize: 25 });
});

it("returns an empty first page when no Applications exist", async () => {
  expect(await applicationsFor(handle, db).list()).toEqual({ rows: [], total: 0, page: 1, pageSize: 25 });
});

it.each(["denied", "invalid", "unavailable"] as const)("fails closed on %s without touching the database", async (reason) => {
  await seed(1);
  const restrictedHandle = reason === "denied" ? portal.signIn(staff, ["Attendance"]) : reason === "invalid" ? undefined : handle;
  portal.unavailable = reason === "unavailable";
  // No database is reachable: an access decision must take precedence over a query failure.
  await db.close();
  await expect(applicationsFor(restrictedHandle, db).list()).rejects.toMatchObject({ reason });
});

it("rechecks access on repeated reads of the same module instance", async () => {
  const applications = applicationsFor(handle, db);
  await applications.list();
  portal.unavailable = true;
  await expect(applications.list()).rejects.toMatchObject({ reason: "unavailable" });
  portal.unavailable = false;
  portal.endSession(handle);
  await expect(applications.list()).rejects.toMatchObject({ reason: "invalid" });
});

it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER])("refuses invalid page %s", async (page) => {
  await expect(applicationsFor(handle, db).list({ page })).rejects.toMatchObject({ reason: "validation" });
});

it("can reapply the HRMS read projection without changing Careers Applications", async () => {
  await seed(1, "Withdrawn", "filled");
  const before = await applicationsFor(handle, db).list();
  await db.exec(await readFile(new URL("../migrations/0011-applications-list.sql", import.meta.url), "utf8"));
  expect(await applicationsFor(handle, db).list()).toEqual(before);
});
