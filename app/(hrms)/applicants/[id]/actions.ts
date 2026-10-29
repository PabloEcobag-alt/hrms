"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ApplicationError } from "@/lib/applications";
import { LOGIN_PATH, NO_ACCESS_PATH } from "@/lib/portal/config";
import { applicationsForRequest } from "@/lib/portal/applications";

export type NoteFormState = { error?: string; saved?: number };

const MESSAGES: Record<ApplicationError["reason"], string> = {
  validation: "Write a note before adding it.",
  "not-found": "This Application no longer exists.",
  conflict: "This note could not be added.",
  unavailable: "HRMS could not reach the Portal or database. Please try again in a moment.",
  invalid: "",
  denied: "",
};

/** Adds a private note to an Application and refreshes its profile in place. */
export async function addNote(applicationId: number, previous: NoteFormState, data: FormData): Promise<NoteFormState> {
  try {
    await (await applicationsForRequest()).addNote(applicationId, data.get("text") as string);
  } catch (error) {
    if (!(error instanceof ApplicationError)) throw error;
    if (error.reason === "denied") redirect(NO_ACCESS_PATH);
    if (error.reason === "invalid") redirect(LOGIN_PATH);
    return { error: MESSAGES[error.reason] };
  }
  revalidatePath(`/applicants/${applicationId}`);
  return { saved: (previous.saved ?? 0) + 1 };
}
