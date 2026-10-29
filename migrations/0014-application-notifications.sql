CREATE TABLE IF NOT EXISTS public.hrms_application_notifications (
  id text PRIMARY KEY,
  payload jsonb NOT NULL,
  delivered_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hrms_application_notifications_due_idx
  ON public.hrms_application_notifications(next_attempt_at, id) WHERE delivered_at IS NULL;
