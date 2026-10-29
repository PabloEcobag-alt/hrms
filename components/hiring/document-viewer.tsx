"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Download, FileX, Printer, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fileTypeLabel, formatFileSize, formatUploaded } from "@/lib/application-view";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/** The browser shows a PDF and an image itself; anything else (Word included) gets a "can't preview" state. */
export function canPreview(contentType: string) {
  return contentType === "application/pdf" || contentType.startsWith("image/");
}

/** Asks the Document route once whether it can serve the file. A good file answers with a redirect to file-storage (opaque to us); a missing one answers with an error. */
function useUnreachable(url: string, enabled: boolean) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState<{ attempt: number; unreachable: boolean } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    fetch(url, { redirect: "manual", signal: controller.signal })
      .then((response) => { controller.abort(); setFailed({ attempt, unreachable: !(response.type === "opaqueredirect" || response.ok) }); })
      .catch(() => { if (!controller.signal.aborted) setFailed({ attempt, unreachable: true }); });
    return () => controller.abort();
  }, [url, attempt, enabled]);
  return { unreachable: failed?.attempt === attempt && failed.unreachable, retry: () => setAttempt((n) => n + 1) };
}

const ICON_BUTTON = "cursor-pointer rounded-md p-[6px] text-zinc-300 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-ring";

function FileDetails({ contentType, size, requiredFor, uploadedAt, applicantName }: { contentType: string; size: number; requiredFor: string; uploadedAt: Date | null; applicantName: string }) {
  const rows: [string, string][] = [
    ["Type", fileTypeLabel(contentType)],
    ["Size", formatFileSize(size)],
    ["Requirement", requiredFor],
    ["Uploaded by", `${applicantName} · with application`],
    ...(uploadedAt ? [["Uploaded", formatUploaded(uploadedAt)] as [string, string]] : []),
  ];
  return (
    <aside aria-label="File details" className="flex w-full shrink-0 flex-col gap-[16px] self-start rounded-xl bg-white p-[20px] lg:w-[340px]">
      <div className="flex items-center gap-[8px]">
        <h3 className="flex-1 text-[15px] font-semibold text-zinc-900">File details</h3>
        <Badge variant="success">Submitted</Badge>
      </div>
      <dl className="flex flex-col gap-[16px] text-[13px]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start gap-[12px]">
            <dt className="w-[96px] shrink-0 text-zinc-500">{label}</dt>
            <dd className="min-w-0 flex-1 font-medium break-words text-[#1f1a2e]">{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function Notice({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div role="status" className="flex max-w-[360px] flex-col items-center gap-[12px] rounded-xl bg-[#2a2533] px-[32px] py-[40px] text-center text-white">
      <FileX aria-hidden className="size-[32px] text-zinc-300" />
      <p className="text-[15px] font-semibold">{title}</p>
      <p className="text-[13px] text-zinc-300">{detail}</p>
      {action}
    </div>
  );
}

function ViewerBody({ name, contentType, url, applicantName, size, requiredFor, uploadedAt }: Omit<Parameters<typeof DocumentViewer>[0], "children">) {
  const frame = useRef<HTMLIFrameElement>(null);
  const previewable = canPreview(contentType);
  const probe = useUnreachable(url, previewable);
  const [imageBroken, setImageBroken] = useState(false);
  const unreachable = probe.unreachable || imageBroken;
  const print = () => {
    try {
      if (!frame.current?.contentWindow) throw new Error("nothing to print in place");
      // Once the Document route redirects to file-storage the frame is cross-origin and print() throws; the browser's own viewer prints it instead.
      frame.current.contentWindow.print();
    } catch {
      window.open(url, "_blank");
    }
  };
  const retry = () => { setImageBroken(false); probe.retry(); };
  return (
    <>
      <div className="flex items-center gap-[12px] px-[20px] py-[14px] text-white">
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <DialogTitle className="truncate text-[15px] font-semibold leading-[normal] tracking-normal">{name}</DialogTitle>
          <DialogDescription className="truncate text-xs text-zinc-300">{applicantName}</DialogDescription>
        </div>
        {previewable && !unreachable && <button type="button" aria-label="Print" onClick={print} className={ICON_BUTTON}><Printer className="size-[18px]" /></button>}
        <a href={url} download aria-label={`Download ${name}`} className={ICON_BUTTON}><Download className="size-[18px]" /></a>
        <DialogClose aria-label="Close" className={ICON_BUTTON}><X className="size-[18px]" /></DialogClose>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-[20px] overflow-y-auto px-[20px] pb-[20px] lg:flex-row lg:overflow-visible">
        <div className="flex min-h-[60vh] min-w-0 flex-1 items-center justify-center lg:min-h-0">
          {!previewable
            ? <Notice title="Can't preview this file" detail="This type of file can't be shown here. Download it to open it." />
            : unreachable
              ? <Notice title="Can't open this file right now" detail="Try again in a moment, or download it instead." action={<button type="button" onClick={retry} className="cursor-pointer rounded-lg bg-[#5b2a86] px-[14px] py-[9px] text-sm font-medium text-white focus-visible:ring-2 focus-visible:ring-ring">Try again</button>} />
              : contentType === "application/pdf"
                ? <iframe ref={frame} src={url} title={name} className="size-full rounded-lg bg-white" />
                // eslint-disable-next-line @next/next/no-img-element -- the signed address is not an optimisable asset
                : <img src={url} alt={name} onError={() => setImageBroken(true)} className="max-h-full max-w-full rounded-lg object-contain" />}
        </div>
        <FileDetails contentType={contentType} size={size} requiredFor={requiredFor} uploadedAt={uploadedAt} applicantName={applicantName} />
      </div>
    </>
  );
}

/** Wraps a submitted Document's row text as the button that opens it full-screen. A PDF is an iframe and an image an img, so paging, zoom and print come from the browser. */
export function DocumentViewer({ name, contentType, url, applicantName, size, requiredFor, uploadedAt, children }: { name: string; contentType: string; url: string; applicantName: string; size: number; requiredFor: string; uploadedAt: Date | null; children: ReactNode }) {
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
        <ViewerBody name={name} contentType={contentType} url={url} applicantName={applicantName} size={size} requiredFor={requiredFor} uploadedAt={uploadedAt} />
      </DialogContent>
    </Dialog>
  );
}
