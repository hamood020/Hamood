-- Harden callable SECURITY DEFINER helpers against search_path object shadowing.
-- Object references inside these functions are schema-qualified.
ALTER FUNCTION public.is_admin() SET search_path = '';
ALTER FUNCTION public.has_entity_access(uuid) SET search_path = '';
ALTER FUNCTION public.set_my_entity_assignments(uuid[]) SET search_path = '';
