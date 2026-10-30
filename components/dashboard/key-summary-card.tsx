import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KeySummaryCard as KeySummaryCardData } from "@/lib/dashboard";

/** One fixed height with or without data, so the Dashboard does not jump while it loads. */
export const KEY_SUMMARY_CARD_HEIGHT = "h-32";

export function KeySummaryCard({ label, figure, caption, comparison }: KeySummaryCardData) {
  return (
    <Card className={KEY_SUMMARY_CARD_HEIGHT}>
      <CardHeader className="px-5 pb-0 pt-4">
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-4 pt-1">
        {figure === null ? (
          <p className="text-label-sm text-muted-foreground">Nothing to show yet</p>
        ) : (
          <>
            <p className="text-headline-md">{figure}</p>
            {caption && <p className="text-label-sm text-muted-foreground">{caption}</p>}
            {comparison && (
              <p
                className={cn(
                  "flex items-center gap-1 text-label-sm",
                  comparison.tone === "good" ? "text-green-600" : comparison.tone === "bad" ? "text-red-600" : "text-muted-foreground",
                )}
              >
                {comparison.arrow === "up" && <ArrowUp className="size-3" aria-hidden />}
                {comparison.arrow === "down" && <ArrowDown className="size-3" aria-hidden />}
                {comparison.text}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
