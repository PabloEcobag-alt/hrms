import { Download, File } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ApplicationDocument } from "@/lib/applications";
import { formatFileSize } from "@/lib/application-view";

function DocumentRow({ document }: { document: ApplicationDocument }) {
  const submitted = document.status === "Submitted";
  return (
    <li className="flex items-center gap-[12px] rounded-lg border border-zinc-200 py-[9px] pr-[12px] pl-[9px]">
      <span aria-hidden className="flex h-[36px] w-[32px] shrink-0 items-center justify-center rounded-md bg-zinc-100">
        <File className="size-4 text-zinc-500" />
      </span>
      <div className={cn("flex min-w-0 flex-1 flex-col gap-[2px]", !submitted && "text-zinc-500")}>
        <span className={cn("truncate text-[13px] font-medium", submitted && "text-zinc-900")}>{submitted ? document.name : document.requiredFor}</span>
        <span className="truncate text-xs text-zinc-500">
          {submitted ? `Uploaded with application · ${formatFileSize(document.size)}` : "Required for this role · not yet submitted"}
        </span>
      </div>
      {submitted
        ? (
          <a href={document.downloadUrl} download aria-label={`Download ${document.name}`} className="shrink-0 rounded-md p-1 text-zinc-500 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-ring">
            <Download className="size-4" />
          </a>
        )
        : <Badge variant="warning" className="shrink-0">Requested</Badge>}
    </li>
  );
}

/** Submitted files to download, then a greyed Requested row for each Required Document still missing. */
export function ApplicationDocuments({ documents }: { documents: ApplicationDocument[] }) {
  if (documents.length === 0) return null;
  return (
    <>
      <hr className="border-border" />
      <h3 className="text-[13px] font-medium text-zinc-800">Documents</h3>
      <ul aria-label="Documents" className="flex flex-col gap-[8px]">
        {documents.map((document) => <DocumentRow key={document.status === "Submitted" ? document.id : `requested-${document.requiredFor}`} document={document} />)}
      </ul>
    </>
  );
}
