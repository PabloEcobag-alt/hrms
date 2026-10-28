CREATE TABLE IF NOT EXISTS public.job_templates (
  id text PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  employment_type text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  requirements text NOT NULL DEFAULT '',
  required_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  screening_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Careers may already have provisioned this table with a legacy status column.
-- Retain its rows and columns; HRMS templates expose content only.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'job_templates' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.job_templates ALTER COLUMN status SET DEFAULT 'draft';
  END IF;
END $$;
