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

Next step labels are fixed per Stage. Interview currently reads `Awaiting result`;
upcoming interview dates are added by #143. The filters and counts reuse the
existing read view, so no additional migration is required. CSV,
profile reads and mutations belong to subsequent tickets under #133.
