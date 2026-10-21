import { validateSession, type Staff, type Validation } from "./client";
import { DEV_STAFF, devBypassEnabled } from "./dev-bypass";
import { MODULES } from "@/lib/modules";

export type Overview =
  | { decision: "allowed"; staff: Staff; pages: string[] }
  | { decision: "denied" }
  | { decision: "invalid" }
  | { decision: "unavailable" };

/**
 * Access for one page load. The Portal is asked once per Module and the answer is
 * reused for the rest of the load; nothing is remembered beyond it.
 */
export function accessFor(
  sessionHandle: string | undefined,
  { bypass = devBypassEnabled() }: { bypass?: boolean } = {},
) {
  const answers = new Map<string, Promise<Validation>>();

  function check(module: string): Promise<Validation> {
    if (bypass) {
      return Promise.resolve({ decision: "allowed", staff: DEV_STAFF });
    }

    if (!sessionHandle) {
      return Promise.resolve({ decision: "invalid" });
    }

    let answer = answers.get(module);

    if (!answer) {
      answer = validateSession(sessionHandle, module);
      answers.set(module, answer);
    }

    return answer;
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
