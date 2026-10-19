-- Harden elevated database functions. Applied to Supabase project bmwtrnosqosbkezdswcx on 2026-10-19.
-- Leaked-password protection intentionally deferred by project owner.

CREATE OR REPLACE FUNCTION public.handle_project_end_date_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
begin
  if tg_op = 'INSERT' then
    if new.original_end_date is null then new.original_end_date := new.end_date; end if;
    return new;
  end if;
  if tg_op = 'UPDATE' and new.end_date is distinct from old.end_date then
    if new.original_end_date is null then new.original_end_date := old.end_date; end if;
    insert into public.project_end_date_history(project_id, old_end_date, new_end_date, changed_by, reason)
    values (new.id, old.end_date, new.end_date, auth.uid(), null);
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.touch_project_plan_documents_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = ''
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_project_end_date_change() FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.touch_project_plan_documents_updated_at() FROM PUBLIC, anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.has_entity_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_entity_access(uuid) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.set_my_entity_assignments(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_entity_assignments(uuid[]) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.set_user_entity_assignments(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_entity_assignments(uuid, uuid[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.user_access_valid(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  select
    (p_user_id = (select auth.uid()) or (select public.is_admin()))
    and exists (
      select 1 from public.user_profiles u
      where u.id = p_user_id
        and coalesce(u.is_active, true)
        and (u.access_starts_at is null or u.access_starts_at <= now())
        and (u.access_expires_at is null or u.access_expires_at >= now())
    );
$function$;
REVOKE EXECUTE ON FUNCTION public.user_access_valid(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_access_valid(uuid) TO authenticated, service_role;

-- Disable client-side bootstrap promotion; use trusted administrative setup for any future bootstrap.
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon, authenticated;
