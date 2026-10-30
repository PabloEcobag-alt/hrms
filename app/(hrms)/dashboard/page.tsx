import { Download } from "lucide-react";
import { KeySummaryCard } from "@/components/dashboard/key-summary-card";
import { DetailWidget } from "@/components/dashboard/detail-widget";
import { detailWidgetRowClass } from "@/components/dashboard/detail-widget-card";
import { DateRangeSelect } from "@/components/dashboard/date-range-select";
import { RangeDependent, RangeProvider } from "@/components/dashboard/range-pending";
import { cardRowsFor, dashboardRange, detailWidgetRowsFor, manilaToday, rangeSearch } from "@/lib/dashboard";
import { dashboardSummaryFor } from "@/lib/dashboard-data";
import { getShell, requireModule } from "@/lib/portal/staff";

const firstValue = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

export default async function Page({ searchParams }: PageProps<"/dashboard">) {
  const staff = await requireModule("Dashboard");
  const { permittedPages } = await getShell();
  // Only Recruitment and Hiring supplies summary data so far; each other card and Detail Widget fills in as its Module does.
  const now = new Date();
  const params = await searchParams;
  const range = dashboardRange(firstValue(params.range), now, { from: firstValue(params.from), to: firstValue(params.to) });
  const summary = await dashboardSummaryFor(permittedPages, range, now);
  const cardRows = cardRowsFor(permittedPages, summary, range);
  const widgetRows = detailWidgetRowsFor(permittedPages, {}, now);
  const hiring = permittedPages.includes("/job-postings");

  return (
    <RangeProvider>
      <div className="flex flex-col gap-lg p-md sm:p-lg">
        <div className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-headline-md">Dashboard</h1>
            <p className="text-body-sm text-muted-foreground">Welcome, {staff.name}.</p>
          </div>
          {hiring && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <DateRangeSelect
                selected={range.id}
                label={range.label}
                today={manilaToday(now)}
                custom={{ from: range.start, to: range.end }}
              />
              <a
                href={`/api/dashboard/export?${rangeSearch(range)}`}
                className="flex h-[34px] items-center justify-center gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <Download className="size-4 shrink-0" aria-hidden />
                Export
              </a>
            </div>
          )}
        </div>

        {cardRows.length === 0 && widgetRows.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">
            You hold no Modules with a summary yet.
          </p>
        ) : (
          <>
            {cardRows.map((row) => (
              <div key={row[0].label} className="grid gap-md sm:grid-cols-2 xl:grid-cols-5">
                {row.map((card) =>
                  card.rangeDependent ? (
                    <RangeDependent key={card.label}>
                      <KeySummaryCard {...card} />
                    </RangeDependent>
                  ) : (
                    <KeySummaryCard key={card.label} {...card} />
                  ),
                )}
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
    </RangeProvider>
  );
}
