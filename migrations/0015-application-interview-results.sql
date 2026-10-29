-- HRMS-owned fields; Careers never reads interview scores or results.
ALTER TABLE public.hrms_application_interviews
  ADD COLUMN score integer CHECK (score BETWEEN 1 AND 5),
  ADD COLUMN result text CHECK (result IN ('Passed', 'Not passed'));
