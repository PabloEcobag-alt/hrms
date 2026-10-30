import { KEY_SUMMARY_CARD_HEIGHT } from "@/components/dashboard/key-summary-card";
import { DETAIL_WIDGET_HEIGHT, detailWidgetRowClass } from "@/components/dashboard/detail-widget-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cardRowsFor, dashboardRange, detailWidgetRowsFor } from "@/lib/dashboard";
import { getShell } from "@/lib/portal/staff";

export default async function Loading() {
  const { permittedPages } = await getShell();
  const cardRows = cardRowsFor(permittedPages, {}, dashboardRange(undefined, new Date()));
  const widgetRows = detailWidgetRowsFor(permittedPages, {}, new Date());

  return (
    <div className="flex flex-col gap-lg p-md sm:p-lg">
      <div className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-xs">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        {permittedPages.includes("/job-postings") && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Skeleton className="h-[34px] w-full rounded-lg sm:w-64" />
            <Skeleton className="h-[34px] w-full rounded-lg sm:w-[84px]" />
          </div>
        )}
      </div>
      {cardRows.map((row) => (
        <div key={row[0].label} className="grid gap-md sm:grid-cols-2 xl:grid-cols-5">
          {row.map((card) => (
            <Skeleton key={card.label} className={`${KEY_SUMMARY_CARD_HEIGHT} rounded-xl`} />
          ))}
        </div>
      ))}
      {widgetRows.map((row) => (
        <div
          key={row[0].id}
          className={detailWidgetRowClass(row.length)}
        >
          {row.map((widget) => (
            <Skeleton key={widget.id} className={`${DETAIL_WIDGET_HEIGHT} rounded-xl`} />
          ))}
        </div>
      ))}
    </div>
  );
}
