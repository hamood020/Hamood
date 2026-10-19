-- Pre-change definitions/policies for migration 20261019061017.
-- Saved for manual rollback/reference only; do not run as a normal forward migration.
-- Previous public helper function definitions:
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.user_access_valid(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT
    (p_user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
    AND EXISTS (
      SELECT 1 FROM public.user_profiles u
      WHERE u.id = p_user_id
        AND COALESCE(u.is_active, true)
        AND (u.access_starts_at IS NULL OR u.access_starts_at <= now())
        AND (u.access_expires_at IS NULL OR u.access_expires_at >= now())
    );
$function$;

CREATE OR REPLACE FUNCTION public.has_entity_access(p_entity_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT public.user_access_valid(auth.uid()) AND (
    EXISTS(SELECT 1 FROM public.user_profiles u WHERE u.id=auth.uid() AND u.role='admin')
    OR EXISTS(SELECT 1 FROM public.user_entity_assignments a WHERE a.user_id=auth.uid() AND a.government_entity_id=p_entity_id)
  );
$function$;

CREATE OR REPLACE FUNCTION public.set_my_entity_assignments(p_entity_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF NOT public.user_access_valid(auth.uid()) THEN RAISE EXCEPTION 'الحساب غير نشط أو انتهت صلاحيته'; END IF;
  DELETE FROM public.user_entity_assignments WHERE user_id=auth.uid();
  INSERT INTO public.user_entity_assignments(user_id,government_entity_id)
  SELECT auth.uid(),x FROM unnest(coalesce(p_entity_ids,ARRAY[]::uuid[])) x ON CONFLICT DO NOTHING;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_user_entity_assignments(p_user_id uuid,p_entity_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.user_profiles WHERE id=auth.uid() AND role='admin' AND coalesce(is_active,true)) THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  DELETE FROM public.user_entity_assignments WHERE user_id=p_user_id;
  INSERT INTO public.user_entity_assignments(user_id,government_entity_id)
  SELECT p_user_id,x FROM unnest(coalesce(p_entity_ids,ARRAY[]::uuid[])) x ON CONFLICT DO NOTHING;
END;
$function$;

-- Prior policy definitions are available in the backup branch's SQL snapshot.
