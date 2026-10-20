-- Phase 1 backup — run on Supabase IMMEDIATELY BEFORE the migration
-- supabase/migrations/20261020120000_phase1_roles_metrics_security.sql
-- Copies every table the migration touches, plus the current definitions of the functions,
-- policies and grants it changes, into schema backup_20261020_phase1 (not exposed to the API).

CREATE SCHEMA IF NOT EXISTS backup_20261020_phase1;
REVOKE ALL ON SCHEMA backup_20261020_phase1 FROM PUBLIC, anon, authenticated;

CREATE TABLE backup_20261020_phase1.user_profiles           AS TABLE public.user_profiles;
CREATE TABLE backup_20261020_phase1.projects                AS TABLE public.projects;
CREATE TABLE backup_20261020_phase1.quarterly_reports       AS TABLE public.quarterly_reports;
CREATE TABLE backup_20261020_phase1.platform_settings       AS TABLE public.platform_settings;
CREATE TABLE backup_20261020_phase1.employee_followups      AS TABLE public.employee_followups;
CREATE TABLE backup_20261020_phase1.user_entity_assignments AS TABLE public.user_entity_assignments;
CREATE TABLE backup_20261020_phase1.companies               AS TABLE public.companies;
CREATE TABLE backup_20261020_phase1.audit_log               AS TABLE public.audit_log;

-- Definitions as they are now (used by rollback.sql).
CREATE TABLE backup_20261020_phase1.function_defs AS
SELECT p.oid::regprocedure::text AS signature, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'private');

CREATE TABLE backup_20261020_phase1.policy_defs AS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE schemaname IN ('public', 'storage');

CREATE TABLE backup_20261020_phase1.column_grants AS
SELECT table_name, column_name, privilege_type
FROM information_schema.column_privileges
WHERE grantee = 'authenticated' AND table_schema = 'public' AND table_name IN ('projects', 'user_profiles');

CREATE TABLE backup_20261020_phase1.table_grants AS
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'authenticated' AND table_schema = 'public';

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'backup_20261020_phase1' LOOP
    EXECUTE format('ALTER TABLE backup_20261020_phase1.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON backup_20261020_phase1.%I FROM PUBLIC, anon, authenticated', t);
  END LOOP;
END $$;

-- Quick check: row counts must match the live tables.
SELECT 'projects' t, (SELECT count(*) FROM backup_20261020_phase1.projects) backup, (SELECT count(*) FROM public.projects) live
UNION ALL SELECT 'quarterly_reports', (SELECT count(*) FROM backup_20261020_phase1.quarterly_reports), (SELECT count(*) FROM public.quarterly_reports)
UNION ALL SELECT 'user_profiles', (SELECT count(*) FROM backup_20261020_phase1.user_profiles), (SELECT count(*) FROM public.user_profiles)
UNION ALL SELECT 'audit_log', (SELECT count(*) FROM backup_20261020_phase1.audit_log), (SELECT count(*) FROM public.audit_log)
UNION ALL SELECT 'function_defs', (SELECT count(*) FROM backup_20261020_phase1.function_defs), NULL
UNION ALL SELECT 'policy_defs', (SELECT count(*) FROM backup_20261020_phase1.policy_defs), NULL;
