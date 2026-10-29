"use client";

import { useActionState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { ApplicationStage } from "@/lib/applications";
import { rejectApplication, type RejectState } from "@/app/(hrms)/applicants/[id]/actions";

/** The Reject button in the profile header and the confirmation it opens; the reason is optional. Once rejected the page stops offering it, which closes the dialog. */
export function RejectApplication({ applicationId, stage, applicantName }: { applicationId: number; stage: ApplicationStage; applicantName: string }) {
  const [state, submit, pending] = useActionState(rejectApplication.bind(null, applicationId, stage), {} as RejectState);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-auto rounded-lg border-[#e6e1ee] px-[14px] py-[9px] text-sm font-medium text-[#b91c1c] shadow-none hover:text-[#b91c1c]">
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent
        showClose={false}
        overlayClassName="bg-[rgba(18,13,26,0.45)]"
        className="w-[calc(100vw-32px)] max-w-[580px] gap-0 rounded-2xl border-0 p-0 shadow-[0_20px_24px_rgba(0,0,0,0.2)] sm:max-w-[580px] sm:rounded-2xl sm:p-0 md:max-w-[580px] lg:max-w-[580px]"
      >
        <form action={submit}>
          <div className="flex items-start gap-[12px] border-b border-[#ebebeb] pb-[16px] pl-[24px] pr-[18px] pt-[20px]">
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <DialogTitle className="text-[17px] font-semibold leading-[normal] tracking-normal text-foreground">Reject {applicantName}?</DialogTitle>
              <DialogDescription className="text-[13px] leading-[normal] text-zinc-500">
                The Application moves to Rejected and no further actions remain.
              </DialogDescription>
            </div>
            <DialogClose aria-label="Close" className="cursor-pointer text-zinc-500 hover:text-foreground">
              <X className="size-[18px]" />
            </DialogClose>
          </div>
          <div className="flex flex-col gap-[6px] px-[24px] py-[20px]">
            <label htmlFor="reject-reason" className="flex gap-[3px] text-[13px] font-medium text-zinc-800">
              Reason <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <Textarea
              id="reject-reason"
              name="reason"
              rows={3}
              placeholder="Why is this Application being rejected?"
              className="rounded-lg border-zinc-200 bg-white px-[12px] py-[10px] text-sm leading-[21px] shadow-none"
            />
            {state.error && <p role="alert" className="text-xs text-destructive">{state.error}</p>}
          </div>
          <div className="flex items-center justify-end gap-sm border-t border-[#ebebeb] bg-zinc-50 px-[24px] py-[14px]">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-auto rounded-lg border-zinc-200 px-[16px] py-[9px] text-sm font-medium shadow-none">Cancel</Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending} className="h-auto rounded-lg px-[16px] py-[9px] text-sm font-medium shadow-none">
              {pending ? "Rejecting…" : "Reject"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
