-- Contact points (names, phones, e-mails of contacts at entities and companies) are visible to
-- staff only: admin, section head and specialist. Viewers can still read every other column.

CREATE OR REPLACE FUNCTION public.get_contact_points(p_table text, p_ids uuid[] DEFAULT NULL)
 RETURNS TABLE(id uuid, contact_points jsonb)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  IF NOT private.has_valid_role(ARRAY['admin','section_head','editor']) THEN
    RETURN;  -- viewers get nothing
  END IF;
  IF p_table = 'companies' THEN
    RETURN QUERY SELECT c.id, c.contact_points FROM public.companies c
      WHERE p_ids IS NULL OR c.id = ANY (p_ids);
  ELSIF p_table = 'government_entities' THEN
    RETURN QUERY SELECT e.id, e.contact_points FROM public.government_entities e
      WHERE p_ids IS NULL OR e.id = ANY (p_ids);
  ELSE
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_TABLE';
  END IF;
END;
$function$;
REVOKE ALL ON FUNCTION public.get_contact_points(text, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_contact_points(text, uuid[]) TO authenticated;

-- Reading the contact_points column directly is no longer allowed for signed-in users.
REVOKE SELECT ON public.companies FROM anon, authenticated;
REVOKE SELECT ON public.government_entities FROM anon, authenticated;
GRANT SELECT (id, name, company_type, created_at) ON public.companies TO authenticated;
GRANT SELECT (id, name, code, created_at) ON public.government_entities TO authenticated;
