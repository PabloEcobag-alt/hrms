import { KeySummaryCard } from "@/components/dashboard/key-summary-card";
import { cardsFor } from "@/lib/dashboard";
import { getShell, requireModule } from "@/lib/portal/staff";

export default async function Page() {
  const staff = await requireModule("Dashboard");
  const { permittedPages } = await getShell();
  // No Module supplies summary data yet; each card fills in as its Module does.
  const cards = cardsFor(permittedPages, {});

  return (
    <div className="flex flex-col gap-lg p-md sm:p-lg">
      <div>
        <h1 className="text-headline-md">Dashboard</h1>
        <p className="text-body-sm text-muted-foreground">Welcome, {staff.name}.</p>
      </div>

      {cards.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">
          You hold no Modules with a summary yet.
        </p>
      ) : (
        <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => (
            <KeySummaryCard key={card.label} {...card} />
          ))}
        </div>
      )}
    </div>
  );
}
