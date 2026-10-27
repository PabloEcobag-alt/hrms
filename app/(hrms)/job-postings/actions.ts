"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { fieldsFromForm } from "@/lib/job-posting-form";
import { JobPostingError, type jobPostingsFor } from "@/lib/job-postings";
import { LOGIN_PATH, NO_ACCESS_PATH } from "@/lib/portal/config";
import { postingsForRequest } from "@/lib/portal/postings";

export type FormState = { error?: string };

const MESSAGES = {
  unavailable: "HRMS could not reach the Portal or database. Please try again in a moment.",
  "not-found": "This Job Posting no longer exists.",
  "not-open": "Only an Open Job Posting can be changed here.",
  validation: "Complete all required fields and use a future deadline.",
  "not-draft": "Only a Draft can be changed here.",
  invalid: "",
  denied: "",
} satisfies Record<JobPostingError["reason"], string>;

/** Runs a Job Posting operation, turning refusals into form messages or the right redirect. */
async function run(operation: (postings: ReturnType<typeof jobPostingsFor>) => Promise<unknown>): Promise<FormState> {
  try {
    await operation(await postingsForRequest());
  } catch (error) {
    if (!(error instanceof JobPostingError)) throw error;
    if (error.reason === "denied") redirect(NO_ACCESS_PATH);
    if (error.reason === "invalid") redirect(LOGIN_PATH);
    return { error: MESSAGES[error.reason] };
  }
  revalidatePath("/job-postings");
  redirect("/job-postings");
}

export async function createDraft(_: FormState, data: FormData): Promise<FormState> {
  return run((postings) => postings.saveDraft(fieldsFromForm(data)));
}

export async function updateDraft(id: string, _: FormState, data: FormData): Promise<FormState> {
  return run((postings) => postings.editDraft(id, fieldsFromForm(data)));
}

export async function removeDraft(id: string): Promise<FormState> {
  return run((postings) => postings.deleteDraft(id));
}
