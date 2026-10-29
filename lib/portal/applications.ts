import { cookies } from "next/headers";
import { applicationsFor } from "../applications";
import { SESSION_COOKIE } from "./config";

/** Applications for the Staff member making this request. */
export async function applicationsForRequest() {
  return applicationsFor((await cookies()).get(SESSION_COOKIE)?.value);
}
