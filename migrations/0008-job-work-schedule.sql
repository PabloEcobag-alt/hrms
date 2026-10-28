ALTER TABLE public.job_postings ADD COLUMN IF NOT EXISTS work_schedule text;
ALTER TABLE public.job_templates ADD COLUMN IF NOT EXISTS work_schedule text;
