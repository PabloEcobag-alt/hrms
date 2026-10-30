import { readdir, readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { dashboardRange } from "@/lib/dashboard";
import { applicantsSummary, dashboardSummaryFor, openJobsSummary } from "@/lib/dashboard-data";

const RANGE = dashboardRange("this-month", new Date("2026-10-28T12:05:00Z"));

let db: PGlite;

beforeEach(async () => {
  db = new PGlite();
  await db.exec(await readFile(new URL("./fixtures/careers-job-postings.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("./fixtures/careers-applications.sql", import.meta.url), "utf8"));
  await db.exec("CREATE TABLE applicant_profiles (applicant_id text PRIMARY KEY, full_name text NOT NULL, email text NOT NULL UNIQUE)");
  const directory = new URL("../migrations/", import.meta.url);
  for (const name of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(name, directory), "utf8"));
  }
  await db.exec('CREATE SCHEMA neon_auth; CREATE TABLE neon_auth."user" (id text PRIMARY KEY);');
});

afterEach(() => db.close());

async function post(id: string, status: string, location: string, openings: number | null) {
  await db.query(
    `INSERT INTO job_postings (id, title, department, description, requirements, employment_type, location, deadline, required_documents, screening_criteria, status, openings)
     VALUES ($1, $1, 'People', 'd', 'r', 'Full-time', $2, '2030-01-01T00:00:00Z', '[]', '[]', $3, $4)`,
    [id, location, status, openings],
  );
}

it("counts only Open Job Postings, with their openings and distinct locations", async () => {
  await post("a", "open", "Antipolo", 2);
  await post("b", "open", "Antipolo", 5);
  await post("c", "open", "Cainta", 1);
  await post("d", "draft", "Manila", 9);
  await post("e", "closed", "Manila", 9);
  await post("f", "filled", "Pasig", 9);
  expect(await openJobsSummary(db)).toEqual({ count: 3, openings: 8, locations: 2 });
});

it("adds no openings for a posting that does not say how many", async () => {
  await post("a", "open", "Antipolo", null);
  await post("b", "open", "Cainta", 4);
  expect(await openJobsSummary(db)).toEqual({ count: 2, openings: 4, locations: 2 });
});

it("is all zero when no Job Posting is Open", async () => {
  await post("a", "draft", "Antipolo", 3);
  expect(await openJobsSummary(db)).toEqual({ count: 0, openings: 0, locations: 0 });
});

it("fills the summary with Open jobs for Staff who hold Recruitment and Hiring", async () => {
  await post("a", "open", "Antipolo", 2);
  expect(await dashboardSummaryFor(["/dashboard", "/job-postings"], RANGE, db)).toEqual({
    openJobs: { count: 1, openings: 2, locations: 1 },
    applicants: { current: 0, previous: 0 },
  });
});

it("does not read the database for Staff who do not hold Recruitment and Hiring", async () => {
  const unreachable = { query: () => Promise.reject(new Error("must not be queried")) };
  expect(await dashboardSummaryFor(["/dashboard", "/attendance"], RANGE, unreachable)).toEqual({});
});

let received = 0;
async function receive(appliedAt: string, status = "Received") {
  received += 1;
  await db.query("INSERT INTO applicant_profiles VALUES ($1, 'Someone', $2)", [`p${received}`, `p${received}@example.test`]);
  await db.query(
    `INSERT INTO applications (applicant_id, job_posting_id, reference_number, status, profile_snapshot, documents_snapshot, consented_at, created_at)
     VALUES ($1, 'a', $1, $2, '{"fullName":"Someone"}', '[]', $3, $3)`,
    [`p${received}`, status, appliedAt],
  );
}

async function addByHr(appliedAt: string) {
  received += 1;
  await db.query(
    `INSERT INTO hrms_manual_applications (full_name, email, mobile, address, job_posting_id, expected_salary, available_from, added_by_name, applied_at)
     VALUES ('Walk-in', $1, '0917', 'Antipolo', 'a', 1000, '2026-11-01', 'Ada', $2)`,
    [`w${received}@example.test`, appliedAt],
  );
}

it("counts Applications received in the range and in the Previous period, on Manila days", async () => {
  await post("a", "open", "Antipolo", 1);
  await receive("2026-09-30T16:00:00Z"); // 1 Oct 00:00 Manila: first moment of the range
  await receive("2026-10-28T15:59:00Z"); // 28 Oct 23:59 Manila: last moment
  await receive("2026-10-28T16:00:00Z"); // 29 Oct Manila: after the range
  await receive("2026-09-28T15:59:00Z"); // 28 Sep 23:59 Manila: last moment of the Previous period
  await receive("2026-08-31T16:00:00Z"); // 1 Sep 00:00 Manila: first moment of the Previous period
  await receive("2026-08-31T15:59:00Z"); // 31 Aug Manila: before it
  await receive("2026-09-28T16:00:00Z"); // 29 Sep Manila: past the Previous period's 28 Sep end
  expect(await applicantsSummary(RANGE, db)).toEqual({ current: 2, previous: 2 });
});

it("counts HR-added, rejected and withdrawn Applications too", async () => {
  await post("a", "open", "Antipolo", 1);
  await receive("2026-10-05T08:00:00Z");
  await receive("2026-10-06T08:00:00Z", "Rejected");
  await receive("2026-10-07T08:00:00Z", "Withdrawn");
  await addByHr("2026-10-08T08:00:00Z");
  expect(await applicantsSummary(RANGE, db)).toEqual({ current: 4, previous: 0 });
});
