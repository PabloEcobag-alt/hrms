-- Past interview results may be recorded after the Application reaches a final Stage.
-- This permits activity only; moveStage still enforces the workflow transitions.
ALTER TABLE public.hrms_application_activity
  DROP CONSTRAINT hrms_application_activity_from_stage_check,
  DROP CONSTRAINT hrms_application_activity_to_stage_check,
  ADD CONSTRAINT hrms_application_activity_stages_check CHECK (
    (from_stage IN ('New', 'Screening', 'Interview', 'Offer')
      AND to_stage IN ('Screening', 'Interview', 'Offer', 'Hired', 'Rejected'))
    OR (from_stage = to_stage AND from_stage IN ('Hired', 'Rejected', 'Withdrawn'))
  );
