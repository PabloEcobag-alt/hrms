import type { Staff, Validation } from "./client";
import { DEV_STAFF, devBypassEnabled } from "./dev-bypass";
import { MODULES } from "@/lib/modules";

export type Overview =
  | { decision: "allowed"; staff: Staff; pages: string[] }
  | { decision: "denied" }
  | { decision: "invalid" }
  | { decision: "unavailable" };

/**
 * Access for one page load. Only the dev-bypass answers for now; the Portal's answers
 * arrive with sign-in, and until then HRMS denies rather than guesses.
 */
export function accessFor(
  { bypass = devBypassEnabled() }: { bypass?: boolean } = {},
) {
  // The Module only matters once the Portal answers per Module.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function check(_module: string): Promise<Validation> {
    return Promise.resolve(
      bypass ? { decision: "allowed", staff: DEV_STAFF } : { decision: "unavailable" },
    );
  }

  /** Every Module at once: who the Staff member is and which pages they may open. */
  async function overview(): Promise<Overview> {
    const results = await Promise.all(MODULES.map((m) => check(m.name)));
    for (const blocker of ["unavailable", "invalid"] as const) {
      if (results.some((result) => result.decision === blocker)) {
        return { decision: blocker };
      }
    }

    const allowed = results.flatMap((result, i) =>
      result.decision === "allowed" ? [{ staff: result.staff, href: MODULES[i].href }] : [],
    );

    return allowed.length === 0
      ? { decision: "denied" }
      : { decision: "allowed", staff: allowed[0].staff, pages: allowed.map((a) => a.href) };
  }

  return { check, overview };
}
