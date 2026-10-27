import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { jobPostingsFor } from "@/lib/job-postings";
import { FAKE_PORTAL_URL, FAKE_SECRET, FAKE_SYSTEM, FakePortal, portalFetch } from "./fake-portal";

const ada = { name: "Ada Okafor", username: "ada", email: "ada@example.test", role: "HR Officer" };
let db: PGlite;
let portal: FakePortal;
let handle: string;

beforeEach(async () => {
  db = new PGlite();
  await db.exec(await readFile(new URL("./fixtures/careers-job-postings.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../migrations/0001-job-posting-drafts.sql", import.meta.url), "utf8"));
  portal = new FakePortal();
  handle = portal.signIn(ada, ["Recruitment and Hiring"]);
  vi.stubGlobal("fetch", portalFetch(portal));
  vi.stubEnv("PORTAL_URL", FAKE_PORTAL_URL);
  vi.stubEnv("PORTAL_SYSTEM_NAME", FAKE_SYSTEM);
  vi.stubEnv("PORTAL_SYSTEM_SECRET", FAKE_SECRET);
  vi.stubEnv("HRMS_DEV_BYPASS", "");
});
afterEach(async () => {
  await db.close();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("saves an empty Draft and reads it from another module instance", async () => {
  const posting = await jobPostingsFor(handle, db).saveDraft({});
  expect(posting).toMatchObject({ status: "draft", title: "", deadline: null, requiredDocuments: [], screeningCriteria: [] });
  expect(posting.id).toBeTruthy();
  expect(await jobPostingsFor(handle, db).read(posting.id)).toEqual(posting);
});

it("edits a Draft, preserving omitted fields and allowing fields to be cleared", async () => {
  const postings = jobPostingsFor(handle, db);
  const saved = await postings.saveDraft({ title: "HR Officer", department: "People", deadline: new Date("2030-01-01T00:00:00Z") });
  const edited = await postings.editDraft(saved.id, { title: "Recruiter", deadline: null, requiredDocuments: ["CV"] });
  expect(edited).toMatchObject({ title: "Recruiter", department: "People", deadline: null, requiredDocuments: ["CV"], status: "draft" });
  expect(await postings.read(saved.id)).toEqual(edited);
  expect(await postings.editDraft(saved.id, {})).toEqual(edited);
});

it("lists all Job Postings, filters by status and searches by title", async () => {
  const postings = jobPostingsFor(handle, db);
  const recruiter = await postings.saveDraft({ title: "Senior Recruiter", department: "People" });
  await postings.saveDraft({ title: "HR Officer" });
  expect(await postings.list()).toHaveLength(2);
  expect(await postings.list({ status: "open" })).toEqual([]);
  expect(await postings.list({ status: "draft", search: "RECRUIT" })).toEqual([recruiter]);
  expect(await postings.read("missing")).toBeUndefined();
});

it("deletes a Draft and refuses to edit or delete a missing Job Posting", async () => {
  const postings = jobPostingsFor(handle, db);
  const draft = await postings.saveDraft({});
  await postings.deleteDraft(draft.id);
  expect(await postings.read(draft.id)).toBeUndefined();
  expect(await postings.list()).toEqual([]);
  await expect(postings.deleteDraft(draft.id)).rejects.toMatchObject({ reason: "not-found" });
  await expect(postings.editDraft(draft.id, { title: "Gone" })).rejects.toMatchObject({ reason: "not-found" });
});

it.each(["open", "closed", "filled"] as const)("preserves an existing %s Job Posting and refuses Draft mutations", async (status) => {
  // External fixture: these postings predate HRMS; publishing is ticket #31.
  await db.query(`INSERT INTO job_postings
    (id,title,department,employment_type,location,description,requirements,required_documents,screening_criteria,deadline,status)
    VALUES ($1,'Existing role','People','Full time','Manila','Recruitment','', '[]','[]','2030-01-01',$2)`, [status, status]);
  const postings = jobPostingsFor(handle, db);
  const original = await postings.read(status);
  expect(await postings.list({ status })).toEqual([original]);
  await expect(postings.deleteDraft(status)).rejects.toMatchObject({ reason: "not-draft" });
  await expect(postings.editDraft(status, { title: "Changed" })).rejects.toMatchObject({ reason: "not-draft" });
  await expect(postings.editDraft(status, {})).rejects.toMatchObject({ reason: "not-draft" });
  expect(await postings.read(status)).toEqual(original);
});

it("refuses every operation without the Module, then allows them when granted", async () => {
  const allowed = jobPostingsFor(handle, db);
  const draft = await allowed.saveDraft({ title: "Original" });
  const denied = jobPostingsFor(portal.signIn(ada, ["Attendance"]), db);
  for (const operation of [
    () => denied.saveDraft({}), () => denied.read(draft.id), () => denied.list(),
    () => denied.editDraft(draft.id, { title: "Forbidden" }), () => denied.deleteDraft(draft.id),
  ]) {
    await expect(operation()).rejects.toMatchObject({ reason: "denied" });
  }
  expect(await allowed.list()).toEqual([draft]);
});

it("rechecks the Portal on each operation and fails closed for expired sessions and outages", async () => {
  const postings = jobPostingsFor(handle, db);
  const draft = await postings.saveDraft({ title: "Original" });
  portal.unavailable = true;
  await expect(postings.editDraft(draft.id, { title: "Forbidden" })).rejects.toMatchObject({ reason: "unavailable" });
  portal.unavailable = false;
  expect(await postings.read(draft.id)).toEqual(draft);
  portal.endSession(handle);
  for (const operation of [
    () => postings.saveDraft({}), () => postings.read(draft.id), () => postings.list(),
    () => postings.editDraft(draft.id, {}), () => postings.deleteDraft(draft.id),
  ]) {
    await expect(operation()).rejects.toMatchObject({ reason: "invalid" });
  }
  await expect(jobPostingsFor(undefined, db).list()).rejects.toMatchObject({ reason: "invalid" });
});

it("saves all fields and treats search text and caller-supplied status as data", async () => {
  const postings = jobPostingsFor(handle, db);
  const fields = {
    title: "100% Recruiter's _role", department: "People", employmentType: "Full time", location: "Manila",
    description: "Hire Staff", requirements: "Experience", requiredDocuments: ["CV", "ID"],
    screeningCriteria: ["Interview"], deadline: new Date("2030-01-01T00:00:00Z"),
  };
  const draft = await postings.saveDraft({ ...fields, ...JSON.parse('{"status":"open"}') });
  expect(draft).toMatchObject({ ...fields, status: "draft" });
  expect(await postings.list({ search: "%" })).toEqual([draft]);
  expect(await postings.list({ search: "' OR TRUE --" })).toEqual([]);
  expect(await postings.editDraft(draft.id, { title: "", ...JSON.parse('{"status":"open"}') }))
    .toMatchObject({ title: "", status: "draft" });
});

const publishable = {
  title: "Recruiter", department: "People", employmentType: "Full time", location: "Manila",
  description: "Hire Staff", deadline: new Date("2030-01-01T00:00:00Z"),
};

it("publishes a complete Draft into the shared Careers data and edits it immediately", async () => {
  const postings = jobPostingsFor(handle, db);
  const draft = await postings.saveDraft(publishable);
  expect(await postings.publish(draft.id)).toMatchObject({ status: "open", requirements: "" });
  expect(await postings.editOpen(draft.id, { title: "Senior Recruiter" })).toMatchObject({ title: "Senior Recruiter", status: "open" });
  expect(await jobPostingsFor(handle, db).read(draft.id)).toMatchObject({ title: "Senior Recruiter", status: "open" });
});

it("names every missing publish field and leaves the Draft intact", async () => {
  const postings = jobPostingsFor(handle, db);
  const draft = await postings.saveDraft({ title: " \t\n" });
  await expect(postings.publish(draft.id)).rejects.toMatchObject({ reason: "validation", fieldErrors: {
    title: expect.any(String), department: expect.any(String), employmentType: expect.any(String),
    location: expect.any(String), description: expect.any(String), deadline: expect.any(String),
  } });
  expect(await postings.read(draft.id)).toEqual(draft);
});

it.each([null, new Date("2000-01-01"), new Date()])("refuses publishing with deadline %s", async (deadline) => {
  const postings = jobPostingsFor(handle, db);
  const draft = await postings.saveDraft({ ...publishable, deadline });
  await expect(postings.publish(draft.id)).rejects.toMatchObject({ reason: "validation", fieldErrors: { deadline: expect.any(String) } });
  expect(await postings.read(draft.id)).toMatchObject({ status: "draft" });
});

it.each(["close", "markFilled"] as const)("allows %s only from Open and keeps final statuses final", async (operation) => {
  const postings = jobPostingsFor(handle, db);
  const draft = await postings.saveDraft(publishable);
  await expect(postings[operation](draft.id)).rejects.toMatchObject({ reason: "not-open" });
  await expect(postings.editOpen(draft.id, {})).rejects.toMatchObject({ reason: "not-open" });
  await postings.publish(draft.id);
  await expect(postings.publish(draft.id)).rejects.toMatchObject({ reason: "not-draft" });
  expect(await postings[operation](draft.id)).toMatchObject({ status: operation === "close" ? "closed" : "filled" });
  const final = await postings.read(draft.id);
  for (const action of [() => postings.publish(draft.id), () => postings.close(draft.id),
    () => postings.markFilled(draft.id), () => postings.editOpen(draft.id, { title: "Changed" }),
    () => postings.editDraft(draft.id, {}), () => postings.deleteDraft(draft.id)]) {
    await expect(action()).rejects.toBeDefined();
  }
  expect(await postings.read(draft.id)).toEqual(final);
});

it("refuses incomplete Open edits without changing shared data", async () => {
  const postings = jobPostingsFor(handle, db);
  const draft = await postings.saveDraft(publishable);
  const open = await postings.publish(draft.id);
  for (const fields of [{ title: " " }, { department: "" }, { employmentType: "" },
    { location: "" }, { description: "" }, { deadline: null }, { deadline: new Date("2000-01-01") },
    { deadline: new Date("invalid") }]) {
    await expect(postings.editOpen(draft.id, fields)).rejects.toMatchObject({ reason: "validation" });
    expect(await postings.read(draft.id)).toEqual(open);
  }
  expect(await postings.editOpen(draft.id, { requirements: "", requiredDocuments: [], screeningCriteria: [] }))
    .toMatchObject({ status: "open", requiredDocuments: [] });
});

it.each(["read", "list", "closeExpired"] as const)("moves expired Open postings to Closed on %s", async (operation) => {
  const postings = jobPostingsFor(handle, db);
  const draft = await postings.saveDraft(publishable);
  await postings.publish(draft.id);
  // Simulate time passing at the database boundary; no shared database is used.
  await db.query("UPDATE job_postings SET deadline = '2000-01-01' WHERE id = $1", [draft.id]);
  if (operation === "read") await postings.read(draft.id);
  else await postings[operation]();
  expect(await jobPostingsFor(handle, db).read(draft.id)).toMatchObject({ status: "closed" });
  expect(await postings.list({ status: "open" })).toEqual([]);
  await expect(postings.markFilled(draft.id)).rejects.toMatchObject({ reason: "not-open" });
});

it("refuses missing postings and rechecks access on every lifecycle operation", async () => {
  const postings = jobPostingsFor(handle, db);
  const draft = await postings.saveDraft(publishable);
  for (const id of ["missing", draft.id]) {
    for (const action of [() => postings.publish(id), () => postings.editOpen(id, {}),
      () => postings.close(id), () => postings.markFilled(id)]) {
      if (id === "missing") await expect(action()).rejects.toMatchObject({ reason: "not-found" });
    }
  }
  for (const state of ["denied", "unavailable", "invalid"] as const) {
    portal.unavailable = state === "unavailable";
    const restricted = jobPostingsFor(state === "denied" ? portal.signIn(ada, ["Attendance"]) : state === "invalid" ? undefined : handle, db);
    for (const action of [() => restricted.publish(draft.id), () => restricted.editOpen(draft.id, {}),
      () => restricted.close(draft.id), () => restricted.markFilled(draft.id), () => restricted.closeExpired()]) {
      await expect(action()).rejects.toMatchObject({ reason: state });
    }
  }
});
