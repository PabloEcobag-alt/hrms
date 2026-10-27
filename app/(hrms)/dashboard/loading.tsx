import { WIDGET_HEIGHT } from "@/components/dashboard/widget-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cardsFor, widgetRowsFor } from "@/lib/dashboard";
import { getShell } from "@/lib/portal/staff";

export default async function Loading() {
  const { permittedPages } = await getShell();
  const cards = cardsFor(permittedPages, {});
  const widgetRows = widgetRowsFor(permittedPages, {}, new Date());

  return (
    <div className="flex flex-col gap-lg p-md sm:p-lg">
      <div className="flex flex-col gap-xs">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      {cards.length > 0 && (
        <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => (
            <Skeleton key={card.label} className="h-32 rounded-xl" />
          ))}
        </div>
      )}
      {widgetRows.map((row) => (
        <div
          key={row[0].id}
          className={row.length > 1 ? "grid gap-md lg:grid-cols-2" : "grid gap-md"}
        >
          {row.map((widget) => (
            <Skeleton key={widget.id} className={`${WIDGET_HEIGHT} rounded-xl`} />
          ))}
        </div>
      ))}
    </div>
  );
}
