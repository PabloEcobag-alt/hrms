import { Badge } from "@/components/ui/badge";
import type { UpcomingEvent } from "@/lib/dashboard";

const KIND = {
  holiday: { label: "Holiday", variant: "info" },
  leave: { label: "Leave", variant: "success" },
} as const;

const formatDate = (date: string) =>
  new Date(`${date}T00:00`).toLocaleDateString("en", { month: "short", day: "numeric" });

export function UpcomingEventsList({ items }: { items: UpcomingEvent[] }) {
  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-md overflow-y-auto">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-md">
          <div className="min-w-0 flex-1">
            <p className="text-label-md truncate">{item.title}</p>
            <p className="text-body-sm truncate text-muted-foreground">
              {formatDate(item.date)}
              {item.description && ` · ${item.description}`}
            </p>
          </div>
          <Badge variant={KIND[item.kind].variant}>{KIND[item.kind].label}</Badge>
        </li>
      ))}
    </ul>
  );
}
