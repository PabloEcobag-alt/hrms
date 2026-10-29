-- HR-added Applications (negative ids, hrms_manual_applications) get the same workflow as Careers ones.
-- They carry their own Stage; the HRMS workflow tables must accept their ids, so the foreign keys to
-- Careers' applications table go. Nothing is written to a Careers table.
ALTER TABLE public.hrms_manual_applications
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'New'
    CHECK (status IN ('New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected')),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT clock_timestamp();

ALTER TABLE public.hrms_application_stage_history DROP CONSTRAINT IF EXISTS hrms_application_stage_history_application_id_fkey;
ALTER TABLE public.hrms_application_activity DROP CONSTRAINT IF EXISTS hrms_application_activity_application_id_fkey;
ALTER TABLE public.hrms_application_interviews DROP CONSTRAINT IF EXISTS hrms_application_interviews_application_id_fkey;
ALTER TABLE public.hrms_application_notes DROP CONSTRAINT IF EXISTS hrms_application_notes_application_id_fkey;

CREATE OR REPLACE VIEW public.hrms_all_applications AS
SELECT id, applicant_name, applicant_email, job_posting_id, job_posting_title, location, applied_at, stage
FROM public.hrms_careers_applications
UNION ALL
SELECT m.id, m.full_name, m.email, m.job_posting_id, j.title, j.location, m.applied_at, m.status
FROM public.hrms_manual_applications m
JOIN public.job_postings j ON j.id = m.job_posting_id;
