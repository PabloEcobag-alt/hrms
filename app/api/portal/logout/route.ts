import { NextResponse } from "next/server";
import { devBypassEnabled } from "@/lib/portal/dev-bypass";
import { SESSION_COOKIE, portalConfig } from "@/lib/portal/config";

/**
 * Sends the browser to the Portal's logout, which ends the one central session for every
 * System in this browser and lands on the Portal login. POST so a link or image cannot sign
 * someone out. The Portal's logout address is proposed, not yet part of its handoff contract.
 */
export function POST() {
  // With the dev bypass there is no Portal session to end.
  const response = devBypassEnabled()
    ? new NextResponse(null, { status: 303, headers: { location: "/" } })
    : NextResponse.redirect(portalConfig().logoutUrl, 303);
  response.cookies.delete(SESSION_COOKIE);

  return response;
}
