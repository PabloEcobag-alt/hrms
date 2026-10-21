import type { Staff } from "@/lib/portal/client";

/**
 * A small stand-in for the Portal's validate contract: one handle per signed-in Staff
 * member, the Modules each holds, and the failure modes HRMS must survive.
 * It knows nothing about HRMS internals.
 */
export const FAKE_PORTAL_URL = "https://portal.test";
export const FAKE_SYSTEM = "HRMS";
export const FAKE_SECRET = "fake-system-secret-fake-system-secret";

export class FakePortal {
  private handles = new Map<string, { staff: Staff; modules: Set<string> }>();
  private nextHandle = 1;

  /** The Portal cannot decide: it answers 503 until restored. */
  unavailable = false;

  /** Signs a Staff member in and returns their opaque session handle. */
  signIn(staff: Staff, modules: string[]): string {
    const handle = `handle-${this.nextHandle++}`;
    this.handles.set(handle, { staff, modules: new Set(modules) });

    return handle;
  }

  /** The session ends (central logout or expiry); the handle stops validating. */
  endSession(handle: string) {
    this.handles.delete(handle);
  }

  private async validate(request: Request): Promise<Response> {
    const expected = `Basic ${Buffer.from(`${FAKE_SYSTEM}:${FAKE_SECRET}`).toString("base64")}`;

    if (request.headers.get("authorization") !== expected) {
      return Response.json({ error: "invalid_client" }, { status: 401 });
    }

    const body = await request.json();

    if (this.unavailable) {
      return Response.json({ error: "temporarily_unavailable" }, { status: 503 });
    }

    const session = this.handles.get(body.handle);

    if (!session) {
      return Response.json({ error: "invalid_handle" }, { status: 401 });
    }

    if (!session.modules.has(body.module)) {
      return Response.json({ error: "module_not_granted" }, { status: 403 });
    }

    return Response.json({ active: true, system: FAKE_SYSTEM, module: body.module, staff: session.staff });
  }

  handle = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);

    if (url.pathname === "/api/integrations/validate") return this.validate(request);

    return new Response("not found", { status: 404 });
  };
}

/** Routes fetches aimed at the fake Portal to it; everything else is refused. */
export function portalFetch(portal: FakePortal): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);

    if (!request.url.startsWith(FAKE_PORTAL_URL)) {
      throw new Error(`Unexpected outbound request to ${request.url}`);
    }

    return portal.handle(request);
  }) as typeof fetch;
}
