CREATE OR REPLACE FUNCTION public.admin_update_user_profile_guarded(
  p_user_id uuid,
  p_full_name text,
  p_role text,
  p_is_active boolean,
  p_access_starts_at timestamp with time zone,
  p_access_expires_at timestamp with time zone,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_old_role text;
  v_old_active boolean;
  v_old_start timestamp with time zone;
  v_old_end timestamp with time zone;
  v_now timestamp with time zone := pg_catalog.now();
  v_old_valid_admin boolean;
  v_new_valid_admin boolean;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(20261019, 1);
  IF p_actor_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_profiles a
    WHERE a.id = p_actor_user_id AND a.role = 'admin' AND a.is_active IS TRUE
      AND (a.access_starts_at IS NULL OR a.access_starts_at <= v_now)
      AND (a.access_expires_at IS NULL OR a.access_expires_at > v_now)
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_ACTOR';
  END IF;
  IF p_role IS NULL OR p_role NOT IN ('admin', 'editor', 'viewer', 'temporary_viewer') THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_ROLE';
  END IF;
  IF p_is_active IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_ACTIVE_STATE';
  END IF;
  IF p_access_starts_at IS NOT NULL AND p_access_expires_at IS NOT NULL
     AND p_access_expires_at <= p_access_starts_at THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_ACCESS_PERIOD';
  END IF;
  SELECT role, is_active, access_starts_at, access_expires_at
    INTO v_old_role, v_old_active, v_old_start, v_old_end
  FROM public.user_profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'USER_NOT_FOUND';
  END IF;
  v_old_valid_admin := v_old_role = 'admin' AND v_old_active IS TRUE
    AND (v_old_start IS NULL OR v_old_start <= v_now)
    AND (v_old_end IS NULL OR v_old_end > v_now);
  v_new_valid_admin := p_role = 'admin' AND p_is_active IS TRUE
    AND (p_access_starts_at IS NULL OR p_access_starts_at <= v_now)
    AND (p_access_expires_at IS NULL OR p_access_expires_at > v_now);
  IF v_old_valid_admin AND NOT v_new_valid_admin THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_profiles u
      WHERE u.id <> p_user_id AND u.role = 'admin' AND u.is_active IS TRUE
        AND (u.access_starts_at IS NULL OR u.access_starts_at <= v_now)
        AND (u.access_expires_at IS NULL OR u.access_expires_at > v_now)
    ) THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'LAST_ACTIVE_ADMIN';
    END IF;
  END IF;
  PERFORM pg_catalog.set_config('request.jwt.claim.sub', p_actor_user_id::text, true);
  UPDATE public.user_profiles
  SET full_name = p_full_name, role = p_role, is_active = p_is_active,
      access_starts_at = p_access_starts_at, access_expires_at = p_access_expires_at,
      updated_at = v_now
  WHERE id = p_user_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_update_user_profile_guarded(uuid, text, text, boolean, timestamp with time zone, timestamp with time zone, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_profile_guarded(uuid, text, text, boolean, timestamp with time zone, timestamp with time zone, uuid) TO service_role;
