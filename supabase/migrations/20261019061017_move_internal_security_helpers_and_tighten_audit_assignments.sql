-- Remove SECURITY DEFINER helpers from the exposed public API schema.
-- Existing RLS policies retain references to the moved function OIDs.
ALTER FUNCTION public.is_admin() SET SCHEMA private;
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
      AND is_active = true
      AND (access_starts_at IS NULL OR access_starts_at <= now())
      AND (access_expires_at IS NULL OR access_expires_at >= now())
  );
$function$;

ALTER FUNCTION public.user_access_valid(uuid) SET SCHEMA private;
CREATE OR REPLACE FUNCTION private.user_access_valid(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT
    (p_user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()))
    AND EXISTS (
      SELECT 1 FROM public.user_profiles u
      WHERE u.id = p_user_id
        AND COALESCE(u.is_active, true)
        AND (u.access_starts_at IS NULL OR u.access_starts_at <= now())
        AND (u.access_expires_at IS NULL OR u.access_expires_at >= now())
    );
$function$;

ALTER FUNCTION public.has_entity_access(uuid) SET SCHEMA private;
CREATE OR REPLACE FUNCTION private.has_entity_access(p_entity_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT private.user_access_valid((SELECT auth.uid())) AND (
    EXISTS(SELECT 1 FROM public.user_profiles u WHERE u.id=(SELECT auth.uid()) AND u.role='admin')
    OR EXISTS(SELECT 1 FROM public.user_entity_assignments a WHERE a.user_id=(SELECT auth.uid()) AND a.government_entity_id=p_entity_id)
  );
$function$;

CREATE OR REPLACE FUNCTION public.set_my_entity_assignments(p_entity_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $function$
BEGIN
  IF NOT private.user_access_valid((SELECT auth.uid())) THEN
    RAISE EXCEPTION 'الحساب غير نشط أو انتهت صلاحيته';
  END IF;
  DELETE FROM public.user_entity_assignments WHERE user_id=(SELECT auth.uid());
  INSERT INTO public.user_entity_assignments(user_id,government_entity_id)
  SELECT (SELECT auth.uid()), x FROM unnest(coalesce(p_entity_ids,ARRAY[]::uuid[])) x
  ON CONFLICT DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_user_entity_assignments(p_user_id uuid, p_entity_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $function$
BEGIN
  IF NOT private.is_admin() OR NOT private.user_access_valid((SELECT auth.uid())) THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;
  DELETE FROM public.user_entity_assignments WHERE user_id=p_user_id;
  INSERT INTO public.user_entity_assignments(user_id,government_entity_id)
  SELECT p_user_id, x FROM unnest(coalesce(p_entity_ids,ARRAY[]::uuid[])) x
  ON CONFLICT DO NOTHING;
END;
$function$;

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.user_access_valid(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_entity_access(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION private.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.user_access_valid(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.has_entity_access(uuid) FROM PUBLIC, anon;

ALTER POLICY "audit admin read" ON public.audit_log TO authenticated
  USING (private.is_admin() AND private.user_access_valid((SELECT auth.uid())));
ALTER POLICY "assignments self or admin read" ON public.user_entity_assignments TO authenticated
  USING (
    private.user_access_valid((SELECT auth.uid()))
    AND (user_id = (SELECT auth.uid()) OR private.is_admin())
  );
DROP POLICY IF EXISTS "entities editor write" ON public.government_entities;
ALTER POLICY "Admins can insert platform settings" ON public.platform_settings TO authenticated
  WITH CHECK (private.is_admin() AND private.user_access_valid((SELECT auth.uid())));
ALTER POLICY "Admins can update platform settings" ON public.platform_settings TO authenticated
  USING (private.is_admin() AND private.user_access_valid((SELECT auth.uid())))
  WITH CHECK (private.is_admin() AND private.user_access_valid((SELECT auth.uid())));
