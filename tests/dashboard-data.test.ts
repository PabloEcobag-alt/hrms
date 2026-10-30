import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { dashboardSummaryFor, openJobsSummary } from "@/lib/dashboard-data";

let db: PGlite;

beforeEach(async () => {
  db = new PGlite();
  await db.exec(await readFile(new URL("./fixtures/careers-job-postings.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../migrations/0001-job-posting-drafts.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../migrations/0002-job-templates.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../migrations/0006-job-openings.sql", import.meta.url), "utf8"));
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
  expect(await dashboardSummaryFor(["/dashboard", "/job-postings"], db)).toEqual({ openJobs: { count: 1, openings: 2, locations: 1 } });
});

it("does not read the database for Staff who do not hold Recruitment and Hiring", async () => {
  const unreachable = { query: () => Promise.reject(new Error("must not be queried")) };
  expect(await dashboardSummaryFor(["/dashboard", "/attendance"], unreachable)).toEqual({});
});
