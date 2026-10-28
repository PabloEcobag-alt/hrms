-- Historical postings retain NULL; only a successful first publish records a value.
ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS first_published_at timestamptz;
