CREATE OR REPLACE FUNCTION private.can_manage_assignments()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'editor')
      AND is_active = true
      AND (access_starts_at IS NULL OR access_starts_at <= now())
      AND (access_expires_at IS NULL OR access_expires_at >= now())
  );
$function$;

REVOKE ALL ON FUNCTION private.can_manage_assignments() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.can_manage_assignments() TO authenticated;

DROP POLICY IF EXISTS "assignments admin write insert" ON public.user_entity_assignments;
DROP POLICY IF EXISTS "assignments admin write update" ON public.user_entity_assignments;
DROP POLICY IF EXISTS "assignments admin write delete" ON public.user_entity_assignments;

CREATE POLICY "assignments manager insert others"
ON public.user_entity_assignments
FOR INSERT TO authenticated
WITH CHECK (
  private.can_manage_assignments()
  AND user_id <> (SELECT auth.uid())
);

CREATE POLICY "assignments manager update"
ON public.user_entity_assignments
FOR UPDATE TO authenticated
USING (private.can_manage_assignments())
WITH CHECK (private.can_manage_assignments());

CREATE POLICY "assignments manager delete others"
ON public.user_entity_assignments
FOR DELETE TO authenticated
USING (
  private.can_manage_assignments()
  AND user_id <> (SELECT auth.uid())
);