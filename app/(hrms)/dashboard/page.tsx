import { WidgetView } from "@/components/dashboard/widget-view";
import { widgetsFor } from "@/lib/dashboard";
import { getShell, requireModule } from "@/lib/portal/staff";

export default async function Page() {
  const staff = await requireModule("Dashboard");
  const { permittedPages } = await getShell();
  const widgets = widgetsFor(permittedPages);

  return (
    <div className="flex flex-col gap-lg p-md sm:p-lg">
      <div>
        <h1 className="text-headline-md">Dashboard</h1>
        <p className="text-body-sm text-muted-foreground">Welcome, {staff.name}.</p>
      </div>

      {widgets.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">
          You hold no other Modules yet, so there is nothing to summarise.
        </p>
      ) : (
        <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-3">
          {widgets.map((widget) => (
            <WidgetView key={widget.href} {...widget} />
          ))}
        </div>
      )}
    </div>
  );
}
