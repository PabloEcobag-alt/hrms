import { Skeleton } from "@/components/ui/skeleton";
import { cardsFor } from "@/lib/dashboard";
import { getShell } from "@/lib/portal/staff";

export default async function Loading() {
  const { permittedPages } = await getShell();
  const cards = cardsFor(permittedPages, {});

  return (
    <div className="flex flex-col gap-lg p-md sm:p-lg">
      <div className="flex flex-col gap-xs">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <Skeleton key={card.label} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
