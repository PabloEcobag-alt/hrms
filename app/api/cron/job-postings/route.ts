import { closeExpiredJobPostings, retryJobPostingAnnouncements } from "@/lib/job-postings";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  await closeExpiredJobPostings();
  await retryJobPostingAnnouncements();
  return Response.json({ ok: true });
}
