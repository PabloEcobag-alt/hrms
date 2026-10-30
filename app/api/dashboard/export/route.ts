import { cookies } from "next/headers";
import { cardRowsFor, dashboardRange, exportFileName, hiringCardsCsv } from "@/lib/dashboard";
import { dashboardSummaryFor } from "@/lib/dashboard-data";
import { accessFor } from "@/lib/portal/access";
import { SESSION_COOKIE } from "@/lib/portal/config";

const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const access = await accessFor((await cookies()).get(SESSION_COOKIE)?.value).check("Recruitment and Hiring");
  if (access.decision !== "allowed") {
    const status = { denied: 403, invalid: 401, unavailable: 503 }[access.decision];
    return Response.json({ error: access.decision }, { status, headers: NO_STORE });
  }

  const params = new URL(request.url).searchParams;
  const now = new Date();
  const range = dashboardRange(params.get("range"), now, { from: params.get("from"), to: params.get("to") });
  const pages = ["/job-postings"];
  const hiringCards = cardRowsFor(pages, await dashboardSummaryFor(pages, range, now), range).flat();
  return new Response(hiringCardsCsv(hiringCards), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportFileName(range)}"`,
      ...NO_STORE,
    },
  });
}
