# HRMS

A staff-facing Human Resource Management system for Bren Raphael's. Its UI shell is copied from CREOMS.

## Language

**Staff**:
A person who signs in through the central Portal and works in HRMS. The Portal calls the same person a User.
_Avoid_: User, admin, Employee

**Portal**:
The central sign-in site that Staff sign in through and are sent into HRMS from. It decides who may open HRMS and which of its Modules. Signing out of HRMS signs the Staff member out of the Portal and every other Bren Raphael's system.
_Avoid_: Auth app, login site

**Module**:
A feature area of HRMS that the Portal grants or revokes per Staff member, shown as one tab in the sidebar. Each HRMS page belongs to exactly one Module. The Modules are Dashboard, Attendance, Employee Information, Payroll & ESS, Recruitment and Hiring, and User Management. The Portal and HRMS use the same Module names.
_Avoid_: Permission, feature, section, page

**HR-ATS**:
The company's Applicant Tracking System, which is the Recruitment and Hiring Module of HRMS. It is where Staff author Job Postings and, later, work Applications through the hiring workflow. The Careers site of the e-commerce app reads what HR-ATS publishes.
_Avoid_: ATS app, recruitment app

**Job Posting**:
One open role that Staff author in HR-ATS and Applicants see on the Careers site. It can be started from a Job Template or typed from scratch, and is Draft, Open, Closed or Filled. Staff see the Open status labelled "Published", and publishing a Draft is what makes it Open. Filled means the role was filled by a hire, and Closed means it ended otherwise (Staff closed it or its deadline passed). Only an Open Job Posting is visible on Careers. HRMS and Careers share one database, so a Job Posting is one record seen by both.
_Avoid_: Job, listing, vacancy

**Applicant**:
A person who applies for a job at Bren Raphael's. An Applicant is a person, not a row in the Applicants list; one Applicant who applies to two Job Postings has two Applications. Unrelated to Staff, even for the same person.
_Avoid_: Candidate, user

**Application**:
One Applicant's candidacy for one Job Posting. An Applicant has at most one Application per Job Posting. Each row of the Applicants tab is an Application, and its profile page is the Application's page, with the Applicant's identity shown inside it. The tab is called "Applicants" because that is HR's word for it.
_Avoid_: Applicant (for the row), submission, candidacy

**Stage**:
Where an Application stands in the hiring workflow: New, Screening, Interview, Offer, Hired or Rejected. The tracker on an Application's page labels New as "Applied". An Applicant who withdraws puts the Application in a Withdrawn state that Staff cannot change; it is shown under All only and is not a Stage Staff can move an Application into. The Careers site shows the same value as the Application's status.
_Avoid_: Status (in the HRMS UI), step

**Required Document**:
A document an Applicant must upload to apply for a Job Posting. Staff tick from Resume or CV, Valid government ID and Health certificate, and can add their own, such as "NBI clearance". It is always a document; other hiring criteria are not Required Documents.
_Avoid_: Application requirement, attachment

**Document**:
A file an Applicant attached to their profile and sent with an Application, such as a resume or a government ID. Staff open it from the Application's page. It is the file itself, whereas a Required Document is the requirement it answers.
_Avoid_: Attachment, upload, Required Document (for the file)

**Job Template**:
A saved, reusable role definition that Staff start Job Postings from. It exists only because Staff explicitly saved it; typing a Job Posting from scratch never creates one unless Staff choose "Save as template".
_Avoid_: Saved job, preset

**Attendance**:
The Module for employee attendance. Biometrics is not a separate Module and is not part of its name.
_Avoid_: Attendance Biometrics, Biometrics

**Widget**:
A summary block on the Dashboard that belongs to exactly one Module and is shown only to Staff who hold that Module. Until its Module has data, a Widget shows "Nothing to show yet". The Dashboard has no Widget of its own.
_Avoid_: Tile, panel

**Key Summary Card**:
A kind of Widget that shows one headline figure at the top of the Dashboard, with an optional line of detail beneath it. The Key Summary Cards are Total Employee, New Hire, Open jobs, Applicants, Interviews this week, Offer acceptance, Average time to hire, Attendance Rate, and Pending Leaves. The hiring cards (owned by Recruitment and Hiring) sit in a row of their own above the rest.
_Avoid_: KPI, stat tile, Open Positions (replaced by Open jobs)

