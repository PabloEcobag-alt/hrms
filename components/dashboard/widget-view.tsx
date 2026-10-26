import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Widget } from "@/lib/dashboard";

export function WidgetView({ name, href, purpose }: Widget) {
  return (
    <Card className="transition-colors hover:border-primary/40 focus-within:border-primary/40">
      <CardHeader>
        <CardTitle className="text-body-md">
          <Link
            href={href}
            className="flex items-center justify-between gap-sm rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {name}
            <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
          </Link>
        </CardTitle>
        <CardDescription>{purpose}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-label-sm text-muted-foreground">Nothing to show yet.</p>
      </CardContent>
    </Card>
  );
}
