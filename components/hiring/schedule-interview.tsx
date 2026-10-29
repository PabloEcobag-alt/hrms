"use client";

import { useActionState, useState } from "react";
import { Link2, MapPin, Map as MapIcon, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { ApplicationStage } from "@/lib/applications";
import { scheduleInterview, type ScheduleState } from "@/app/(hrms)/applicants/[id]/actions";
import { cn } from "@/lib/utils";
import { OptionGroup } from "./dialog-parts";

const BOX = "flex items-center gap-sm rounded-lg border bg-white px-[12px] py-[9px] text-sm text-zinc-900 focus-within:border-[#8b5cf6]";
const INPUT = "min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400";

function Labelled({ label, htmlFor, required, error, hint, children }: { label: string; htmlFor: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label htmlFor={htmlFor} className="flex gap-[3px] text-[13px] font-medium text-zinc-800">
        {label}{required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

/** The Schedule interview button on the profile and the dialog it opens (Online and In person). Saving moves the Application to Interview, which re-renders the page. */
export function ScheduleInterview({ applicationId, stage, applicantName, jobTitle, location, label }: { applicationId: number; stage: ApplicationStage; applicantName: string; jobTitle: string; location: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"Online" | "In person">("Online");
  const [state, submit, pending] = useActionState(async (previous: ScheduleState, data: FormData) => {
    const next = await scheduleInterview(applicationId, stage, previous, data);
    if (next.scheduled) setOpen(false);
    return next;
  }, {} as ScheduleState);
  const errors = { ...state.fieldErrors, ...(state.fieldErrors?.place && { place: type === "Online" ? "Enter the meeting link." : "Enter the location." }) };
  const border = (name: keyof typeof errors) => (errors[name] ? "border-destructive" : "border-zinc-200");
  const first = applicantName.split(" ")[0];
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-auto rounded-lg border-[#e6e1ee] px-[14px] py-[9px] text-sm font-medium shadow-none">{label}</Button>
      </DialogTrigger>
      <DialogContent
        showClose={false}
        overlayClassName="bg-[rgba(18,13,26,0.45)]"
        className="max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] max-w-[580px] gap-0 overflow-y-auto rounded-2xl border-0 !p-0 shadow-[0_20px_24px_rgba(0,0,0,0.2)] sm:max-w-[580px] sm:rounded-2xl sm:!p-0 md:max-w-[580px] lg:max-w-[580px]"
      >
        <form action={submit} noValidate>
          <input type="hidden" name="type" value={type} />
          <div className="flex items-start gap-[12px] border-b border-[#ebebeb] pb-[16px] pl-[24px] pr-[18px] pt-[20px]">
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <DialogTitle className="text-[17px] font-semibold leading-[normal] tracking-normal text-foreground">Schedule interview</DialogTitle>
              <DialogDescription className="text-[13px] leading-[normal] text-zinc-500">{applicantName} · {jobTitle} · {location}</DialogDescription>
            </div>
            <DialogClose aria-label="Close" className="cursor-pointer text-zinc-500 hover:text-foreground"><X className="size-[18px]" /></DialogClose>
          </div>
          <div className="flex flex-col gap-md px-[24px] py-[20px]">
            <div className="flex flex-col gap-[8px]">
              <p className="flex gap-[3px] text-[13px] font-medium text-zinc-800">Interview type<span className="text-red-600">*</span></p>
              <OptionGroup
                value={type}
                onChange={setType}
                options={[
                  { value: "Online", title: "Online", description: "Send a video call link", icon: <Video className="text-primary" /> },
                  { value: "In person", title: "In person", description: "Share the place and a map link", icon: <MapPin className="text-primary" /> },
                ]}
              />
            </div>
            <div className="flex gap-[12px]">
              <div className="min-w-0 flex-1">
                <Labelled label="Date" htmlFor="interview-date" required error={errors.date}>
                  <div className={cn(BOX, border("date"))}><input id="interview-date" name="date" type="date" className={INPUT} /></div>
                </Labelled>
              </div>
              <div className="min-w-0 flex-1">
                <Labelled label="Time" htmlFor="interview-start" required error={errors.start ?? errors.end}>
                  <div className={cn(BOX, errors.start || errors.end ? "border-destructive" : "border-zinc-200")}>
                    <input id="interview-start" name="start" type="time" aria-label="Start time" className={INPUT} />
                    <span className="text-zinc-400">–</span>
                    <input name="end" type="time" aria-label="End time" className={INPUT} />
                  </div>
                </Labelled>
              </div>
            </div>
            <Labelled label="Interviewer" htmlFor="interview-interviewer" required error={errors.interviewer}>
              <div className={cn(BOX, border("interviewer"))}><input id="interview-interviewer" name="interviewer" placeholder="Interviewer's name" className={INPUT} /></div>
            </Labelled>
            {type === "Online" ? (
              <Labelled label="Meeting link" htmlFor="interview-link" required error={errors.place} hint="Paste a Google Meet or Zoom link.">
                <div className={cn(BOX, border("place"))}>
                  <Link2 className="size-4 text-zinc-500" />
                  <input id="interview-link" name="meetingLink" placeholder="https://meet.google.com/…" className={cn(INPUT, "text-primary")} />
                </div>
              </Labelled>
            ) : (
              <>
                <Labelled label="Location" htmlFor="interview-location" required error={errors.place}>
                  <div className={cn(BOX, border("place"))}>
                    <MapPin className="size-4 text-zinc-500" />
                    <input id="interview-location" name="location" placeholder="Branch and address" className={INPUT} />
                  </div>
                </Labelled>
                <Labelled label="Map link" htmlFor="interview-map" hint="Optional. Share a link if they should find the place on a map.">
                  <div className={cn(BOX, "border-zinc-200")}>
                    <MapIcon className="size-4 text-zinc-500" />
                    <input id="interview-map" name="mapLink" placeholder="https://maps.app.goo.gl/…" className={cn(INPUT, "text-primary")} />
                  </div>
                </Labelled>
              </>
            )}
            {state.error && <p role="alert" className="text-xs text-destructive">{state.error}</p>}
          </div>
          <div className="flex items-center gap-sm border-t border-[#ebebeb] bg-zinc-50 px-[24px] py-[14px]">
            <p className="flex-1 text-xs text-zinc-500">{first} moves to Interview.</p>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-auto rounded-lg border-zinc-200 px-[16px] py-[9px] text-sm font-medium shadow-none">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={pending} className="h-auto rounded-lg px-[16px] py-[9px] text-sm font-medium shadow-none">{pending ? "Scheduling…" : "Schedule interview"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
