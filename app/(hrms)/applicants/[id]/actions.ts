"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ApplicationError, type ApplicationStage } from "@/lib/applications";
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

export type RejectState = { error?: string };

const REJECT_MESSAGES: Record<ApplicationError["reason"], string> = {
  validation: "This Application can no longer be rejected.",
  "not-found": "This Application no longer exists.",
  conflict: "This Application moved on since you opened it. Refresh to see its current Stage.",
  unavailable: "HRMS could not reach the Portal or database. Please try again in a moment.",
  invalid: "",
  denied: "",
};

/** Rejects an Application from the Stage the reviewer saw; the reason is optional. */
export async function rejectApplication(applicationId: number, fromStage: ApplicationStage, previous: RejectState, data: FormData): Promise<RejectState> {
  const reason = (data.get("reason") as string | null)?.trim() || undefined;
  try {
    await (await applicationsForRequest()).moveStage(applicationId, fromStage, "Rejected", reason);
  } catch (error) {
    if (!(error instanceof ApplicationError)) throw error;
    if (error.reason === "denied") redirect(NO_ACCESS_PATH);
    if (error.reason === "invalid") redirect(LOGIN_PATH);
    return { error: REJECT_MESSAGES[error.reason] };
  }
  revalidatePath(`/applicants/${applicationId}`);
  revalidatePath("/applicants");
  return {};
}

export type MoveState = { error?: string };

const MOVE_MESSAGES: Record<ApplicationError["reason"], string> = {
  validation: "This Application can no longer be moved that way.",
  "not-found": "This Application no longer exists.",
  conflict: "This Application moved on since you opened it. Refresh to see its current Stage.",
  unavailable: "HRMS could not reach the Portal or database. Please try again in a moment.",
  invalid: "",
  denied: "",
};

/** Moves an Application one Stage forward from the Stage the reviewer saw. */
export async function moveApplication(applicationId: number, fromStage: ApplicationStage, toStage: ApplicationStage): Promise<MoveState> {
  try {
    await (await applicationsForRequest()).moveStage(applicationId, fromStage, toStage);
  } catch (error) {
    if (!(error instanceof ApplicationError)) throw error;
    if (error.reason === "denied") redirect(NO_ACCESS_PATH);
    if (error.reason === "invalid") redirect(LOGIN_PATH);
    return { error: MOVE_MESSAGES[error.reason] };
  }
  revalidatePath(`/applicants/${applicationId}`);
  revalidatePath("/applicants");
  return {};
}
