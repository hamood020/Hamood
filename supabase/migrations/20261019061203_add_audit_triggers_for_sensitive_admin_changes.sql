-- Extend immutable audit coverage to administrative and attachment-metadata changes.
-- private.write_audit is SECURITY DEFINER with an empty search_path and is not callable by app roles.
DO $audit$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies',
    'employee_followups',
    'government_entities',
    'platform_settings',
    'project_plan_documents',
    'user_entity_assignments',
    'user_profiles'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_sensitive_changes ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER audit_sensitive_changes AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.write_audit()',
      t
    );
  END LOOP;
END
$audit$;