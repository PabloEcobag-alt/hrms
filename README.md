This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Recruitment audit delivery

Run `npm run db:migrate` before deploying recruitment changes. Migration 0003 adds
`hrms_audit_outbox`; each successful Staff mutation commits its Audit Event with
its data change. Set server-only `API_GATEWAY_URL` and `API_GATEWAY_KEY` to the
HRMS Caller (with audit write access for HRMS). Delivery uses `/audit/events`.
The existing authenticated `/api/cron/job-postings` maintenance route retries up
to 50 due events per invocation. Failures are logged without payloads or credentials
and retained with a delay of 1–60 minutes; configure `CRON_SECRET` and monitor logs
and the outbox backlog. Gateway retries reuse the event's idempotency key.

The audit-logs deployment must register `job_posting.created`,
`job_posting.published`, `job_posting.updated`, `job_posting.closed`,
`job_posting.filled`, `job_template.created`, `job_template.updated`, and
`job_template.deleted` for Source HRMS. An older catalog rejects these requests;
they remain queued until that service is updated. Draft deletion, views and
scheduled deadline closure do not emit Staff action events. Applicant notification
delivery is a separate part of parent ticket #28. Publication events explicitly
record `applicants_notified: false` until that integration supplies a delivery result.
