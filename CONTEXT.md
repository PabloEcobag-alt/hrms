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
A kind of Widget that shows one headline figure at the top of the Dashboard. The Key Summary Cards are Total Employee, New Hire, Open Positions, Attendance Rate, and Pending Leaves.
_Avoid_: KPI, stat tile

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
