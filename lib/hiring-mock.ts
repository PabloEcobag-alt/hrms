/**
 * Static sample data for the Interviews, Offers and Hired screens.
 * These screens are UI only for now; nothing here is read from or written to the database.
 */

export type InterviewJob = {
  slug: string;
  title: string;
  meta: string;
  counts: { toSchedule: number; scheduled: number; passed: number; notPassed: number };
  next: string | null;
};

export const INTERVIEW_JOBS: InterviewJob[] = [
  {
    slug: "production-staff",
    title: "Production Staff",
    meta: "Main kitchen, Antipolo · Full-time",
    counts: { toSchedule: 3, scheduled: 2, passed: 1, notPassed: 0 },
    next: "Today, 2:00 PM · Jomar Villanueva",
  },
  {
    slug: "delivery-coordinator",
    title: "Delivery Coordinator",
    meta: "Main kitchen, Antipolo · Full-time",
    counts: { toSchedule: 0, scheduled: 0, passed: 1, notPassed: 1 },
    next: null,
  },
  {
    slug: "branch-cashier",
    title: "Branch Cashier",
    meta: "Cainta branch · Full-time",
    counts: { toSchedule: 2, scheduled: 2, passed: 1, notPassed: 1 },
    next: "Today, 4:00 PM · Carla Mendoza",
  },
  {
    slug: "quality-control-inspector",
    title: "Quality Control Inspector",
    meta: "Main kitchen, Antipolo · Full-time",
    counts: { toSchedule: 1, scheduled: 0, passed: 1, notPassed: 0 },
    next: null,
  },
  {
    slug: "social-media-associate",
    title: "Social Media Associate",
    meta: "Hybrid · Antipolo · Part-time",
    counts: { toSchedule: 1, scheduled: 1, passed: 0, notPassed: 0 },
    next: "31 Oct, 2:00 PM · Patricia Lim",
  },
];

export type InterviewResult = "Waiting" | "Scheduled" | "Passed" | "Not passed";

export type InterviewRow = {
  name: string;
  email: string;
  date: string | null;
  time: string | null;
  type: "online" | "in-person" | null;
  interviewer: string | null;
  result: InterviewResult;
  note: string | null;
};

export const BRANCH_CASHIER_INTERVIEWS: InterviewRow[] = [
  { name: "Mylene Santos", email: "mylene.santos@gmail.com", date: null, time: null, type: null, interviewer: null, result: "Waiting", note: null },
  { name: "Grace Villar", email: "grace.villar@gmail.com", date: null, time: null, type: null, interviewer: null, result: "Waiting", note: null },
  { name: "Carla Mendoza", email: "carla.mendoza@gmail.com", date: "28 Oct 2026", time: "Today, 4:00 – 4:30 PM", type: "online", interviewer: "Paolo Garcia", result: "Scheduled", note: null },
  { name: "Kristine Aquino", email: "kristine.aquino@yahoo.com", date: "30 Oct 2026", time: "10:00 – 10:45 AM", type: "in-person", interviewer: "Paolo Garcia", result: "Scheduled", note: null },
  { name: "Ellaine Torres", email: "ellaine.torres@gmail.com", date: "21 Oct 2026", time: "9:00 – 9:45 AM", type: "in-person", interviewer: "Paolo Garcia", result: "Passed", note: "Moved to Offers · email sent 22 Oct" },
  { name: "Joel Ramirez", email: "joel.ramirez@gmail.com", date: "21 Oct 2026", time: "1:00 – 1:30 PM", type: "online", interviewer: "Paolo Garcia", result: "Not passed", note: "Result email sent 22 Oct" },
];

export type OfferStatus = "Draft" | "Sent" | "Accepted" | "Declined";

export type OfferRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  salary: string;
  startDate: string;
  sent: string | null;
  replyBy: string | null;
  status: OfferStatus;
};

