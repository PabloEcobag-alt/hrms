import type { JobPostingFields, JobTemplateFields } from "./job-postings";

export const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];

const text = (data: FormData, name: string) => String(data.get(name) ?? "").trim();
const lines = (data: FormData, name: string) =>
  text(data, name)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

/** Visible form fields are sent; backend-only salary and openings stay omitted on edits. */
export function fieldsFromForm(data: FormData): Omit<JobPostingFields, "openings" | "salaryFrom" | "salaryTo"> {
  const date = text(data, "deadline");
  // A deadline is the end of its chosen day.
  const deadline = date ? new Date(`${date}T23:59:59.999Z`) : null;

  return {
    title: text(data, "title"),
    department: text(data, "department"),
    employmentType: text(data, "employmentType"),
    location: text(data, "location"),
    description: text(data, "description"),
    requirements: text(data, "requirements"),
    requiredDocuments: lines(data, "requiredDocuments"),
    screeningCriteria: lines(data, "screeningCriteria"),
    deadline: deadline && !Number.isNaN(deadline.getTime()) ? deadline : null,
  };
}

export function deadlineInputValue(deadline: Date | null): string {
  return deadline ? deadline.toISOString().slice(0, 10) : "";
}

/** A Job Template keeps everything except the deadline. */
export function templateFieldsFromForm(data: FormData): Omit<JobTemplateFields, "openings" | "salaryFrom" | "salaryTo"> {
  const fields: Partial<JobPostingFields> = fieldsFromForm(data);
  delete fields.deadline;
  return fields as Omit<JobTemplateFields, "openings" | "salaryFrom" | "salaryTo">;
}
