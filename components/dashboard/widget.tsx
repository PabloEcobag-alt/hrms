import { DepartmentDonut } from "@/components/dashboard/department-donut";
import { HeadcountTrendChart } from "@/components/dashboard/headcount-trend-chart";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { UpcomingEventsList } from "@/components/dashboard/upcoming-events-list";
import { WidgetCard } from "@/components/dashboard/widget-card";
import type { Widget as WidgetData } from "@/lib/dashboard";

export function Widget(widget: WidgetData) {
  return (
    <WidgetCard title={widget.label} empty={widget.data === null}>
      {widget.id === "headcount-trend" && widget.data && (
        <HeadcountTrendChart points={widget.data} />
      )}
      {widget.id === "department-distribution" && widget.data && (
        <DepartmentDonut slices={widget.data} />
      )}
      {widget.id === "recent-activity" && widget.data && (
        <RecentActivityList items={widget.data} />
      )}
      {widget.id === "upcoming-events" && widget.data && (
        <UpcomingEventsList items={widget.data} />
      )}
    </WidgetCard>
  );
}
