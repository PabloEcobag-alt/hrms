-- Applicants HR adds by hand (walk-in or referral). HRMS-only: no Careers table is written.
-- Ids count down from -1 so they can never equal a Careers applications.id in the shared list.
CREATE TABLE IF NOT EXISTS public.hrms_manual_applications (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH -1 INCREMENT BY -1 MINVALUE -2147483648 MAXVALUE -1),
  full_name text NOT NULL CHECK (length(btrim(full_name)) > 0),
  email text NOT NULL CHECK (length(btrim(email)) > 0),
  mobile text NOT NULL CHECK (length(btrim(mobile)) > 0),
  address text NOT NULL CHECK (length(btrim(address)) > 0),
  job_posting_id text NOT NULL REFERENCES public.job_postings(id),
  expected_salary double precision NOT NULL CHECK (expected_salary >= 0),
  available_from date NOT NULL,
  added_by_name text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE UNIQUE INDEX IF NOT EXISTS hrms_manual_applications_posting_email
  ON public.hrms_manual_applications (job_posting_id, lower(email));

-- Careers-submitted and HR-added Applications as one list; the HR marker is not exposed here.
CREATE OR REPLACE VIEW public.hrms_all_applications AS
SELECT id, applicant_name, applicant_email, job_posting_id, job_posting_title, location, applied_at, stage
FROM public.hrms_careers_applications
UNION ALL
SELECT m.id, m.full_name, m.email, m.job_posting_id, j.title, j.location, m.applied_at, 'New'
FROM public.hrms_manual_applications m
JOIN public.job_postings j ON j.id = m.job_posting_id;
