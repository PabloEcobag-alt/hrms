ALTER TABLE public.job_postings ALTER COLUMN deadline DROP NOT NULL;
-- Status is text in Careers, rather than a Postgres enum. Include Draft while
-- preserving the existing lowercase values and all existing records.
ALTER TABLE public.job_postings ADD CONSTRAINT job_postings_status_check
  CHECK (status IN ('draft', 'open', 'closed', 'filled'));
