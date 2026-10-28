-- Mirrors the Careers-owned applications table (lib/careers/schema.ts).
-- Applicant identity is irrelevant to this read-only count fixture.
CREATE TABLE applications (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  applicant_id text NOT NULL,
  job_posting_id text NOT NULL,
  reference_number text NOT NULL UNIQUE,
  status text NOT NULL,
  profile_snapshot jsonb NOT NULL,
  documents_snapshot jsonb NOT NULL,
  consented_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (applicant_id, job_posting_id)
);
