"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportFileName, exportHref } from "@/lib/application-view";
import type { ApplicationTab } from "@/lib/applications";

/** Downloads every Application the current Stage, search and Job match, not just the visible page. */
export function ApplicantExport({ stage, search, job }: { stage: ApplicationTab; search?: string; job?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "failed">("idle");

  async function download() {
    setState("busy");
    try {
      const response = await fetch(exportHref({ stage, search, job }));
      if (!response.ok) throw new Error(`Export failed: ${response.status}`);
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = exportFileName(new Date());
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setState("idle");
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="flex flex-col items-end gap-xs">
      <Button variant="outline" className="h-auto rounded-lg px-[14px] py-[9px] shadow-none" disabled={state === "busy"} onClick={download}>
        <Download /> {state === "busy" ? "Exporting…" : "Export"}
      </Button>
      {state === "failed" && (
        <p role="alert" className="text-xs text-destructive">The export could not be downloaded. Please try again.</p>
      )}
    </div>
  );
}
