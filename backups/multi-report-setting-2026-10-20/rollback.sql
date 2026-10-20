-- Rollback for 20261020172158_honor_multi_report_setting_20261020.sql.
-- IMPORTANT: only run after setting reports.multiReport=false and confirming there are no duplicate
-- (project_id, quarter, annual_period) groups. The UNIQUE constraint cannot be restored otherwise.

DROP TRIGGER IF EXISTS enforce_report_period_uniqueness ON public.quarterly_reports;
DROP FUNCTION IF EXISTS private.enforce_report_period_uniqueness();
DROP INDEX IF EXISTS public.idx_reports_project_period;

DO $block$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.quarterly_reports
    GROUP BY project_id, quarter, annual_period
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot restore the one-report-per-period constraint: duplicate reports exist.';
  END IF;
END;
$block$;

ALTER TABLE public.quarterly_reports
  ADD CONSTRAINT quarterly_reports_project_id_quarter_annual_period_key
  UNIQUE (project_id, quarter, annual_period);