export const OFFERS: OfferRow[] = [
  { id: "rafael-santiago", name: "Rafael Santiago", email: "raf.santiago@gmail.com", role: "Delivery Coordinator", salary: "₱19,000", startDate: "3 Nov 2026", sent: "20 Oct 2026", replyBy: "27 Oct 2026", status: "Sent" },
  { id: "ellaine-torres", name: "Ellaine Torres", email: "ellaine.torres@gmail.com", role: "Branch Cashier", salary: "₱15,500", startDate: "10 Nov 2026", sent: "22 Oct 2026", replyBy: "29 Oct 2026", status: "Sent" },
  { id: "noel-bautista", name: "Noel Bautista", email: "noel.bautista@gmail.com", role: "Production Staff", salary: "₱16,500", startDate: "10 Nov 2026", sent: "24 Oct 2026", replyBy: "31 Oct 2026", status: "Sent" },
  { id: "bryan-castillo", name: "Bryan Castillo", email: "bryan.castillo@gmail.com", role: "Production Staff", salary: "₱16,000", startDate: "17 Nov 2026", sent: null, replyBy: null, status: "Draft" },
  { id: "angelica-ramos", name: "Angelica Ramos", email: "angelica.ramos@gmail.com", role: "Quality Control Inspector", salary: "₱21,000", startDate: "3 Nov 2026", sent: "16 Oct 2026", replyBy: "23 Oct 2026", status: "Accepted" },
  { id: "jasmine-reyes", name: "Jasmine Reyes", email: "jas.reyes@gmail.com", role: "Branch Cashier", salary: "₱15,000", startDate: "27 Oct 2026", sent: "12 Oct 2026", replyBy: "19 Oct 2026", status: "Declined" },
];

export const OFFER_TABS = [
  { label: "All", count: 15 },
  { label: "Draft", count: 1 },
  { label: "Sent", count: 3 },
  { label: "Accepted", count: 10 },
  { label: "Declined", count: 1 },
];

export type PreEmploymentDoc = { name: string; hint: string; fromApplication?: boolean };

export const PRE_EMPLOYMENT_DOCS: PreEmploymentDoc[] = [
  { name: "Resume", hint: "From application", fromApplication: true },
  { name: "Valid government ID", hint: "From application", fromApplication: true },
  { name: "NBI clearance", hint: "Not older than 6 months" },
  { name: "Health certificate", hint: "From the city health office" },
  { name: "SSS number", hint: "E-1 form or SSS ID" },
  { name: "PhilHealth number", hint: "MDR or PhilHealth ID" },
  { name: "Pag-IBIG MID and TIN", hint: "For payroll deductions and tax" },
];

export type Employee = {
  name: string;
  email: string;
  employeeId: string;
  position: string;
  department: string;
  branch: string;
  startDate: string;
  status: "Onboarding" | "Active";
};

export const EMPLOYEES: Employee[] = [
  { name: "Ellaine Torres", email: "ellaine.torres@gmail.com", employeeId: "BR-EMP-0058", position: "Branch Cashier", department: "Branches", branch: "Cainta branch", startDate: "10 Nov 2026", status: "Onboarding" },
  { name: "Rafael Santiago", email: "raf.santiago@gmail.com", employeeId: "BR-EMP-0057", position: "Delivery Coordinator", department: "Distribution", branch: "Main kitchen", startDate: "3 Nov 2026", status: "Onboarding" },
  { name: "Angelica Ramos", email: "angelica.ramos@gmail.com", employeeId: "BR-EMP-0056", position: "Quality Control Inspector", department: "Production", branch: "Main kitchen", startDate: "3 Nov 2026", status: "Onboarding" },
  { name: "Noel Garcia", email: "noel.garcia@gmail.com", employeeId: "BR-EMP-0055", position: "Production Staff", department: "Production", branch: "Main kitchen", startDate: "6 Oct 2026", status: "Active" },
  { name: "Liza Bautista", email: "liza.bautista@brenraphaels.ph", employeeId: "BR-EMP-0031", position: "Production Head", department: "Production", branch: "Main kitchen", startDate: "2 Feb 2024", status: "Active" },
  { name: "Paolo Garcia", email: "paolo.garcia@brenraphaels.ph", employeeId: "BR-EMP-0024", position: "Branch Head", department: "Branches", branch: "Cainta branch", startDate: "15 Aug 2023", status: "Active" },
  { name: "Carlo Mendoza", email: "carlo.mendoza@brenraphaels.ph", employeeId: "BR-EMP-0019", position: "Delivery Lead", department: "Distribution", branch: "Main kitchen", startDate: "4 Jan 2023", status: "Active" },
];

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
