CREATE POLICY "entities admin editor insert valid users"
ON public.government_entities
FOR INSERT
TO authenticated
WITH CHECK (
  private.user_access_valid((SELECT auth.uid()))
  AND EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = (SELECT auth.uid())
      AND up.role IN ('admin','editor')
      AND up.is_active = true
  )
);
