import { Card } from "@/components/ui/card";
import type { ApplicationNote } from "@/lib/applications";
import { dayTime } from "@/lib/application-view";
import { CardTitle } from "@/components/hiring/parts";
import { AddNoteForm } from "@/components/hiring/add-note-form";

/** Private notes, newest first, each with who wrote it and when. */
export function ApplicationNotes({ applicationId, notes }: { applicationId: number; notes: ApplicationNote[] }) {
  return (
    <Card className="flex flex-col gap-[14px] rounded-xl px-[20px] py-[18px] shadow-none">
      <CardTitle>Notes</CardTitle>
      {notes.length > 0 && (
        <ul aria-label="Notes" className="flex flex-col gap-[10px]">
          {notes.map((note) => (
            <li key={note.id} className="flex flex-col gap-[6px] rounded-lg border border-zinc-200 bg-white px-[12px] py-[10px]">
              <p className="whitespace-pre-wrap break-words text-sm leading-[21px] text-zinc-900">{note.text}</p>
              <span className="text-xs text-zinc-500">{note.authorName} · {dayTime(note.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
      <AddNoteForm applicationId={applicationId} />
      <p className="text-xs text-zinc-500">Visible to HR and interviewers only.</p>
    </Card>
  );
}
