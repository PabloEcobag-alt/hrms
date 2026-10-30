import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KeySummaryCard as KeySummaryCardData } from "@/lib/dashboard";

export function KeySummaryCard({ label, figure, caption, comparison }: KeySummaryCardData) {
  return (
    <Card className="h-32">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent>
        {figure === null ? (
          <p className="text-label-sm text-muted-foreground">Nothing to show yet</p>
        ) : (
          <>
            <p className="text-headline-md">{figure}</p>
            {caption && (
              <p
                className={cn(
                  "flex items-center gap-1 text-label-sm",
                  comparison?.tone === "good" ? "text-green-600" : comparison?.tone === "bad" ? "text-red-600" : "text-muted-foreground",
                )}
              >
                {comparison?.arrow === "up" && <ArrowUp className="size-3" aria-hidden />}
                {comparison?.arrow === "down" && <ArrowDown className="size-3" aria-hidden />}
                {caption}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
