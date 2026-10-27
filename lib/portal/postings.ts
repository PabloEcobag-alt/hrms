import { cookies } from "next/headers";
import { jobPostingsFor } from "../job-postings";
import { SESSION_COOKIE } from "./config";

/** Job Postings for the Staff member making this request. */
export async function postingsForRequest() {
  return jobPostingsFor((await cookies()).get(SESSION_COOKIE)?.value);
}
