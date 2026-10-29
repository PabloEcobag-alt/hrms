"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ApplicationError, type ApplicationStage } from "@/lib/applications";
import { LOGIN_PATH, NO_ACCESS_PATH } from "@/lib/portal/config";
import { applicationsForRequest } from "@/lib/portal/applications";
import { readInterviewForm, type InterviewFormErrors } from "@/lib/application-view";

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

export type ScheduleState = { error?: string; fieldErrors?: InterviewFormErrors; scheduled?: number; values?: Record<string, string> };

const SCHEDULE_MESSAGES: Record<ApplicationError["reason"], string> = {
  validation: "Check the interview details and try again.",
  "not-found": "This Application no longer exists.",
  conflict: "This Application moved on since you opened it. Refresh to see its current Stage.",
  unavailable: "HRMS could not reach the Portal or database. Please try again in a moment.",
  invalid: "",
  denied: "",
};

/** Schedules an interview from the Stage the reviewer saw, moving the Application to Interview. */
export async function scheduleInterview(applicationId: number, fromStage: ApplicationStage, previous: ScheduleState, data: FormData): Promise<ScheduleState> {
  const field = (name: string) => (data.get(name) as string | null) ?? "";
  // Sent back so the form keeps what was typed when React resets it after the action.
  const values = Object.fromEntries(["date", "start", "end", "interviewer", "meetingLink", "location", "mapLink"].map((name) => [name, field(name)]));
  const { input, errors } = readInterviewForm({
    type: field("type") === "In person" ? "In person" : "Online",
    date: field("date"), start: field("start"), end: field("end"), interviewer: field("interviewer"),
    meetingLink: field("meetingLink"), location: field("location"), mapLink: field("mapLink"),
  });
  if (!input) return { fieldErrors: errors, values };
  try {
    await (await applicationsForRequest()).scheduleInterview(applicationId, fromStage, input);
  } catch (error) {
    if (!(error instanceof ApplicationError)) throw error;
    if (error.reason === "denied") redirect(NO_ACCESS_PATH);
    if (error.reason === "invalid") redirect(LOGIN_PATH);
    return { error: SCHEDULE_MESSAGES[error.reason], values };
  }
  revalidatePath(`/applicants/${applicationId}`);
  revalidatePath("/applicants");
  return { scheduled: (previous.scheduled ?? 0) + 1 };
}

export type ResultState = { error?: string; recorded?: number };

const RESULT_MESSAGES: Record<ApplicationError["reason"], string> = {
  validation: "Choose a result and a score from 1 to 5.",
  "not-found": "This interview no longer exists.",
  conflict: "A result can only be recorded once the interview has started.",
  unavailable: "HRMS could not reach the Portal or database. Please try again in a moment.",
  invalid: "",
  denied: "",
};

/** Records the score and result of an interview that has already started. */
export async function recordInterviewResult(applicationId: number, interviewId: number, previous: ResultState, data: FormData): Promise<ResultState> {
  const result = data.get("result");
  try {
    await (await applicationsForRequest()).recordInterviewResult(applicationId, interviewId, { score: Number(data.get("score")), result: result as "Passed" | "Not passed" });
  } catch (error) {
    if (!(error instanceof ApplicationError)) throw error;
    if (error.reason === "denied") redirect(NO_ACCESS_PATH);
    if (error.reason === "invalid") redirect(LOGIN_PATH);
    return { error: RESULT_MESSAGES[error.reason] };
  }
  revalidatePath(`/applicants/${applicationId}`);
  return { recorded: (previous.recorded ?? 0) + 1 };
}
