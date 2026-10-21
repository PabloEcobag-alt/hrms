import { portalConfig } from "./config";

export type Staff = {
  name: string;
  username: string;
  email: string;
  role: string;
};

export type Validation =
  | { decision: "allowed"; staff: Staff }
  | { decision: "invalid" }
  | { decision: "denied" }
  | { decision: "unavailable" };

async function postJson(path: string, body: unknown): Promise<Response | null> {
  const { portalUrl, systemName, systemSecret } = portalConfig();

  try {
    return await fetch(`${portalUrl}${path}`, {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(`${systemName}:${systemSecret}`).toString("base64")}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

/**
 * Asks the Portal whether the handle may use a Module right now. The 200 body also carries
 * the Staff member's profile (`staff`), an addition proposed to the Portal's validate contract.
 * Anything other than a clear answer is `unavailable`, which never allows.
 */
export async function validateSession(sessionHandle: string, module: string): Promise<Validation> {
  const response = await postJson("/api/integrations/validate", {
    handle: sessionHandle,
    module,
  });

  if (!response) {
    return { decision: "unavailable" };
  }

  if (response.status === 401) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;

    return { decision: body?.error === "invalid_handle" ? "invalid" : "unavailable" };
  }

  if (response.status === 403) {
    return { decision: "denied" };
  }

  const body = response.ok
    ? ((await response.json().catch(() => null)) as { active?: boolean; staff?: Staff } | null)
    : null;

  return body?.active === true && body.staff
    ? { decision: "allowed", staff: body.staff }
    : { decision: "unavailable" };
}
