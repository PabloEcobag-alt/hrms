-- Existing Job Templates start with empty lists; copied Job Postings own their values.
ALTER TABLE public.job_templates
  ADD COLUMN IF NOT EXISTS responsibilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS benefits jsonb NOT NULL DEFAULT '[]'::jsonb;