**Open jobs**:
A Key Summary Card, owned by Recruitment and Hiring, that shows how many Job Postings are Open right now, with the openings they list in total and the locations they cover. "Jobs" is only the card's label; the thing counted is the Open Job Posting. It is read from the shared database and is not affected by any date range.

**Applicants**:
A Key Summary Card, owned by Recruitment and Hiring, that shows how many Applications were received in the Dashboard Range, including HR-added, rejected and withdrawn ones. Its detail line is the comparison with the Previous period. "Applicants" is only the card's label; the thing counted is the Application.

**Interviews this week**:
A Key Summary Card, owned by Recruitment and Hiring, that shows how many Interviews start in the current Monday-to-Sunday week (Manila time), finished ones included, with how many start today. It shows 0, not "Nothing to show yet", when there are none. It is not affected by the Dashboard Range and makes no comparison.

**Decided offer**:
An Application that reached the Offer Stage and then left it with an answer: reached Hired (accepted) or Rejected (not accepted). It is dated by when it was decided, not when the offer was made. An offer still waiting is not a decided offer. An Applicant who withdraws after an offer has no decision date to read, so is not counted.

**Offer acceptance**:
A Key Summary Card, owned by Recruitment and Hiring, that shows accepted decided offers as a whole percent of the decided offers whose decision date is in the Dashboard Range, with "X of Y offers accepted" beneath. Its comparison with the Previous period is in percentage points. It shows "Nothing to show yet", never 0%, when no offer was decided.

**Average time to hire**:
A Key Summary Card, owned by Recruitment and Hiring, that shows the mean number of whole days (Manila dates) from an Application being received to being Hired, over the Applications Hired in the Dashboard Range. Its comparison with the Previous period says how many days faster or slower. It shows "Nothing to show yet", never 0 days, when nobody was Hired.

**Dashboard Range**:
The period the range-dependent Key Summary Cards cover, chosen from the presets This month (default), Last month, Last 30 days, Last 90 days and Year to date, or as a Custom range of two dates no later than today and at most a year apart. It is kept in the URL, anything unknown or invalid means This month, and every date and boundary is in Manila time. This month and Year to date run from the start of the month or year to today; Last 30 and 90 days include today. Only Staff who hold Recruitment and Hiring see the selector.
_Avoid_: Date filter, period (for the range itself)

**Previous period**:
The period a Dashboard Range is compared with. This month is compared with the same days of last month (held at the end of a shorter month), Last month with the month before it, Last 30 or 90 days with the same number of days just before, Year to date with the same days of last year, and a Custom range with the period of the same length just before it. A comparison is left out when either period has no data.

**Detail Widget**:
A kind of Widget that shows more than one headline figure, such as a chart or a list, below the Key Summary Cards. The Detail Widgets are Headcount Trend, Department Distribution, Recent Activity, and Upcoming Events. In the code, `Widget` on its own is not used; the Key Summary Cards and the Detail Widgets are separate types.
_Avoid_: Panel, tile

**Headcount Trend**:
A kind of Widget, owned by Employee Information, that charts how the Total Employee figure changed over time.

**Department Distribution**:
A kind of Widget, owned by Employee Information, that shows how the company's employees split across departments.

**Recent Activity**:
A kind of Widget, owned by Employee Information, that lists the latest employee-record events such as hires, transfers and status changes. It does not draw on other Modules.

**Upcoming Events**:
A kind of Widget, owned by Attendance, that lists what is coming up such as approved leave and holidays. It does not draw on other Modules.

## UI design reference

The Figma file [Bren Raphael's CRM - Orders Prototype](https://www.figma.com/design/76nS6Pw2TXA6fWfUvTmzJ1/Bren-Raphael-s-CRM---Orders-Prototype?node-id=0-1&p=f&t=ZlW5bZYq2Dp1w315-0) is the reference for all UI design in HRMS. Always check it before building or changing any UI.
