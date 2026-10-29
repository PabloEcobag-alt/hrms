CREATE TABLE public.hrms_application_interviews (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  application_id integer NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  type text NOT NULL CHECK (type IN ('Online', 'In person')),
  interviewer_name text NOT NULL CHECK (btrim(interviewer_name) <> ''),
  location text NOT NULL CHECK (btrim(location) <> '')
);
CREATE INDEX hrms_application_interviews_application ON public.hrms_application_interviews (application_id);
ALTER TABLE public.hrms_application_activity ADD COLUMN interview_id bigint
  REFERENCES public.hrms_application_interviews(id);
