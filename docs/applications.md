# Applications list

`applicationsFor(sessionHandle, db).list({ page, stage, search, jobPostingId })` is the server-side boundary
for the Applicants list. Every call rechecks the Recruitment and Hiring Module
through the Portal before querying; invalid, denied and unavailable decisions
throw `ApplicationError` with the corresponding reason.

The result contains `rows`, `total`, `page` (one-based, default 1), and
`pageSize` (25), `stageCounts`, `jobPostingOptions`, and `newThisWeek`. Invalid page numbers or filters
throw `ApplicationError("validation")`.

`stage` defaults to `All`, which includes Withdrawn. The selectable Stages are
`New`, `Screening`, `Interview`, `Offer`, `Hired`, and `Rejected`; there is no
Withdrawn tab. `search` defaults to an empty string and matches a literal,
case-insensitive substring of the Applicant's name or email (including literal
`%` and `_` characters). Stage, search, Job Posting and paging combine for `rows` and `total`.

`jobPostingId` optionally limits the list to one Job Posting, including a Closed
or Filled one. Omit it to include all Job Postings. Empty or non-string ids are
invalid; unknown ids return an empty list and zero tab counts.
`jobPostingOptions` contains Open Job Postings only, ordered by title then id.
Each option has `id`, `title`, and `applicationCount`, counting every Application
for that Job Posting regardless of Stage (including Withdrawn), search, selected
Job Posting or page. Open Job Postings with no Applications have a zero count.

`stageCounts` contains `All` and each selectable Stage, including zero counts.
These counts follow search and the Job Posting filter and ignore the selected Stage and page; `All` includes
Withdrawn. `newThisWeek` is the overall number of Applications applied from seven
days ago through now, inclusive, using the database clock. It ignores Stage,
search, Job Posting and paging and excludes future applied dates. All figures and rows come
from one database statement so they share a snapshot.
Rows are ordered by applied date descending, then Application id descending to
keep equal dates stable. Empty and out-of-range pages retain the total.

Migration `0011-applications-list.sql` creates the HRMS-owned
`hrms_careers_applications` read view. It reads the Application's profile snapshot
name, Applicant profile email, and Job Posting title and location. It includes
all posting statuses and Withdrawn Applications and maps stored `Received` to
`New`. It changes no Careers table or record. Run it through `npm run db:migrate`
with the existing direct database connection before using the module.

Next step labels are fixed per Stage except Interview, which shows
`Interview · Nov 3, 2026, 9:00 AM` for the next upcoming interview without a result,
using Manila time and the database clock. Without one it reads `Awaiting result`.
CSV exports use the same labels and include every matching row.

## Application documents

`readProfile(id).documents` returns submitted documents from `documents_snapshot`
with `id`, `name`, `size` (bytes), `contentType`, `requiredFor`, `status: "Submitted"`
and an HRMS `downloadUrl`. Each Job Posting Required Document with no matching
snapshot `requiredFor` is included as `{ requiredFor, status: "Requested" }`.
Requested is a display status only; nothing is written or sent to the Applicant.

`downloadDocument(applicationId, documentId)` returns an attachment Response.
Every download rechecks the Recruitment and Hiring Module, verifies membership
in that Application's snapshot and ownership in Careers' `applicant_documents`,
and streams from the existing private Blob store. No storage path or reusable
Blob URL is exposed. The HTTP endpoint is
`GET /api/applications/:id/documents/:documentId`; responses disable browser caching.
The snapshot supplies the filename even if live document metadata changes.
Missing Applications, unsubmitted documents, wrong-owner documents and missing
files return not-found. Storage failures return unavailable.

HRMS must have access to the **same private Blob store as Careers**, via its
Vercel store connection or `BLOB_READ_WRITE_TOKEN`. No database migration is needed.

## Scheduling interviews

`applicationsFor(sessionHandle, db).scheduleInterview(id, fromStage, input)`
accepts the Stage Staff reviewed and `{ startsAt, endsAt, type, interviewerName,
location }`. Timestamps must include a timezone, end after start, and type must
be `Online` or `In person`. Interviewer name and location are required typed text.
Only Screening and Interview accept scheduling. A stale Stage returns `conflict`;
a missing Application returns `not-found`. Every call rechecks Module access.

Scheduling from Screening uses the same guarded status write as `moveStage` to
reach Interview. Scheduling from Interview adds another interview without changing
the recorded Stage history. The interview, optional Stage history, and activity with the
acting Staff name commit atomically. `readProfile` returns `interviews` ordered by
start time descending then id descending, and scheduling activity includes `interviewId`.
Each interview includes its date/time, end time, type, interviewer, location,
nullable `score` (1–5), and nullable `result` (`Passed` or `Not passed`). These
fields are private to authorised Staff. Migration `0015-application-interview-results.sql`
adds the score and result columns; recording outcomes is handled by #145.
The profile tracker's `stageDates.Interview` uses the next upcoming interview
without a result, falling back to the latest interview date/time. When no
interviews exist, the recorded Stage date remains the fallback.
Run migration `0013-application-interviews.sql` before using this boundary.

## Private Application notes

`applicationsFor(sessionHandle, db).addNote(applicationId, text)` saves a private
note with the acting Staff member's Portal name and a database timestamp. Text
is trimmed; blank or non-string text and invalid Application ids return
validation. An unknown Application returns not-found. The caller cannot supply
an author or timestamp. Each write rechecks the Recruitment and Hiring Module.

`readProfile(id).notes` returns `{ id, text, authorName, createdAt }` entries,
newest first by timestamp and then id for stable ties. `createdAt` is a Date.
Applications with no notes return an empty array. The existing profile access
check protects notes; lists and CSV exports do not contain private notes.

Run `npm run db:migrate` before deploying this module. Migration
`0012-application-notes.sql` creates the HRMS-owned `hrms_application_notes`
table and its Application/time index without changing Careers tables.
