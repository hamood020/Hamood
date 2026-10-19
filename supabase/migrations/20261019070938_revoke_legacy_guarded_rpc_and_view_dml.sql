REVOKE EXECUTE ON FUNCTION public.admin_update_user_profile_guarded(uuid, text, text, boolean, timestamp with time zone, timestamp with time zone)
FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL PRIVILEGES ON public.user_management, public.user_entity_assignments_view FROM authenticated;
GRANT SELECT ON public.user_management, public.user_entity_assignments_view TO authenticated;
