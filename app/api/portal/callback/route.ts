import { NextResponse, type NextRequest } from "next/server";
import { exchangeCode } from "@/lib/portal/client";
import { HANDOFF_COOKIE, CALLBACK_PATH, SESSION_COOKIE } from "@/lib/portal/config";
import { safeReturnTo } from "@/lib/portal/return-to";

export const dynamic = "force-dynamic";

type Handoff = { state: string; verifier: string; returnTo: string };

function readHandoff(request: NextRequest): Handoff | null {
  try {
    const parsed = JSON.parse(request.cookies.get(HANDOFF_COOKIE)?.value ?? "");

    return typeof parsed?.state === "string" && typeof parsed?.verifier === "string"
      ? { state: parsed.state, verifier: parsed.verifier, returnTo: safeReturnTo(parsed.returnTo) }
      : null;
  } catch {
    return null;
  }
}

function failed(request: NextRequest, reason: "denied" | "failed" | "unavailable") {
  const response = NextResponse.redirect(new URL(`/sign-in-error?reason=${reason}`, request.url));
  response.cookies.delete({ name: HANDOFF_COOKIE, path: CALLBACK_PATH });

  return response;
}

/** Finishes the handoff: exchanges the single-use code and keeps only the opaque handle. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const handoff = readHandoff(request);

  if (params.get("error") === "access_denied") {
    return failed(request, "denied");
  }

  const code = params.get("code");
  const state = params.get("state");

  if (!handoff || !code || !state || state !== handoff.state) {
    return failed(request, "failed");
  }

  const exchanged = await exchangeCode({ code, state, codeVerifier: handoff.verifier });

  if (!exchanged.ok) {
    return failed(request, exchanged.reason === "rejected" ? "failed" : exchanged.reason);
  }

  const response = NextResponse.redirect(new URL(handoff.returnTo, request.url));
  response.cookies.delete({ name: HANDOFF_COOKIE, path: CALLBACK_PATH });
  response.cookies.set(SESSION_COOKIE, exchanged.sessionHandle, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: exchanged.expiresAt,
  });

  return response;
}
