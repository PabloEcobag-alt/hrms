# Applications list

`applicationsFor(sessionHandle, db).list({ page })` is the server-side boundary
for the Applicants list. Every call rechecks the Recruitment and Hiring Module
through the Portal before querying; invalid, denied and unavailable decisions
throw `ApplicationError` with the corresponding reason.

The result contains `rows`, `total`, `page` (one-based, default 1), and
`pageSize` (25). Invalid page numbers throw `ApplicationError("validation")`.
Rows are ordered by applied date descending, then Application id descending to
keep equal dates stable. Empty and out-of-range pages retain the total.

Migration `0011-applications-list.sql` creates the HRMS-owned
`hrms_careers_applications` read view. It reads the Application's profile snapshot
name, Applicant profile email, and Job Posting title and location. It includes
all posting statuses and Withdrawn Applications and maps stored `Received` to
`New`. It changes no Careers table or record. Run it through `npm run db:migrate`
with the existing direct database connection before using the module.

Next step labels are fixed per Stage. Interview currently reads `Awaiting result`;
upcoming interview dates are added by #143. Filtering, counts by Stage, CSV,
profile reads and mutations belong to subsequent tickets under #133.
