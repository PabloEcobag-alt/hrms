import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-[20px]">
      <Skeleton className="h-4 w-24" />
      <div className="flex flex-col gap-xs">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-[68px] w-full rounded-xl" />
      <div className="flex flex-col gap-[16px] lg:flex-row">
        <Skeleton className="h-[200px] w-full flex-1 rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl lg:w-[380px]" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
