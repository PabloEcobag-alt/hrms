import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ApplicationProfile } from "@/lib/applications";
import { activityEntries, type ActivityEntry } from "@/lib/application-view";
import { CardTitle } from "@/components/hiring/parts";

const DOT: Record<ActivityEntry["tone"], string> = {
  purple: "bg-badge-purple-foreground",
  blue: "bg-badge-info-foreground",
  green: "bg-badge-success-foreground",
  red: "bg-badge-destructive-foreground",
};

/** What happened to the Application, newest first, with who did it. */
export function ApplicationActivity({ profile }: { profile: ApplicationProfile }) {
  const entries = activityEntries(profile);
  return (
    <Card className="flex flex-col gap-[14px] rounded-xl px-[20px] py-[18px] shadow-none">
      <CardTitle>Activity timeline</CardTitle>
      <ol aria-label="Activity timeline" className="flex flex-col gap-[14px]">
        {entries.map((entry, index) => (
          <li key={index} className="flex items-start gap-[10px]">
            <span aria-hidden className={cn("mt-[9px] size-[8px] shrink-0 rounded-full", DOT[entry.tone])} />
            <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
              <span className="text-sm font-medium text-zinc-900">{entry.title}</span>
              <span className="text-xs text-zinc-500">{entry.detail}</span>
            </div>
          </li>
        ))}
      </ol>
      {entries.length === 1 && <p className="text-xs text-zinc-500">Nothing else has happened yet.</p>}
    </Card>
  );
}
