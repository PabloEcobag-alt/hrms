import { NextResponse, type NextRequest } from "next/server";
import { devBypassEnabled } from "@/lib/portal/dev-bypass";
import { HANDOFF_COOKIE, CALLBACK_PATH, portalConfig } from "@/lib/portal/config";
import { challengeFor, newState, newVerifier } from "@/lib/portal/pkce";
import { safeReturnTo } from "@/lib/portal/return-to";

/** Starts the handoff: remembers the page asked for and sends the browser to the Portal. */
export function GET(request: NextRequest) {
  // Reading the request first keeps this route dynamic, so the build never runs it without a Portal configured.
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));

  // With the dev bypass there is no Portal to sign in through.
  if (devBypassEnabled()) {
    return NextResponse.redirect(new URL(returnTo, request.url));
  }

  const { portalUrl, systemName, callbackUrl } = portalConfig();
  const state = newState();
  const verifier = newVerifier();

  const authorize = new URL(`${portalUrl}/api/integrations/authorize`);
  authorize.searchParams.set("system", systemName);
  authorize.searchParams.set("redirect_uri", callbackUrl);
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("code_challenge", challengeFor(verifier));
  authorize.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorize);
  response.cookies.set(HANDOFF_COOKIE, JSON.stringify({ state, verifier, returnTo }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: CALLBACK_PATH,
    maxAge: 600,
  });

  return response;
}
