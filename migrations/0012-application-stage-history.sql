-- HRMS owns workflow history; Careers continues to own applications and snapshots.
CREATE TABLE public.hrms_application_stage_history (
  application_id integer NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('Screening', 'Interview', 'Offer', 'Hired', 'Rejected')),
  reached_at timestamptz NOT NULL,
  PRIMARY KEY (application_id, stage)
);

CREATE TABLE public.hrms_application_activity (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  application_id integer NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  from_stage text NOT NULL CHECK (from_stage IN ('New', 'Screening', 'Interview', 'Offer')),
  to_stage text NOT NULL CHECK (to_stage IN ('Screening', 'Interview', 'Offer', 'Hired', 'Rejected')),
  actor_name text NOT NULL,
  reason text,
  occurred_at timestamptz NOT NULL
);
CREATE INDEX hrms_application_activity_timeline
  ON public.hrms_application_activity (application_id, occurred_at DESC, id DESC);
