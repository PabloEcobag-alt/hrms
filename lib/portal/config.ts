export const SESSION_COOKIE = "hrms_session";
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
  return {
    portalUrl: required("PORTAL_URL").replace(/\/$/, ""),
    systemName: process.env.PORTAL_SYSTEM_NAME ?? "HRMS",
    systemSecret: required("PORTAL_SYSTEM_SECRET"),
  };
}
