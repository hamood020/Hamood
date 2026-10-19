-- Prevent inactive or expired accounts from mutating their personal assignments/settings.
ALTER POLICY "assignments self delete"
  ON public.user_entity_assignments TO authenticated
  USING (user_id = auth.uid() AND public.user_access_valid(auth.uid()));
ALTER POLICY "assignments self write"
  ON public.user_entity_assignments TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.user_access_valid(auth.uid()));
ALTER POLICY "notification settings self read"
  ON public.user_notification_settings TO authenticated
  USING (user_id = auth.uid() AND public.user_access_valid(auth.uid()));
ALTER POLICY "notification settings self write"
  ON public.user_notification_settings TO authenticated
  USING (user_id = auth.uid() AND public.user_access_valid(auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.user_access_valid(auth.uid()));
