-- Manual rollback for migration 20261019061203.
-- Drops only the audit triggers added by that migration; existing project/report/plan audit triggers remain.
DROP TRIGGER IF EXISTS audit_sensitive_changes ON public.companies;
DROP TRIGGER IF EXISTS audit_sensitive_changes ON public.employee_followups;
DROP TRIGGER IF EXISTS audit_sensitive_changes ON public.government_entities;
DROP TRIGGER IF EXISTS audit_sensitive_changes ON public.platform_settings;
DROP TRIGGER IF EXISTS audit_sensitive_changes ON public.project_plan_documents;
DROP TRIGGER IF EXISTS audit_sensitive_changes ON public.user_entity_assignments;
DROP TRIGGER IF EXISTS audit_sensitive_changes ON public.user_profiles;
