import { cookies } from "next/headers";
import { jobTemplatesFor } from "../job-postings";
import { SESSION_COOKIE } from "./config";

/** Job Templates for the Staff member making this request. */
export async function templatesForRequest() {
  return jobTemplatesFor((await cookies()).get(SESSION_COOKIE)?.value);
}
