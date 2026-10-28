"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { templateFieldsFromForm } from "@/lib/job-posting-form";
import { JobTemplateError, type jobTemplatesFor } from "@/lib/job-postings";
import { LOGIN_PATH, NO_ACCESS_PATH } from "@/lib/portal/config";
import { templatesForRequest } from "@/lib/portal/templates";
import type { FormState } from "../job-postings/actions";

/** Runs a Job Template operation, turning refusals into form messages or the right redirect. */
async function run(
  operation: (
    templates: ReturnType<typeof jobTemplatesFor>,
  ) => Promise<unknown>,
): Promise<FormState> {
  try {
    await operation(await templatesForRequest());
  } catch (error) {
    if (!(error instanceof JobTemplateError)) throw error;
    if (error.reason === "denied") redirect(NO_ACCESS_PATH);
    if (error.reason === "invalid") redirect(LOGIN_PATH);
    revalidatePath("/job-templates", "layout");
    return {
      error:
        error.reason === "not-found"
          ? "This Job Template no longer exists."
          : "HRMS could not reach the Portal or database. Please try again in a moment.",
    };
  }
  revalidatePath("/job-templates", "layout");
  redirect("/job-templates");
}

export async function createTemplate(
  _: FormState,
  data: FormData,
): Promise<FormState> {
  return run((templates) => templates.create(templateFieldsFromForm(data)));
}

/** "Save as template" from a posting form: an explicit copy of what is typed, deadline excluded. */
export async function saveAsTemplate(data: FormData): Promise<void> {
  await run((templates) => templates.create(templateFieldsFromForm(data)));
}

export async function updateTemplate(
  id: string,
  _: FormState,
  data: FormData,
): Promise<FormState> {
  return run((templates) => templates.edit(id, templateFieldsFromForm(data)));
}

export async function removeTemplate(id: string): Promise<FormState> {
  return run((templates) => templates.delete(id));
}
