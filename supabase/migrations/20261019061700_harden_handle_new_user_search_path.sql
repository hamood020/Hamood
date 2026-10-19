-- The trigger function uses schema-qualified table references; an empty search_path prevents object shadowing.
ALTER FUNCTION public.handle_new_user() SET search_path = '';
