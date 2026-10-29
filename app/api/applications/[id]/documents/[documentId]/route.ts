import { cookies } from "next/headers";
import { ApplicationError, applicationsFor } from "@/lib/applications";
import { SESSION_COOKIE } from "@/lib/portal/config";

export async function GET(_request: Request, { params }: {
  params: Promise<{ id: string; documentId: string }>;
}) {
  const { id, documentId } = await params;
  try {
    return await applicationsFor((await cookies()).get(SESSION_COOKIE)?.value)
      .downloadDocument(Number(id), Number(documentId));
  } catch (error) {
    if (!(error instanceof ApplicationError)) throw error;
    const status = { denied: 403, invalid: 401, unavailable: 503, validation: 400, "not-found": 404 }[error.reason];
    return Response.json({ error: error.reason }, { status, headers: { "Cache-Control": "private, no-store" } });
  }
}
