-- Security backup snapshot: Supabase project bmwtrnosqosbkezdswcx
-- Captured 2026-10-19 before function security hardening.
-- Restore only after reviewing the current schema and dependencies.

-- Original function definitions:
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare uid uuid := (select auth.uid());
begin
  if uid is null then return false; end if;
  if exists(select 1 from public.user_profiles where role='admin' and is_active) then return false; end if;
  update public.user_profiles set role='admin', updated_at=now() where id=uid;
  return found;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_project_end_date_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if tg_op='INSERT' then
    if new.original_end_date is null then
      new.original_end_date:=new.end_date;
    end if;
    return new;
  end if;

  if tg_op='UPDATE' and new.end_date is distinct from old.end_date then
    if new.original_end_date is null then
      new.original_end_date:=old.end_date;
    end if;
    insert into public.project_end_date_history(project_id,old_end_date,new_end_date,changed_by,reason)
    values(new.id,old.end_date,new.end_date,auth.uid(),null);
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.has_entity_access(p_entity_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select public.user_access_valid(auth.uid()) and (
    exists(select 1 from public.user_profiles u where u.id=auth.uid() and u.role='admin')
    or exists(select 1 from public.user_entity_assignments a where a.user_id=auth.uid() and a.government_entity_id=p_entity_id)
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select exists(
    select 1 from public.user_profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.set_my_entity_assignments(p_entity_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if not public.user_access_valid(auth.uid()) then raise exception 'الحساب غير نشط أو انتهت صلاحيته'; end if;
  delete from public.user_entity_assignments where user_id=auth.uid();
  insert into public.user_entity_assignments(user_id,government_entity_id)
  select auth.uid(),x from unnest(coalesce(p_entity_ids,ARRAY[]::uuid[])) x
  on conflict do nothing;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_user_entity_assignments(p_user_id uuid, p_entity_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  if not exists(select 1 from public.user_profiles where id=auth.uid() and role='admin' and coalesce(is_active,true)) then
    raise exception 'غير مصرح';
  end if;
  delete from public.user_entity_assignments where user_id=p_user_id;
  insert into public.user_entity_assignments(user_id,government_entity_id)
  select p_user_id,x from unnest(coalesce(p_entity_ids,ARRAY[]::uuid[])) x
  on conflict do nothing;
end;
$function$;

CREATE OR REPLACE FUNCTION public.user_access_valid(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select exists(
    select 1 from public.user_profiles u
    where u.id=p_user_id
      and coalesce(u.is_active,true)
      and (u.access_starts_at is null or u.access_starts_at <= now())
      and (u.access_expires_at is null or u.access_expires_at >= now())
  );
$function$;

CREATE OR REPLACE FUNCTION public.touch_project_plan_documents_updated_at()
RETURNS trigger LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

-- Original observed EXECUTE ACLs (pre-hardening):
-- claim_first_admin(): postgres, authenticated, service_role
-- handle_project_end_date_change(): PUBLIC, postgres, anon, authenticated, service_role
-- has_entity_access(uuid): PUBLIC, postgres, anon, authenticated, service_role
-- is_admin(): postgres, anon, authenticated, service_role
-- set_my_entity_assignments(uuid[]): postgres, anon, authenticated, service_role
-- set_user_entity_assignments(uuid, uuid[]): postgres, anon, authenticated, service_role
-- user_access_valid(uuid): PUBLIC, postgres, anon, authenticated, service_role
-- touch_project_plan_documents_updated_at(): PUBLIC, postgres, anon, authenticated, service_role

-- Triggers observed:
-- public.projects: trg_project_end_date_change BEFORE INSERT OR UPDATE OF end_date
-- public.project_plan_documents: trg_project_plan_documents_updated_at BEFORE UPDATE
