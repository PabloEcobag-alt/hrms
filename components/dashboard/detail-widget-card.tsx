import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Fixed height, shared with the loading skeleton so the page does not jump. */
export const DETAIL_WIDGET_HEIGHT = "h-96";

/** Grid classes for one row of Detail Widgets: two across on wide screens, a lone one full width. */
export const detailWidgetRowClass = (count: number) =>
  count > 1 ? "grid gap-md lg:grid-cols-2" : "grid gap-md";

export function DetailWidgetCard({
  title,
  empty,
  children,
}: {
  title: string;
  /** True when the owning Module has no data to show yet. */
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <Card className={`${DETAIL_WIDGET_HEIGHT} flex flex-col`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {empty ? (
          <p className="text-label-sm text-muted-foreground">Nothing to show yet</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
