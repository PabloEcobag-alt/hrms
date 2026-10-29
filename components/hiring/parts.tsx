import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { initialsOf } from "@/lib/hiring-mock";

export function Initials({ name }: { name: string }) {
  return (
    <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-primary">
      {initialsOf(name)}
    </span>
  );
}

export function PersonCell({
  name,
  subtitle,
  href,
}: {
  name: string;
  subtitle: string;
  href?: string;
}) {
  const label = href ? (
    <Link href={href} className="font-medium text-primary after:absolute after:inset-0 hover:underline">
      {name}
    </Link>
  ) : (
    <span className="font-medium text-primary">{name}</span>
  );
  return (
    <div className="flex items-center gap-[10px]">
      <Initials name={name} />
      <div className="flex flex-col gap-[2px] text-left">
        <span className="text-sm leading-[normal]">{label}</span>
        <span className="text-xs leading-[normal] text-muted-foreground">{subtitle}</span>
      </div>
    </div>
  );
}

/** Pill tabs from the Figma tab row. Display only: they do not filter yet. */
export function PillTabs({
  tabs,
  className,
}: {
  tabs: { label: string; count: number }[];
  className?: string;
}) {
  return (
    <Tabs defaultValue={tabs[0].label} className={className}>
      <TabsList className="h-auto flex-wrap justify-start gap-xs bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.label}
            value={tab.label}
            className="rounded-lg px-[14px] py-[8px] text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-primary data-[state=active]:shadow-none"
          >
            {tab.label} {tab.count}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function InfoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-muted px-[12px] py-[10px] text-xs text-muted-foreground">
      {children}
    </p>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-xs self-start text-[13px] font-medium text-zinc-500 hover:text-foreground"
    >
      <ChevronLeft className="size-4" />
      {children}
    </Link>
  );
}

export const HEAD = "h-auto px-0 py-[6px] text-xs font-medium text-muted-foreground";
export const CELL = "px-0 py-[10px] text-sm text-foreground";

export function PageHeader({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-sm">
      <div className="flex min-w-0 flex-1 flex-col gap-xs">
        <div className="flex items-center gap-[10px]">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {badge}
        </div>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export const PAGE = "flex flex-col gap-[20px] px-md py-[28px] sm:px-xl";

export function CardTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className={cn("flex items-center gap-sm")}>
      <h2 className="flex-1 text-[15px] font-semibold text-zinc-900">{children}</h2>
      {aside}
    </div>
  );
}
