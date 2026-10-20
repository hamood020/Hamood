-- Regression test for reports.multiReport. Safe to run against a non-empty test database.
-- The second insert and its temporary setting change are rolled back by a deliberate exception.
DO $test$
DECLARE
  v_project uuid;
  v_quarter text;
  v_year text;
  v_status text;
  v_submitted timestamptz;
  v_notes text;
  v_data jsonb;
  v_creator uuid;
  v_blocked boolean := false;
  v_allowed boolean := false;
BEGIN
  SELECT project_id, quarter, annual_period, status, submitted_at, notes, report_data, created_by
    INTO v_project, v_quarter, v_year, v_status, v_submitted, v_notes, v_data, v_creator
  FROM public.quarterly_reports
  LIMIT 1;
  IF v_project IS NULL THEN
    RAISE EXCEPTION 'No report exists to run the multi-report guard test.';
  END IF;

  BEGIN
    INSERT INTO public.quarterly_reports(project_id, quarter, annual_period, status, submitted_at, notes, report_data, created_by)
    VALUES (v_project, v_quarter, v_year, v_status, v_submitted, v_notes, v_data, v_creator);
  EXCEPTION WHEN unique_violation THEN
    v_blocked := true;
  END;
  IF NOT v_blocked THEN
    RAISE EXCEPTION 'Guard test failed: duplicate was not blocked while multiReport=false.';
  END IF;

  BEGIN
    UPDATE public.platform_settings
      SET settings = jsonb_set(settings, '{reports,multiReport}', 'true'::jsonb, true),
          updated_at = now()
      WHERE id = 'global';
    INSERT INTO public.quarterly_reports(project_id, quarter, annual_period, status, submitted_at, notes, report_data, created_by)
    VALUES (v_project, v_quarter, v_year, v_status, v_submitted, v_notes, v_data, v_creator);
    v_allowed := true;
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'ROLLBACK_TEST_ONLY';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM <> 'ROLLBACK_TEST_ONLY' THEN RAISE; END IF;
  END;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Guard test failed: duplicate was not allowed while multiReport=true.';
  END IF;
END;
$test$;
