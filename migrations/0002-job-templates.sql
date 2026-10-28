CREATE TABLE public.job_templates (
  id text PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  employment_type text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  requirements text NOT NULL DEFAULT '',
  required_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  screening_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
