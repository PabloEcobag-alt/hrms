"use client";

import { useActionState, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { recordInterviewResult, type ResultState } from "@/app/(hrms)/applicants/[id]/actions";
import { SCORE_LABELS } from "@/lib/application-view";
import { OptionGroup } from "./dialog-parts";

/** The Record result button on an interview that has started, and the Interview result dialog it opens. Saving re-renders the profile with the score and status. */
export function InterviewResult({ applicationId, interviewId, subtitle }: { applicationId: number; interviewId: number; subtitle: string }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<"Passed" | "Not passed">("Passed");
  const [state, submit, pending] = useActionState(async (previous: ResultState, data: FormData) => {
    const next = await recordInterviewResult(applicationId, interviewId, previous, data);
    if (next.recorded) setOpen(false);
    return next;
  }, {} as ResultState);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-auto rounded-lg border-[#e6e1ee] px-[12px] py-[6px] text-[13px] font-medium shadow-none">Record result</Button>
      </DialogTrigger>
      <DialogContent
        showClose={false}
        overlayClassName="bg-[rgba(18,13,26,0.45)]"
        className="max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] max-w-[580px] gap-0 overflow-y-auto rounded-2xl border-0 !p-0 shadow-[0_20px_24px_rgba(0,0,0,0.2)] sm:max-w-[580px] sm:rounded-2xl sm:!p-0 md:max-w-[580px] lg:max-w-[580px]"
      >
        <form action={submit}>
          <input type="hidden" name="result" value={result} />
          <div className="flex items-start gap-[12px] border-b border-[#ebebeb] pb-[16px] pl-[24px] pr-[18px] pt-[20px]">
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <DialogTitle className="text-[17px] font-semibold leading-[normal] tracking-normal text-foreground">Interview result</DialogTitle>
              <DialogDescription className="text-[13px] leading-[normal] text-zinc-500">{subtitle}</DialogDescription>
            </div>
            <DialogClose aria-label="Close" className="cursor-pointer text-zinc-500 hover:text-foreground"><X className="size-[18px]" /></DialogClose>
          </div>
          <div className="flex flex-col gap-md px-[24px] py-[20px]">
            <div className="flex flex-col gap-[8px]">
              <p className="flex gap-[3px] text-[13px] font-medium text-zinc-800">Result<span className="text-red-600">*</span></p>
              <OptionGroup
                value={result}
                onChange={setResult}
                options={[
                  { value: "Passed", title: "Passed", description: "Did well in the interview", icon: <Check className="text-[#1e6b3a]" /> },
                  { value: "Not passed", title: "Not passed", description: "Did not meet the bar", icon: <X className="text-red-700" /> },
                ]}
              />
            </div>
            <div className="flex flex-col gap-[6px]">
              <label htmlFor="interview-score" className="text-[13px] font-medium text-zinc-800">Score</label>
              <div className="relative flex items-center rounded-lg border border-zinc-200 bg-white focus-within:border-[#8b5cf6]">
                <select id="interview-score" name="score" defaultValue="4" className="w-full cursor-pointer appearance-none bg-transparent px-[12px] py-[9px] text-sm text-zinc-900 outline-none">
                  {SCORE_LABELS.map((label, index) => <option key={label} value={index + 1}>{index + 1} / 5 · {label}</option>)}
                </select>
                <ChevronDown aria-hidden className="pointer-events-none absolute right-[12px] size-4 text-zinc-500" />
              </div>
              <p className="text-xs text-zinc-500">Scores are private to HR and never shown to the Applicant.</p>
            </div>
            {state.error && <p role="alert" className="text-xs text-destructive">{state.error}</p>}
          </div>
          <div className="flex items-center gap-sm border-t border-[#ebebeb] bg-zinc-50 px-[24px] py-[14px]">
            <p className="flex-1 text-xs text-zinc-500">Saved to the Interviews card and the activity timeline.</p>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-auto rounded-lg border-zinc-200 px-[16px] py-[9px] text-sm font-medium shadow-none">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={pending} className="h-auto rounded-lg px-[16px] py-[9px] text-sm font-medium shadow-none">{pending ? "Saving…" : "Save result"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
