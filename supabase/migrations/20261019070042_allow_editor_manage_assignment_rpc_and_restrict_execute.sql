CREATE OR REPLACE FUNCTION public.set_user_entity_assignments(p_user_id uuid, p_entity_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  IF NOT private.can_manage_assignments()
     OR NOT private.user_access_valid((SELECT auth.uid())) THEN
    RAISE EXCEPTION 'غير مصرح';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'المستخدم غير موجود';
  END IF;

  DELETE FROM public.user_entity_assignments
  WHERE user_id = p_user_id;

  INSERT INTO public.user_entity_assignments(user_id, government_entity_id)
  SELECT p_user_id, x
  FROM unnest(coalesce(p_entity_ids, ARRAY[]::uuid[])) AS x
  ON CONFLICT DO NOTHING;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.set_user_entity_assignments(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_entity_assignments(uuid, uuid[]) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.set_my_entity_assignments(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_entity_assignments(uuid[]) TO authenticated;

DROP POLICY IF EXISTS "assignments self or admin read" ON public.user_entity_assignments;
DROP POLICY IF EXISTS "assignments self or manager read" ON public.user_entity_assignments;
CREATE POLICY "assignments self or manager read"
ON public.user_entity_assignments
FOR SELECT
TO authenticated
USING (
  private.user_access_valid((SELECT auth.uid()))
  AND (
    user_id = (SELECT auth.uid())
    OR private.can_manage_assignments()
  )
);
