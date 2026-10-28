import type { JobPostingFields, JobPostingStatus, JobTemplateFields } from "./job-postings";

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];

/** The Required Documents staff tick from; all are ticked on a new posting. */
export const DEFAULT_REQUIRED_DOCUMENTS = ["Resume or CV", "Valid government ID", "Health certificate"];

const text = (data: FormData, name: string) => String(data.get(name) ?? "").trim();
const lines = (data: FormData, name: string) =>
  text(data, name)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

/** Every visible form field is sent. */
export function fieldsFromForm(data: FormData): JobPostingFields {
  const date = text(data, "deadline");
  // A deadline is the end of its chosen day.
  const deadline = date ? new Date(`${date}T23:59:59.999Z`) : null;

  return {
    title: text(data, "title"),
    department: text(data, "department"),
    employmentType: text(data, "employmentType"),
    location: text(data, "location"),
    description: text(data, "summary"),
    requirements: joinRequirements({
      responsibilities: text(data, "responsibilities"),
      qualifications: text(data, "qualifications"),
    }),
    requiredDocuments: data
      .getAll("requiredDocuments")
      .map((document) => String(document).trim())
      .filter(Boolean),
    screeningCriteria: lines(data, "screeningCriteria"),
    deadline: deadline && !Number.isNaN(deadline.getTime()) ? deadline : null,
    openings: openingsFromForm(data),
    salaryFrom: numberFromForm(data, "salaryFrom"),
    salaryTo: numberFromForm(data, "salaryTo"),
    workSchedule: text(data, "workSchedule") || null,
  };
}

type RequirementSections = { responsibilities: string; qualifications: string };

const RESPONSIBILITIES = "Responsibilities:";
const QUALIFICATIONS = "Qualifications:";

/** The requirements field holds both sections as headed blocks; empty sections are left out. */
export function joinRequirements({ responsibilities, qualifications }: RequirementSections): string {
  return [
    responsibilities && `${RESPONSIBILITIES}\n${responsibilities}`,
    qualifications && `${QUALIFICATIONS}\n${qualifications}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** Inverse of joinRequirements. Text without headings predates the split and counts as Qualifications. */
export function splitRequirements(requirements: string): RequirementSections {
  const headed = requirements.startsWith(RESPONSIBILITIES) || requirements.startsWith(QUALIFICATIONS);
  if (!headed) return { responsibilities: "", qualifications: requirements.trim() };

  const qualificationsAt = requirements.indexOf(`\n\n${QUALIFICATIONS}\n`);
  const responsibilitiesPart = qualificationsAt === -1 ? requirements : requirements.slice(0, qualificationsAt);
  const qualificationsPart = qualificationsAt === -1 ? "" : requirements.slice(qualificationsAt + 2);
  const body = (part: string, heading: string) => (part.startsWith(heading) ? part.slice(heading.length).trim() : "");
  return {
    responsibilities: body(responsibilitiesPart, RESPONSIBILITIES),
    qualifications: body(qualificationsAt === -1 ? responsibilitiesPart : qualificationsPart, QUALIFICATIONS),
  };
}

/** Blank means unset; anything else is sent as typed so the backend can reject it. */
function numberFromForm(data: FormData, name: string): number | null {
  const value = text(data, name);
  return value ? Number(value) : null;
}

const openingsFromForm = (data: FormData) => numberFromForm(data, "openings");

export function deadlineInputValue(deadline: Date | null): string {
  return deadline ? deadline.toISOString().slice(0, 10) : "";
}

/** A Job Template keeps everything except the deadline. */
export function templateFieldsFromForm(data: FormData): JobTemplateFields {
  const fields: Partial<JobPostingFields> = fieldsFromForm(data);
  delete fields.deadline;
  return fields as JobTemplateFields;
}

/** Adds a custom Required Document to the listed ones; blanks and case-insensitive duplicates are refused. */
export function addRequiredDocument(
  documents: string[],
  name: string,
): { documents: string[] } | { error: string } {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Enter a document name." };
  if (documents.some((document) => document.toLowerCase() === trimmed.toLowerCase())) {
    return { error: "That document is already listed." };
  }
  return { documents: [...documents, trimmed] };
}

/** Which footer actions the shared form offers when editing a posting in the given status. */
export function editFooter(status: JobPostingStatus) {
  return {
    saveAsDraft: status === "draft",
    publish: status === "draft",
    saveChanges: status === "open",
    delete: status === "draft",
    close: status === "open",
    fill: status === "open",
  };
}

/** One line under a template's name in the picker: what sets it apart from the others. */
export function templateSummary(
  template: Pick<JobTemplateFields, "department" | "employmentType" | "location" | "salaryFrom" | "salaryTo">,
): string {
  const peso = (amount: number) => `₱${amount.toLocaleString("en-PH")}`;
  const { salaryFrom, salaryTo } = template;
  const salary =
    salaryFrom != null && salaryTo != null
      ? `${peso(salaryFrom)}–${salaryTo.toLocaleString("en-PH")}`
      : salaryFrom != null
        ? `from ${peso(salaryFrom)}`
        : salaryTo != null
          ? `up to ${peso(salaryTo)}`
          : "";
  return [template.department, template.employmentType, template.location, salary].filter(Boolean).join(" · ");
}
