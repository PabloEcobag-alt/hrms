import { LOGIN_PATH } from "./config";

/** Only a local HRMS page may be returned to, never an arbitrary address or a sign-in route. */
export function safeReturnTo(value: string | null | undefined): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\u0000-\u001f\\]/.test(value) ||
    value === LOGIN_PATH ||
    value.startsWith(`${LOGIN_PATH}?`)
  ) {
    return "/";
  }

  return value;
}
