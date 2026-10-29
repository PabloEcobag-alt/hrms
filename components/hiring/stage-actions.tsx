"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { ApplicationStage } from "@/lib/applications";
import { stageActions } from "@/lib/application-view";
import { moveApplication } from "@/app/(hrms)/applicants/[id]/actions";

/** The forward buttons for the current Stage. Schedule interview waits for its dialog (#159). */
export function StageActions({ applicationId, stage }: { applicationId: number; stage: ApplicationStage }) {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const actions = stageActions(stage);
  if (actions.length === 0) return null;
  return (
    <>
      {error && <p role="alert" className="w-full text-right text-xs text-destructive">{error}</p>}
      {actions.map((action) =>
        action.kind === "move" ? (
          <Button
            key={action.label}
            disabled={pending}
            onClick={() => start(async () => setError((await moveApplication(applicationId, stage, action.to)).error))}
            className="h-auto rounded-lg px-[14px] py-[9px] text-sm font-medium shadow-none"
          >
            {action.label}
          </Button>
        ) : (
          <Button key={action.label} variant="outline" className="h-auto rounded-lg border-[#e6e1ee] px-[14px] py-[9px] text-sm font-medium shadow-none">
            {action.label}
          </Button>
        ),
      )}
    </>
  );
}
