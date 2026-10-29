CREATE TABLE IF NOT EXISTS public.hrms_application_notes (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  application_id integer NOT NULL REFERENCES public.applications(id),
  text text NOT NULL CHECK (length(btrim(text)) > 0),
  author_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS hrms_application_notes_application_idx
  ON public.hrms_application_notes (application_id, created_at DESC, id DESC);
