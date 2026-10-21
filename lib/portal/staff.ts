import { cache } from "react";
import { connection } from "next/server";
import { accessFor } from "./access";
import type { Staff } from "./client";

/** One access checker per page load, so the Portal is asked once however many callers there are. */
const requestAccess = cache(() => accessFor());

/** The Staff member and the pages they may open, for the shell. */
export async function getShell(): Promise<{ staff: Staff; permittedPages: string[] }> {
  // Access is per request, never decided at build time.
  await connection();
  const result = await requestAccess().overview();

  if (result.decision !== "allowed") {
    // Sign-in through the Portal is not built yet; only the dev-bypass can open HRMS.
    throw new Error("HRMS cannot open without the Portal; set HRMS_DEV_BYPASS=true locally");
  }

  return { staff: result.staff, permittedPages: result.pages };
}
