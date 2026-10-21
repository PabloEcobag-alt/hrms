import type { Staff } from "./client";

// URL.hostname keeps the brackets on IPv6 literals.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export const DEV_STAFF: Staff = {
  name: "Dev Staff",
  username: "dev.staff",
  email: "dev.staff@localhost",
  role: "Development",
};

/**
 * Whether the opt-in local bypass (`HRMS_DEV_BYPASS=true`) is on. Throws instead of
 * returning when it is on in production or with a deployed origin configured, so a
 * misconfigured deployment fails to start rather than opening HRMS to the public.
 */
export function devBypassEnabled(env: Record<string, string | undefined> = process.env): boolean {
  if (env.HRMS_DEV_BYPASS !== "true") {
    return false;
  }

  if (env.NODE_ENV === "production") {
    throw new Error("HRMS_DEV_BYPASS must not be set in production");
  }

  if (env.VERCEL_ENV || env.VERCEL_URL) {
    throw new Error("HRMS_DEV_BYPASS must not be set on a Vercel deployment");
  }

  const appUrl = env.HRMS_APP_URL;

  if (appUrl && !LOCAL_HOSTS.has(new URL(appUrl).hostname)) {
    throw new Error(`HRMS_DEV_BYPASS must not be set with a non-localhost HRMS_APP_URL (${appUrl})`);
  }

  return true;
}
