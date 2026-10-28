-- HRMS owns this read projection, never the underlying Careers tables.
-- Use the Application snapshot name so Frozen Applications retain what HR reviewed.
CREATE OR REPLACE VIEW public.hrms_careers_applications AS
SELECT a.id,
       a.profile_snapshot->>'fullName' AS applicant_name,
       p.email AS applicant_email,
       a.job_posting_id,
       j.title AS job_posting_title,
       j.location,
       a.created_at AS applied_at,
       CASE WHEN a.status = 'Received' THEN 'New' ELSE a.status END AS stage
FROM public.applications a
JOIN public.applicant_profiles p ON p.applicant_id = a.applicant_id
JOIN public.job_postings j ON j.id = a.job_posting_id;
