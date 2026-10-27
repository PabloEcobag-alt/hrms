import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { KeySummaryCard as KeySummaryCardData } from "@/lib/dashboard";

export function KeySummaryCard({ label, figure }: KeySummaryCardData) {
  return (
    <Card className="h-32">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        {figure === null ? (
          <p className="text-label-sm text-muted-foreground">Nothing to show yet</p>
        ) : (
          <p className="text-headline-md">{figure}</p>
        )}
      </CardContent>
    </Card>
  );
}
