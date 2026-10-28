-- announced_at and Applicant preferences are owned and provisioned by Careers.
CREATE TABLE IF NOT EXISTS public.hrms_posting_announcements (
  posting_id text PRIMARY KEY,
  audit_id text NOT NULL,
  title text NOT NULL,
  audience_ready boolean NOT NULL DEFAULT false,
  completed_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.hrms_announcement_deliveries (
  id text PRIMARY KEY,
  posting_id text NOT NULL REFERENCES public.hrms_posting_announcements(posting_id),
  path text NOT NULL,
  payload jsonb NOT NULL,
  delivered_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hrms_announcement_due_idx
  ON public.hrms_announcement_deliveries(next_attempt_at, id) WHERE delivered_at IS NULL;
