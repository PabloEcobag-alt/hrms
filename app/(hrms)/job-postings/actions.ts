"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { fieldsFromForm } from "@/lib/job-posting-form";
import { JobPostingError, retryJobPostingAnnouncements, type JobPostingFields, type jobPostingsFor } from "@/lib/job-postings";
import { LOGIN_PATH, NO_ACCESS_PATH } from "@/lib/portal/config";
import { postingsForRequest } from "@/lib/portal/postings";

export type FormState = { error?: string; fieldErrors?: Partial<Record<keyof JobPostingFields, string>> };

const MESSAGES = {
  unavailable: "HRMS could not reach the Portal or database. Please try again in a moment.",
  "not-found": "This Job Posting no longer exists.",
  "not-open": "Only an Open Job Posting can be changed here.",
  validation: "Complete the highlighted fields.",
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
    // The saved edits are what the page should now show, not the stale copy.
    revalidatePath("/job-postings", "layout");
    return { error: MESSAGES[error.reason], fieldErrors: error.fieldErrors };
  }
  revalidatePath("/job-postings", "layout");
  redirect("/job-postings");
}

export async function createDraft(_: FormState, data: FormData): Promise<FormState> {
  return run((postings) => postings.saveDraft(fieldsFromForm(data)));
}

export async function updateDraft(id: string, _: FormState, data: FormData): Promise<FormState> {
  const publish = data.get("intent") === "publish";
  return run(async (postings) => {
    await postings.editDraft(id, fieldsFromForm(data));
    if (publish) {
      await postings.publish(id);
      after(() => retryJobPostingAnnouncements());
    }
  });
}

export async function updateOpen(id: string, _: FormState, data: FormData): Promise<FormState> {
  return run((postings) => postings.editOpen(id, fieldsFromForm(data)));
}

export async function closePosting(id: string): Promise<FormState> {
  return run((postings) => postings.close(id));
}

export async function fillPosting(id: string): Promise<FormState> {
  return run((postings) => postings.markFilled(id));
}

export async function removeDraft(id: string): Promise<FormState> {
  return run((postings) => postings.deleteDraft(id));
}
