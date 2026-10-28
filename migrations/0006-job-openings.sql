-- Shared Careers tables: NULL means the number of openings is unspecified.
ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS openings integer CHECK (openings > 0);
ALTER TABLE public.job_templates
  ADD COLUMN IF NOT EXISTS openings integer CHECK (openings > 0);
