"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deadlineInputValue, EMPLOYMENT_TYPES } from "@/lib/job-posting-form";
import type { JobPosting } from "@/lib/job-postings";
import type { FormState } from "@/app/(hrms)/job-postings/actions";
import { DeleteDraftButton } from "./delete-draft-button";

type Props = {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  posting?: Pick<JobPosting, "id"> & Partial<JobPosting>;
  deleteAction?: () => Promise<FormState>;
};

function Field({ name, label, children }: { name: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-xs">
      <Label htmlFor={name}>{label}</Label>
      {children}
    </div>
  );
}

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-sm text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

export function JobPostingForm({ action, posting, deleteAction }: Props) {
  const [state, submit, pending] = useActionState(action, {});

  return (
    <form action={submit} className="flex max-w-[48rem] flex-col gap-md">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <Field name="title" label="Title">
        <Input id="title" name="title" defaultValue={posting?.title} />
      </Field>
      <div className="grid gap-md sm:grid-cols-2">
        <Field name="department" label="Department">
          <Input id="department" name="department" defaultValue={posting?.department} />
        </Field>
        <Field name="employmentType" label="Employment type">
          <select
            id="employmentType"
            name="employmentType"
            defaultValue={posting?.employmentType ?? ""}
            className={selectClass}
          >
            <option value="">Select…</option>
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </Field>
        <Field name="location" label="Location">
          <Input id="location" name="location" defaultValue={posting?.location} />
        </Field>
        <Field name="deadline" label="Deadline">
          <Input
            id="deadline"
            name="deadline"
            type="date"
            defaultValue={deadlineInputValue(posting?.deadline ?? null)}
          />
        </Field>
      </div>
      <Field name="description" label="Description">
        <Textarea id="description" name="description" rows={5} defaultValue={posting?.description} />
      </Field>
      <Field name="requirements" label="Requirements">
        <Textarea id="requirements" name="requirements" rows={4} defaultValue={posting?.requirements} />
      </Field>
      <Field name="requiredDocuments" label="Required Documents (one per line)">
        <Textarea
          id="requiredDocuments"
          name="requiredDocuments"
          rows={3}
          defaultValue={posting?.requiredDocuments?.join("\n")}
        />
      </Field>
      <Field name="screeningCriteria" label="Screening criteria (one per line)">
        <Textarea
          id="screeningCriteria"
          name="screeningCriteria"
          rows={3}
          defaultValue={posting?.screeningCriteria?.join("\n")}
        />
      </Field>
      <div className="flex items-center justify-between gap-sm">
        <div className="flex gap-sm">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save as Draft"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/job-postings">Cancel</Link>
          </Button>
        </div>
        {deleteAction && <DeleteDraftButton action={deleteAction} />}
      </div>
    </form>
  );
}
