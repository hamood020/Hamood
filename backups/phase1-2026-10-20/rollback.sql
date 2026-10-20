-- Phase 1 rollback — returns the database to its state before
-- supabase/migrations/20261020120000_phase1_roles_metrics_security.sql
-- Needs schema backup_20261020_phase1 created by backup.sql just before the migration.
-- Restore the previous frontend at the same time (the old pages write metrics to projects).
-- Section-head accounts become specialists (editor) because the old role list has no section head.

BEGIN;

-- Daily jobs
SELECT cron.unschedule(jobname) FROM cron.job
WHERE jobname IN ('icv-audit-retention', 'icv-daily-notifications');

-- New triggers, table and functions
DROP TRIGGER IF EXISTS notify_report_status ON public.quarterly_reports;
DROP TRIGGER IF EXISTS lock_approved_reports ON public.quarterly_reports;
DROP TRIGGER IF EXISTS recompute_project_metrics ON public.quarterly_reports;
DROP TRIGGER IF EXISTS recompute_on_value_change ON public.projects;
DROP TRIGGER IF EXISTS recompute_on_settings_change ON public.platform_settings;
DROP TABLE IF EXISTS public.notifications;
DROP FUNCTION IF EXISTS private.generate_notifications();
DROP FUNCTION IF EXISTS private.trg_report_status_notify();
DROP FUNCTION IF EXISTS private.purge_audit_log();
DROP FUNCTION IF EXISTS private.trg_lock_approved_reports();
DROP FUNCTION IF EXISTS private.trg_reports_recompute();
DROP FUNCTION IF EXISTS private.trg_project_value_recompute();
DROP FUNCTION IF EXISTS private.trg_settings_recompute();
DROP FUNCTION IF EXISTS private.recompute_project_metrics(uuid);
DROP FUNCTION IF EXISTS private.pct_setting(jsonb, text, numeric);
DROP FUNCTION IF EXISTS private.num(jsonb, text);
DROP INDEX IF EXISTS public.audit_log_merge_idx;
DROP INDEX IF EXISTS public.audit_log_changed_at_idx;

-- Policies: drop every current policy on public/storage, then recreate the saved set.
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname IN ('public', 'storage') LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- Functions: put back every saved definition (this also restores the 6-argument guarded function).
DO $$
DECLARE f record;
BEGIN
  FOR f IN SELECT definition FROM backup_20261020_phase1.function_defs LOOP
    EXECUTE f.definition;
  END LOOP;
END $$;
-- The old 6-argument function was callable by the database owner only.
REVOKE ALL ON FUNCTION public.admin_update_user_profile_guarded(uuid, text, text, boolean, timestamptz, timestamptz)
  FROM PUBLIC, anon, authenticated, service_role;
DROP FUNCTION IF EXISTS private.audit_ignored_keys(text);
DROP FUNCTION IF EXISTS private.has_valid_role(text[]);

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT * FROM backup_20261020_phase1.policy_defs LOOP
    EXECUTE format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s',
      p.policyname, p.schemaname, p.tablename, p.permissive, p.cmd,
      (SELECT string_agg(quote_ident(r), ', ') FROM unnest(p.roles) r),
      CASE WHEN p.qual IS NOT NULL THEN ' USING (' || p.qual || ')' ELSE '' END,
      CASE WHEN p.with_check IS NOT NULL THEN ' WITH CHECK (' || p.with_check || ')' ELSE '' END);
  END LOOP;
END $$;

-- Roles and profile rules
UPDATE public.user_profiles SET role = 'editor' WHERE role = 'section_head';
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_temporary_viewer_expiry_check;
ALTER TABLE public.user_profiles DROP CONSTRAINT user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role = ANY (ARRAY['admin'::text, 'editor'::text, 'viewer'::text, 'temporary_viewer'::text]));
ALTER TABLE public.user_profiles ALTER COLUMN is_active SET DEFAULT true;
GRANT INSERT, DELETE ON public.user_profiles TO authenticated;

-- Notes/tasks status rule
ALTER TABLE public.employee_followups DROP CONSTRAINT IF EXISTS employee_followups_status_check;

-- Project grants and metric values
REVOKE UPDATE ON public.projects FROM authenticated;  -- clears the column-level grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
UPDATE public.projects p SET
  actual_omani_salary = b.actual_omani_salary, local_content_omani = b.local_content_omani,
  actual_non_omani_salary = b.actual_non_omani_salary, local_content_non_omani = b.local_content_non_omani,
  actual_made_in_oman = b.actual_made_in_oman, local_content_made_in_oman = b.local_content_made_in_oman,
  actual_local_supplier = b.actual_local_supplier, local_content_local_supplier = b.local_content_local_supplier,
  actual_direct_import = b.actual_direct_import, local_content_direct_import = b.local_content_direct_import,
  actual_sme_supplier = b.actual_sme_supplier, local_content_sme_supplier = b.local_content_sme_supplier,
  actual_local_service = b.actual_local_service, local_content_local_service = b.local_content_local_service,
  actual_foreign_service = b.actual_foreign_service, local_content_foreign_service = b.local_content_foreign_service,
  actual_sme_service = b.actual_sme_service, local_content_sme_service = b.local_content_sme_service,
  current_omani = b.current_omani, non_omani = b.non_omani,
  total_spend = b.total_spend, total_local_content = b.total_local_content,
  local_content_spend_pct = b.local_content_spend_pct, local_content_project_pct = b.local_content_project_pct,
  omanization_pct = b.omanization_pct, sme_pct = b.sme_pct,
  sme_10_status = b.sme_10_status, made_in_oman_status = b.made_in_oman_status
FROM backup_20261020_phase1.projects b WHERE b.id = p.id;
ALTER TABLE public.projects
  DROP COLUMN IF EXISTS goods_pct, DROP COLUMN IF EXISTS services_pct,
  DROP COLUMN IF EXISTS omanization_status, DROP COLUMN IF EXISTS services_status,
  DROP COLUMN IF EXISTS compliance_status, DROP COLUMN IF EXISTS actual_subcontract_local,
  DROP COLUMN IF EXISTS actual_subcontract_foreign, DROP COLUMN IF EXISTS actual_subcontract_sme,
  DROP COLUMN IF EXISTS metrics_updated_at;

-- Settings
UPDATE public.platform_settings s SET settings = b.settings, updated_at = now()
FROM backup_20261020_phase1.platform_settings b WHERE b.id = s.id;

COMMIT;
-- Afterwards (optional): DROP SCHEMA backup_20261020_phase1 CASCADE;  — only once the rollback is confirmed.
