-- Require a valid active account to read platform settings.
ALTER POLICY "Authenticated users can read platform settings"
  ON public.platform_settings TO authenticated
  USING (public.user_access_valid(auth.uid()));

-- Admin assignment management must require both administrator role and valid access.
ALTER POLICY "assignments admin write"
  ON public.user_entity_assignments TO authenticated
  USING (public.is_admin() AND public.user_access_valid(auth.uid()))
  WITH CHECK (public.is_admin() AND public.user_access_valid(auth.uid()));
