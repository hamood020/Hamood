-- Performance/security cleanup for ICV New; non-destructive, data-preserving.
CREATE INDEX IF NOT EXISTS idx_employee_followups_created_by ON public.employee_followups (created_by);
CREATE INDEX IF NOT EXISTS idx_employee_followups_resolved_by ON public.employee_followups (resolved_by);
CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_by ON public.platform_settings (updated_by);
CREATE INDEX IF NOT EXISTS idx_project_end_date_history_changed_by ON public.project_end_date_history (changed_by);
CREATE INDEX IF NOT EXISTS idx_project_plan_documents_created_by ON public.project_plan_documents (created_by);
CREATE INDEX IF NOT EXISTS idx_user_entity_assignments_government_entity_id ON public.user_entity_assignments (government_entity_id);

-- The unique constraint already enforces this pair; remove only the redundant standalone duplicate index.
DROP INDEX IF EXISTS public.user_entity_assignments_user_entity_uq;

-- Archive schemas are intentionally not exposed to application roles. Explicitly preserve that boundary.
REVOKE ALL ON SCHEMA backup_20261014 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SCHEMA backup_after_project_deletion_20261014 FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA backup_20261014 FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA backup_after_project_deletion_20261014 FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA backup_20261014 FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA backup_after_project_deletion_20261014 FROM PUBLIC, anon, authenticated;
