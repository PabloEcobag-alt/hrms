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
  expect(await applicationsFor(handle, db).list()).toMatchObject({
    rows: [{ id, applicantName: "Applicant 1", applicantEmail: "person1@example.test", jobPostingId: "posting-1",
      jobPostingTitle: "Cashier", location: "Manila", appliedAt: new Date("2026-10-01T08:00:00Z"), stage: "New", nextStep: "Review application" }],
    total: 1, page: 1, pageSize: 25, stageCounts: { All: 1, New: 1, Screening: 0, Interview: 0, Offer: 0, Hired: 0, Rejected: 0 },
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
  expect(await applications.list({ page: 3 })).toMatchObject({ rows: [], total: 27, page: 3, pageSize: 25 });
});

it("returns an empty first page when no Applications exist", async () => {
  expect(await applicationsFor(handle, db).list()).toEqual({ rows: [], total: 0, page: 1, pageSize: 25, newThisWeek: 0, jobPostingOptions: [],
    stageCounts: { All: 0, New: 0, Screening: 0, Interview: 0, Offer: 0, Hired: 0, Rejected: 0 } });
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

it("filters by Stage while All retains Withdrawn Applications", async () => {
  await seed(1, "Received");
  await seed(2, "Screening");
  await seed(3, "Withdrawn");
  const applications = applicationsFor(handle, db);
  expect((await applications.list({ stage: "New" })).rows.map((row) => row.stage)).toEqual(["New"]);
  expect((await applications.list({ stage: "Screening" })).total).toBe(1);
  expect((await applications.list({ stage: "All" })).total).toBe(3);
});

it("combines literal case-insensitive name/email search with Stage and paging", async () => {
  for (let i = 0; i < 27; i++) await seed(i);
  await seed(27, "Withdrawn");
  const applications = applicationsFor(handle, db);
  const page = await applications.list({ stage: "New", search: "APPLICANT", page: 2 });
  expect(page.total).toBe(27);
  expect(page.rows.map((row) => row.applicantName)).toEqual(["Applicant 1", "Applicant 0"]);
  expect((await applications.list({ search: "SON2@EXAMPLE" })).rows.map((row) => row.applicantName)).toEqual(["Applicant 2"]);
  expect((await applications.list({ search: "%" })).total).toBe(0);
  expect((await applications.list({ search: "_" })).total).toBe(0);
  expect((await applications.list({ search: "' OR true --" })).total).toBe(0);
});

it("returns search-scoped tab counts independent of the Stage and page", async () => {
  await seed(1, "Received");
  await seed(10, "Screening");
  await seed(11, "Withdrawn");
  await seed(12, "Rejected");
  await seed(2, "Hired");
  const result = await applicationsFor(handle, db).list({ search: "Applicant 1", stage: "New", page: 2 });
  expect(result).toMatchObject({ rows: [], total: 1, stageCounts: {
    All: 4, New: 1, Screening: 1, Interview: 0, Offer: 0, Hired: 0, Rejected: 1,
  } });
  expect((await applicationsFor(handle, db).list({ search: "absent" })).stageCounts).toEqual({
    All: 0, New: 0, Screening: 0, Interview: 0, Offer: 0, Hired: 0, Rejected: 0,
  });
});

it("counts Applications applied in the last seven days across Stages and search", async () => {
  // A transaction fixes the database clock so the exact seven-day boundary is testable.
  await db.exec("BEGIN");
  const { rows: [{ now }] } = await db.query<{ now: Date }>("SELECT CURRENT_TIMESTAMP AS now");
  const cutoff = new Date(now).getTime() - 7 * 24 * 60 * 60 * 1000;
  await seed(1, "Received", "open", new Date(cutoff).toISOString());
  await seed(2, "Withdrawn", "closed", new Date(now).toISOString());
  await seed(3, "Hired", "filled", new Date(cutoff - 1).toISOString());
  await seed(4, "Offer", "open", new Date(new Date(now).getTime() + 1).toISOString());
  expect((await applicationsFor(handle, db).list({ stage: "New", search: "Applicant 1", page: 2 })).newThisWeek).toBe(2);
  await db.exec("COMMIT");
});

it.each([
  { stage: "Withdrawn" }, { stage: "Received" }, { stage: "unknown" }, { stage: null },
  { search: 42 }, { search: null },
  { jobPostingId: 42 }, { jobPostingId: null }, { jobPostingId: "" }, { jobPostingId: "   " },
])("refuses invalid list filters %j", async (filters) => {
  // Exercise runtime validation for values received from untyped request parameters.
  // @ts-expect-error intentionally invalid boundary input
  await expect(applicationsFor(handle, db).list(filters)).rejects.toMatchObject({ reason: "validation" });
});

it("combines Job Posting, Stage, search and paging with Job Posting-scoped tab counts", async () => {
  for (let i = 0; i < 29; i++) await seed(i, i === 28 ? "Screening" : i === 27 ? "Withdrawn" : "Received");
  await db.query("UPDATE applications SET job_posting_id = 'posting-0' WHERE id > 1");
  await seed(30);
  const applications = applicationsFor(handle, db);
  const result = await applications.list({ jobPostingId: "posting-0", stage: "New", search: "APPLICANT", page: 2 });
  expect(result).toMatchObject({ total: 27, stageCounts: { All: 29, New: 27, Screening: 1 } });
  expect(result.rows.map((row) => row.applicantName)).toEqual(["Applicant 1", "Applicant 0"]);
  expect((await applications.list({ jobPostingId: "missing" })).total).toBe(0);
});

it("offers only Open Job Postings with every Application counted independently of list filters", async () => {
  await seed(1);
  await seed(2, "Withdrawn");
  await seed(3, "Rejected");
  await db.query("UPDATE applications SET job_posting_id = 'posting-1' WHERE id > 1");
  await seed(4, "Received", "draft");
  await seed(5, "Hired", "filled");
  await seed(6, "Screening", "closed");
  expect((await applicationsFor(handle, db).list({ jobPostingId: "posting-5", stage: "New", search: "absent", page: 2 })).jobPostingOptions).toEqual([
    { id: "posting-1", title: "Cashier", applicationCount: 3 },
    { id: "posting-2", title: "Cashier", applicationCount: 0 },
    { id: "posting-3", title: "Cashier", applicationCount: 0 },
  ]);
  expect((await applicationsFor(handle, db).list()).total).toBe(6);
  expect((await applicationsFor(handle, db).list({ jobPostingId: "posting-5" })).rows.map((row) => row.stage)).toEqual(["Hired"]);
});
