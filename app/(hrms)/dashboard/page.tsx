import { KeySummaryCard } from "@/components/dashboard/key-summary-card";
import { DetailWidget } from "@/components/dashboard/detail-widget";
import { cardsFor, detailWidgetRowsFor } from "@/lib/dashboard";
import { getShell, requireModule } from "@/lib/portal/staff";

export default async function Page() {
  const staff = await requireModule("Dashboard");
  const { permittedPages } = await getShell();
  // No Module supplies summary data yet; each card and Detail Widget fills in as its Module does.
  const cards = cardsFor(permittedPages, {});
  const widgetRows = detailWidgetRowsFor(permittedPages, {}, new Date());

  return (
    <div className="flex flex-col gap-lg p-md sm:p-lg">
      <div>
        <h1 className="text-headline-md">Dashboard</h1>
        <p className="text-body-sm text-muted-foreground">Welcome, {staff.name}.</p>
      </div>

      {cards.length === 0 && widgetRows.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">
          You hold no Modules with a summary yet.
        </p>
      ) : (
        <>
          {cards.length > 0 && (
            <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-5">
              {cards.map((card) => (
                <KeySummaryCard key={card.label} {...card} />
              ))}
            </div>
          )}
          {widgetRows.map((row) => (
            <div
              key={row[0].id}
              className={row.length > 1 ? "grid gap-md lg:grid-cols-2" : "grid gap-md"}
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
