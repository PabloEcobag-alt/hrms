import { Skeleton } from "@/components/ui/skeleton";
import { ProfileColumns } from "@/components/hiring/parts";

export function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-[20px]">
      <Skeleton className="h-4 w-24" />
      <div className="flex flex-col gap-xs">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-[68px] w-full rounded-xl" />
      <ProfileColumns main={<Skeleton className="h-[200px] w-full rounded-xl" />} aside={<Skeleton className="h-[200px] w-full rounded-xl" />} />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
