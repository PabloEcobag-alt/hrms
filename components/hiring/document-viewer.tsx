"use client";

import { useRef, type ReactNode } from "react";
import { Download, Printer, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function canView(contentType: string) {
  return contentType === "application/pdf" || contentType.startsWith("image/");
}

const ICON_BUTTON = "cursor-pointer rounded-md p-[6px] text-zinc-300 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-ring";

/** Wraps a submitted Document's row text as the button that opens it full-screen. A PDF is an iframe and an image an img, so paging, zoom and print come from the browser. */
export function DocumentViewer({ name, contentType, url, applicantName, children }: { name: string; contentType: string; url: string; applicantName: string; children: ReactNode }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const print = () => {
    try {
      if (!frame.current?.contentWindow) throw new Error("nothing to print in place");
      // Once the Document route redirects to file-storage the frame is cross-origin and print() throws; the browser's own viewer prints it instead.
      frame.current.contentWindow.print();
    } catch {
      window.open(url, "_blank");
    }
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" aria-label={`Open ${name}`} className="flex min-w-0 flex-1 cursor-pointer items-center gap-[12px] rounded-md text-left focus-visible:ring-2 focus-visible:ring-ring">{children}</button>
      </DialogTrigger>
      <DialogContent
        showClose={false}
        overlayClassName="bg-[rgba(18,13,26,0.92)]"
        className="inset-0 flex h-screen max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-transparent !p-0 shadow-none sm:max-w-none sm:rounded-none sm:!p-0 md:max-w-none lg:max-w-none"
      >
        <div className="flex items-center gap-[12px] px-[20px] py-[14px] text-white">
          <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <DialogTitle className="truncate text-[15px] font-semibold leading-[normal] tracking-normal">{name}</DialogTitle>
            <DialogDescription className="truncate text-xs text-zinc-300">{applicantName}</DialogDescription>
          </div>
          <a href={url} download aria-label={`Download ${name}`} className={ICON_BUTTON}><Download className="size-[18px]" /></a>
          <button type="button" aria-label="Print" onClick={print} className={ICON_BUTTON}><Printer className="size-[18px]" /></button>
          <DialogClose aria-label="Close" className={ICON_BUTTON}><X className="size-[18px]" /></DialogClose>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center px-[20px] pb-[20px]">
          {contentType === "application/pdf"
            ? <iframe ref={frame} src={url} title={name} className="size-full rounded-lg bg-white" />
            // eslint-disable-next-line @next/next/no-img-element -- the signed address is not an optimisable asset
            : <img src={url} alt={name} className="max-h-full max-w-full rounded-lg object-contain" />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
