DROP POLICY IF EXISTS "assignments manager insert others" ON public.user_entity_assignments;
DROP POLICY IF EXISTS "assignments self write" ON public.user_entity_assignments;
CREATE POLICY "assignments insert self or manager"
ON public.user_entity_assignments
FOR INSERT TO authenticated
WITH CHECK (
  (user_id = (SELECT auth.uid()) AND private.user_access_valid((SELECT auth.uid())))
  OR
  (user_id <> (SELECT auth.uid()) AND private.can_manage_assignments())
);

DROP POLICY IF EXISTS "assignments manager delete others" ON public.user_entity_assignments;
DROP POLICY IF EXISTS "assignments self delete" ON public.user_entity_assignments;
CREATE POLICY "assignments delete self or manager"
ON public.user_entity_assignments
FOR DELETE TO authenticated
USING (
  (user_id = (SELECT auth.uid()) AND private.user_access_valid((SELECT auth.uid())))
  OR
  (user_id <> (SELECT auth.uid()) AND private.can_manage_assignments())
);