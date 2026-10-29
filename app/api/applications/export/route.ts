import { cookies } from "next/headers";
import { ApplicationError, applicationsFor } from "@/lib/applications";
import { exportFileName, jobFromParam, searchFromParam, stageFromParam } from "@/lib/application-view";
import { SESSION_COOKIE } from "@/lib/portal/config";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    const csv = await applicationsFor((await cookies()).get(SESSION_COOKIE)?.value).exportCsv({
      stage: stageFromParam(params.get("stage") ?? undefined),
      search: searchFromParam(params.get("q") ?? undefined),
      jobPostingId: jobFromParam(params.get("job") ?? undefined),
    });
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFileName(new Date())}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (!(error instanceof ApplicationError)) throw error;
    const status = { denied: 403, invalid: 401, unavailable: 503, validation: 400, "not-found": 404, conflict: 409 }[error.reason];
    return Response.json({ error: error.reason }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}
