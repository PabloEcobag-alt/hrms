export const SESSION_COOKIE = "hrms_session";
export const HANDOFF_COOKIE = "hrms_handoff";
export const CALLBACK_PATH = "/api/portal/callback";
export const LOGIN_PATH = "/api/portal/login";
export const LOGOUT_PATH = "/api/portal/logout";
export const NO_ACCESS_PATH = "/no-access";
export const UNAVAILABLE_PATH = "/unavailable";

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set; see .env.example`);
  }

  return value;
}

export function portalConfig() {
  const appUrl = (process.env.HRMS_APP_URL ?? "http://localhost:3001").replace(/\/$/, "");
  const portalUrl = required("PORTAL_URL").replace(/\/$/, "");

  return {
    portalUrl,
    systemName: process.env.PORTAL_SYSTEM_NAME ?? "HRMS",
    systemSecret: required("PORTAL_SYSTEM_SECRET"),
    logoutUrl: `${portalUrl}/logout`,
    callbackUrl: `${appUrl}${CALLBACK_PATH}`,
  };
}
