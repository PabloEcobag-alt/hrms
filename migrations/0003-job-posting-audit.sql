CREATE TABLE IF NOT EXISTS public.hrms_audit_outbox (
  id text PRIMARY KEY,
  payload jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hrms_audit_outbox_due_idx ON public.hrms_audit_outbox (next_attempt_at, id);
