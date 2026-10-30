import { KeySummaryCard } from "@/components/dashboard/key-summary-card";
import { DetailWidget } from "@/components/dashboard/detail-widget";
import { detailWidgetRowClass } from "@/components/dashboard/detail-widget-card";
import { DateRangeSelect } from "@/components/dashboard/date-range-select";
import { cardRowsFor, dashboardRange, detailWidgetRowsFor } from "@/lib/dashboard";
import { dashboardSummaryFor } from "@/lib/dashboard-data";
import { getShell, requireModule } from "@/lib/portal/staff";

export default async function Page({ searchParams }: PageProps<"/dashboard">) {
  const staff = await requireModule("Dashboard");
  const { permittedPages } = await getShell();
  // Only Recruitment and Hiring supplies summary data so far; each other card and Detail Widget fills in as its Module does.
  const now = new Date();
  const { range: rangeParam } = await searchParams;
  const range = dashboardRange(rangeParam, now);
  const summary = await dashboardSummaryFor(permittedPages, range);
  const cardRows = cardRowsFor(permittedPages, summary, range);
  const widgetRows = detailWidgetRowsFor(permittedPages, {}, now);

  return (
    <div className="flex flex-col gap-lg p-md sm:p-lg">
      <div className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-headline-md">Dashboard</h1>
          <p className="text-body-sm text-muted-foreground">Welcome, {staff.name}.</p>
        </div>
        {permittedPages.includes("/job-postings") && <DateRangeSelect selected={range.id} label={range.label} />}
      </div>

      {cardRows.length === 0 && widgetRows.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">
          You hold no Modules with a summary yet.
        </p>
      ) : (
        <>
          {cardRows.map((row) => (
            <div key={row[0].label} className="grid gap-md sm:grid-cols-2 xl:grid-cols-5">
              {row.map((card) => (
                <KeySummaryCard key={card.label} {...card} />
              ))}
            </div>
          ))}
          {widgetRows.map((row) => (
            <div
              key={row[0].id}
              className={detailWidgetRowClass(row.length)}
            >
              {row.map((widget) => (
                <DetailWidget key={widget.id} {...widget} />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
