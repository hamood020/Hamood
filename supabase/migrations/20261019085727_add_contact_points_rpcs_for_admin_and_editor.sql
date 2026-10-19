CREATE OR REPLACE FUNCTION public.set_company_contact_points(
  p_company_id uuid,
  p_contact_points jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := (SELECT auth.uid());
  v_role text;
BEGIN
  IF v_actor IS NULL OR NOT private.user_access_valid(v_actor) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'ACCESS_DENIED';
  END IF;

  SELECT up.role INTO v_role
  FROM public.user_profiles up
  WHERE up.id = v_actor
    AND up.is_active IS TRUE
    AND up.role IN ('admin', 'editor')
    AND (up.access_starts_at IS NULL OR up.access_starts_at <= pg_catalog.now())
    AND (up.access_expires_at IS NULL OR up.access_expires_at > pg_catalog.now());

  IF v_role IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'CONTACT_EDIT_ADMIN_EDITOR_ONLY';
  END IF;

  IF p_contact_points IS NULL
     OR pg_catalog.jsonb_typeof(p_contact_points) <> 'array'
     OR pg_catalog.jsonb_array_length(p_contact_points) > 100 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_CONTACT_POINTS';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.jsonb_array_elements(p_contact_points) AS item(value)
    WHERE pg_catalog.jsonb_typeof(item.value) <> 'object'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_CONTACT_POINT_ENTRY';
  END IF;

  UPDATE public.companies SET contact_points = p_contact_points WHERE id = p_company_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'COMPANY_NOT_FOUND';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_government_entity_contact_details(
  p_entity_id uuid,
  p_name text,
  p_contact_points jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := (SELECT auth.uid());
  v_role text;
BEGIN
  IF v_actor IS NULL OR NOT private.user_access_valid(v_actor) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'ACCESS_DENIED';
  END IF;

  SELECT up.role INTO v_role
  FROM public.user_profiles up
  WHERE up.id = v_actor
    AND up.is_active IS TRUE
    AND up.role IN ('admin', 'editor')
    AND (up.access_starts_at IS NULL OR up.access_starts_at <= pg_catalog.now())
    AND (up.access_expires_at IS NULL OR up.access_expires_at > pg_catalog.now());

  IF v_role IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'CONTACT_EDIT_ADMIN_EDITOR_ONLY';
  END IF;

  IF p_contact_points IS NULL
     OR pg_catalog.jsonb_typeof(p_contact_points) <> 'array'
     OR pg_catalog.jsonb_array_length(p_contact_points) > 100 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_CONTACT_POINTS';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.jsonb_array_elements(p_contact_points) AS item(value)
    WHERE pg_catalog.jsonb_typeof(item.value) <> 'object'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_CONTACT_POINT_ENTRY';
  END IF;

  IF v_role = 'admin' THEN
    IF p_name IS NULL OR pg_catalog.btrim(p_name) = '' OR pg_catalog.length(p_name) > 500 THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_ENTITY_NAME';
    END IF;
    UPDATE public.government_entities
    SET name = pg_catalog.btrim(p_name), contact_points = p_contact_points
    WHERE id = p_entity_id;
  ELSE
    UPDATE public.government_entities
    SET contact_points = p_contact_points
    WHERE id = p_entity_id;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'ENTITY_NOT_FOUND';
  END IF;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.set_company_contact_points(uuid, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_government_entity_contact_details(uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_company_contact_points(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_government_entity_contact_details(uuid, text, jsonb) TO authenticated;
