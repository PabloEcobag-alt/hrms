import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ActivityItem } from "@/lib/dashboard";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

export function RecentActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-md overflow-y-auto">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-md">
          <Avatar>
            {item.photoUrl && <AvatarImage src={item.photoUrl} alt={item.employeeName} />}
            <AvatarFallback>{initials(item.employeeName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-label-md truncate">{item.title}</p>
            <p className="text-body-sm truncate text-muted-foreground">{item.description}</p>
          </div>
          <span className="shrink-0 text-label-sm text-muted-foreground">{item.ago}</span>
        </li>
      ))}
    </ul>
  );
}
