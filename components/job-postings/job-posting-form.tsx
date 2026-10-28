"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deadlineInputValue, EMPLOYMENT_TYPES } from "@/lib/job-posting-form";
import type { JobPosting } from "@/lib/job-postings";
import type { FormState } from "@/app/(hrms)/job-postings/actions";
import { DeleteDraftButton } from "./delete-draft-button";
import { PostingStatusButton } from "./posting-status-button";

type Props = {
  action?: (state: FormState, data: FormData) => Promise<FormState>;
  posting?: Pick<JobPosting, "id"> & Partial<JobPosting>;
  /** Draft actions: delete, and publish through the form's own submit. */
  deleteAction?: () => Promise<FormState>;
  canPublish?: boolean;
  /** Open actions: close and mark as filled. */
  closeAction?: () => Promise<FormState>;
  fillAction?: () => Promise<FormState>;
  /** Closed and Filled postings show their values and offer nothing else. */
  readOnly?: boolean;
  /** A Job Template form: no deadline, and nothing about publishing. */
  template?: boolean;
  /** Explicit "Save as template", submitted with the values currently typed. */
  saveTemplateAction?: (data: FormData) => Promise<void>;
  /** Extra template-only action, e.g. delete. */
  templateActions?: React.ReactNode;
};

const noAction = async (): Promise<FormState> => ({});

function Field({
  name,
  label,
  error,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-xs">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error && (
        <p id={`${name}-error`} className="text-body-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="gap-xs">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-md">{children}</CardContent>
    </Card>
  );
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-sm text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

const ERROR_TEXT: Record<string, string> = {
  deadline: "Choose a deadline in the future.",
  openings: "Enter a whole number of 1 or more (up to 2,147,483,647).",
};

export function JobPostingForm({
  action,
  posting,
  deleteAction,
  canPublish,
  closeAction,
  fillAction,
  readOnly,
  template,
  saveTemplateAction,
  templateActions,
}: Props) {
  const [state, submit, pending] = useActionState(action ?? noAction, {});
  const errors = Object.fromEntries(
    Object.keys(state.fieldErrors ?? {}).map((field) => [
      field,
      ERROR_TEXT[field] ?? "This field is required.",
    ]),
  ) as Record<string, string>;
  // Marks an input as invalid for assistive tech and styling.
  const invalid = (name: string) =>
    errors[name]
      ? { "aria-invalid": true, "aria-describedby": `${name}-error` }
      : {};

  return (
    <form action={submit} className="flex flex-col gap-md">
      <fieldset disabled={readOnly} className="contents">
        {state.error && (
          <Alert variant="destructive">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <Section
          title="Role details"
          description="What Applicants will see once this Job Posting is Published."
        >
          <Field name="title" label="Title" error={errors.title}>
            <Input
              id="title"
              name="title"
              {...invalid("title")}
              defaultValue={posting?.title}
            />
          </Field>
          <div className="grid gap-md sm:grid-cols-2">
            <Field
              name="department"
              label="Department"
              error={errors.department}
            >
              <Input
                id="department"
                name="department"
                {...invalid("department")}
                defaultValue={posting?.department}
              />
            </Field>
            <Field
              name="employmentType"
              label="Employment type"
              error={errors.employmentType}
            >
              <select
                id="employmentType"
                name="employmentType"
                {...invalid("employmentType")}
                defaultValue={posting?.employmentType ?? ""}
                className={selectClass}
              >
                <option value="">Select…</option>
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </Field>
            <Field name="location" label="Location" error={errors.location}>
              <Input
                id="location"
                name="location"
                {...invalid("location")}
                defaultValue={posting?.location}
              />
            </Field>
            <Field name="openings" label="Openings" error={errors.openings}>
              <Input
                id="openings"
                name="openings"
                {...invalid("openings")}
                type="number"
                min={1}
                step={1}
                defaultValue={posting?.openings ?? ""}
              />
            </Field>
            {!template && (
              <Field name="deadline" label="Deadline" error={errors.deadline}>
                <Input
                  id="deadline"
                  name="deadline"
                  {...invalid("deadline")}
                  type="date"
                  defaultValue={deadlineInputValue(posting?.deadline ?? null)}
                />
              </Field>
            )}
          </div>
          <Field
            name="description"
            label="Description"
            error={errors.description}
          >
            <Textarea
              id="description"
              name="description"
              {...invalid("description")}
              rows={5}
              defaultValue={posting?.description}
            />
          </Field>
        </Section>
        <Section
          title="Requirements and screening"
          description="Optional. Shown to Applicants, who attach each required Document when they apply."
        >
          <Field name="requirements" label="Requirements">
            <Textarea
              id="requirements"
              name="requirements"
              rows={4}
              defaultValue={posting?.requirements}
            />
          </Field>
          <Field
            name="requiredDocuments"
            label="Required Documents (one per line)"
          >
            <Textarea
              id="requiredDocuments"
              name="requiredDocuments"
              rows={3}
              defaultValue={posting?.requiredDocuments?.join("\n")}
            />
          </Field>
          <Field
            name="screeningCriteria"
            label="Screening criteria (one per line)"
          >
            <Textarea
              id="screeningCriteria"
              name="screeningCriteria"
              rows={3}
              defaultValue={posting?.screeningCriteria?.join("\n")}
            />
          </Field>
        </Section>
      </fieldset>
      <div className="sticky bottom-0 -mx-md flex items-center justify-between gap-sm border-t border-border bg-background px-md py-md sm:-mx-lg sm:px-lg">
        <p className="hidden text-body-sm text-muted-foreground sm:block">
          {template
            ? "A template saves everything except the deadline. Postings started from it are copies."
            : readOnly
              ? "This Job Posting is final and cannot be reopened. Create a new one instead."
              : closeAction
                ? "Changes appear on Careers as soon as you save."
                : "Nothing is required to save a Draft."}
        </p>
        <div className="flex items-center gap-sm">
          {templateActions}
          {deleteAction && <DeleteDraftButton action={deleteAction} />}
          {closeAction && (
            <PostingStatusButton
              label="Close"
              title="Close this Job Posting?"
              description="Applicants will no longer see it on Careers. This cannot be undone."
              action={closeAction}
            />
          )}
          {fillAction && (
            <PostingStatusButton
              label="Mark as filled"
              title="Mark this Job Posting as filled?"
              description="Applicants will no longer see it on Careers. This cannot be undone."
              action={fillAction}
            />
          )}
          <Button variant="outline" asChild>
            <Link href="/job-postings">{readOnly ? "Back" : "Cancel"}</Link>
          </Button>
          {saveTemplateAction && !readOnly && (
            <Button
              type="submit"
              variant="outline"
              formAction={saveTemplateAction}
            >
              Save as template
            </Button>
          )}
          {!readOnly && (
            <Button
              type="submit"
              variant={canPublish ? "outline" : "default"}
              disabled={pending}
            >
              {pending
                ? "Saving…"
                : template || closeAction
                  ? "Save changes"
                  : "Save as Draft"}
            </Button>
          )}
          {canPublish && (
            <Button
              type="submit"
              name="intent"
              value="publish"
              disabled={pending}
            >
              Publish
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
