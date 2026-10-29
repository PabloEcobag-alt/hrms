"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addNote, type NoteFormState } from "@/app/(hrms)/applicants/[id]/actions";

/** The box and button for a new note; the box empties once the note is saved. */
export function AddNoteForm({ applicationId }: { applicationId: number }) {
  const [state, submit, pending] = useActionState(addNote.bind(null, applicationId), {} as NoteFormState);
  return (
    <form action={submit} key={state.saved ?? 0} className="flex flex-col gap-[8px]">
      <Textarea
        name="text"
        aria-label="Add a note"
        placeholder="Add a note"
        required
        rows={3}
        aria-invalid={state.error ? true : undefined}
        className="rounded-lg border-zinc-200 bg-white px-[12px] py-[10px] text-sm leading-[21px] shadow-none"
      />
      {state.error && <p role="alert" className="text-xs text-destructive">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending} className="self-end">{pending ? "Adding…" : "Add note"}</Button>
    </form>
  );
}
