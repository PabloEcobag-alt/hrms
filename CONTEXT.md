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
