-- Monthly salary bounds in PHP. NULL means that bound is unspecified.
ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS salary_from double precision
    CHECK (salary_from >= 0 AND salary_from < 'Infinity'::double precision),
  ADD COLUMN IF NOT EXISTS salary_to double precision
    CHECK (salary_to >= 0 AND salary_to < 'Infinity'::double precision);
ALTER TABLE public.job_templates
  ADD COLUMN IF NOT EXISTS salary_from double precision
    CHECK (salary_from >= 0 AND salary_from < 'Infinity'::double precision),
  ADD COLUMN IF NOT EXISTS salary_to double precision
    CHECK (salary_to >= 0 AND salary_to < 'Infinity'::double precision);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.job_postings'::regclass AND conname = 'job_postings_salary_range_check') THEN
    ALTER TABLE public.job_postings ADD CONSTRAINT job_postings_salary_range_check
      CHECK (salary_to >= salary_from);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.job_templates'::regclass AND conname = 'job_templates_salary_range_check') THEN
    ALTER TABLE public.job_templates ADD CONSTRAINT job_templates_salary_range_check
      CHECK (salary_to >= salary_from);
  END IF;
END $$;
