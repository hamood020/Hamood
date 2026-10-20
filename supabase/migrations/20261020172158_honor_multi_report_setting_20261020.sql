-- Applied to Supabase project bmwtrnosqosbkezdswcx on 2026-10-20.
-- Honors platform_settings.reports.multiReport while retaining duplicate protection when disabled.

ALTER TABLE public.quarterly_reports
  DROP CONSTRAINT IF EXISTS quarterly_reports_project_id_quarter_annual_period_key;

CREATE INDEX IF NOT EXISTS idx_reports_project_period
  ON public.quarterly_reports (project_id, annual_period, quarter);

CREATE OR REPLACE FUNCTION private.enforce_report_period_uniqueness()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_multi_report boolean;
  v_key text;
BEGIN
  SELECT coalesce((settings->'reports'->>'multiReport')::boolean, false)
    INTO v_multi_report
  FROM public.platform_settings
  WHERE id = 'global';

  IF coalesce(v_multi_report, false) THEN
    RETURN NEW;
  END IF;

  v_key := NEW.project_id::text || ':' || coalesce(NEW.annual_period, '') || ':' || coalesce(NEW.quarter, '');
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_key, 0));

  IF EXISTS (
    SELECT 1
    FROM public.quarterly_reports q
    WHERE q.project_id = NEW.project_id
      AND q.annual_period IS NOT DISTINCT FROM NEW.annual_period
      AND q.quarter IS NOT DISTINCT FROM NEW.quarter
      AND q.id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'A report already exists for this project, quarter, and year while multi-report mode is disabled.'
      USING ERRCODE = '23505',
            CONSTRAINT = 'quarterly_reports_project_id_quarter_annual_period_key';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_report_period_uniqueness ON public.quarterly_reports;
CREATE TRIGGER enforce_report_period_uniqueness
  BEFORE INSERT OR UPDATE OF project_id, annual_period, quarter
  ON public.quarterly_reports
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_report_period_uniqueness();
