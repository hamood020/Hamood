-- Replica of the live public/private schema as of 2026-10-20 (read from the catalog, before Phase 1).
CREATE TABLE public.audit_log (id bigint GENERATED ALWAYS AS IDENTITY NOT NULL, actor_user_id uuid, operation text NOT NULL, table_name text NOT NULL, record_id text, old_data jsonb, new_data jsonb, changed_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.companies (id uuid DEFAULT gen_random_uuid() NOT NULL, name text NOT NULL, company_type text, created_at timestamp with time zone DEFAULT now() NOT NULL, contact_points jsonb DEFAULT '[]'::jsonb NOT NULL);
CREATE TABLE public.employee_followups (id uuid DEFAULT gen_random_uuid() NOT NULL, project_id uuid, employee_name text, category text, action_required text, due_date date, status text DEFAULT 'open'::text NOT NULL, notes text, assigned_to uuid, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, priority text DEFAULT 'متوسطة'::text NOT NULL, created_by uuid, resolved_at timestamp with time zone, resolved_by uuid, resolution_note text, resolved_by_name text);
CREATE TABLE public.government_entities (id uuid DEFAULT gen_random_uuid() NOT NULL, name text NOT NULL, code text, created_at timestamp with time zone DEFAULT now() NOT NULL, contact_points jsonb DEFAULT '[]'::jsonb NOT NULL);
CREATE TABLE public.local_content_plans (id uuid DEFAULT gen_random_uuid() NOT NULL, project_id uuid NOT NULL, version text NOT NULL, source_file text, plan_data jsonb DEFAULT '{}'::jsonb NOT NULL, received_at date, reviewed_at date, status text DEFAULT 'received'::text NOT NULL, created_by uuid, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.platform_settings (id text DEFAULT 'global'::text NOT NULL, settings jsonb DEFAULT '{}'::jsonb NOT NULL, updated_by uuid, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.project_baselines (id uuid DEFAULT gen_random_uuid() NOT NULL, project_id uuid NOT NULL, source_file text, baseline_data jsonb DEFAULT '{}'::jsonb NOT NULL, captured_at timestamp with time zone DEFAULT now() NOT NULL, created_by uuid);
CREATE TABLE public.project_end_date_history (id uuid DEFAULT gen_random_uuid() NOT NULL, project_id uuid NOT NULL, old_end_date date, new_end_date date NOT NULL, changed_by uuid, changed_at timestamp with time zone DEFAULT now() NOT NULL, reason text);
CREATE TABLE public.project_plan_documents (id uuid DEFAULT gen_random_uuid() NOT NULL, project_id uuid NOT NULL, plan_id uuid, display_name text NOT NULL, original_file_name text NOT NULL, storage_path text NOT NULL, mime_type text, file_size bigint, created_by uuid, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.projects (id uuid DEFAULT gen_random_uuid() NOT NULL, serial_no integer, government_entity_id uuid, project_name text NOT NULL, tender_type text, project_status text, consultant text, implementing_company_id uuid, work_sector text, total_project_value numeric(18,2), start_date date, end_date date, local_content_plan boolean, progress_pct numeric(7,4), target_reports integer, due_reports integer, received_reports integer, late_reports integer, current_quarter text, annual_update text, target_omani integer, current_omani integer, achieved_omani numeric(12,4), non_omani integer, omanization_pct numeric(9,6), target_non_omani integer, plan_omani_salary numeric(18,2), actual_omani_salary numeric(18,2), local_content_omani numeric(18,2), plan_non_omani_salary numeric(18,2), actual_non_omani_salary numeric(18,2), local_content_non_omani numeric(18,2), cat1_omani integer, cat1_non_omani integer, cat2_omani integer, cat2_non_omani integer, cat3_omani integer, cat3_non_omani integer, plan_made_in_oman numeric(18,2), actual_made_in_oman numeric(18,2), mandatory_made_in_oman numeric(18,2), made_in_oman_status text, local_content_made_in_oman numeric(18,2), plan_local_supplier numeric(18,2), actual_local_supplier numeric(18,2), local_content_local_supplier numeric(18,2), plan_direct_import numeric(18,2), actual_direct_import numeric(18,2), local_content_direct_import numeric(18,2), plan_sme_supplier numeric(18,2), actual_sme_supplier numeric(18,2), local_content_sme_supplier numeric(18,2), plan_local_service numeric(18,2), actual_local_service numeric(18,2), local_content_local_service numeric(18,2), plan_foreign_service numeric(18,2), actual_foreign_service numeric(18,2), local_content_foreign_service numeric(18,2), plan_sme_service numeric(18,2), actual_sme_service numeric(18,2), sme_10_status text, local_content_sme_service numeric(18,2), total_spend numeric(18,2), total_local_content numeric(18,2), local_content_spend_pct numeric(9,6), local_content_project_pct numeric(9,6), sme_pct numeric(9,6), notes text, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, original_end_date date);
CREATE TABLE public.quarterly_reports (id uuid DEFAULT gen_random_uuid() NOT NULL, project_id uuid NOT NULL, quarter text NOT NULL, annual_period text, source_file text, report_data jsonb DEFAULT '{}'::jsonb NOT NULL, status text DEFAULT 'received'::text NOT NULL, submitted_at date, reviewed_at date, notes text, created_by uuid, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.user_entity_assignments (id uuid DEFAULT gen_random_uuid() NOT NULL, user_id uuid NOT NULL, government_entity_id uuid NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.user_notification_settings (user_id uuid NOT NULL, report_due boolean DEFAULT true NOT NULL, project_expiry boolean DEFAULT true NOT NULL, approval boolean DEFAULT true NOT NULL, delay boolean DEFAULT true NOT NULL, plan_update boolean DEFAULT true NOT NULL, days_before integer DEFAULT 10 NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.user_profiles (id uuid NOT NULL, full_name text, role text DEFAULT 'viewer'::text NOT NULL, is_active boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, username text, access_starts_at timestamp with time zone, access_expires_at timestamp with time zone);
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.government_entities ADD CONSTRAINT government_entities_pkey PRIMARY KEY (id);
ALTER TABLE public.government_entities ADD CONSTRAINT government_entities_name_key UNIQUE (name);
ALTER TABLE public.companies ADD CONSTRAINT companies_pkey PRIMARY KEY (id);
ALTER TABLE public.companies ADD CONSTRAINT companies_name_key UNIQUE (name);
ALTER TABLE public.projects ADD CONSTRAINT projects_pkey PRIMARY KEY (id);
ALTER TABLE public.local_content_plans ADD CONSTRAINT local_content_plans_pkey PRIMARY KEY (id);
ALTER TABLE public.project_baselines ADD CONSTRAINT project_baselines_pkey PRIMARY KEY (id);
ALTER TABLE public.project_baselines ADD CONSTRAINT project_baselines_project_id_key UNIQUE (project_id);
ALTER TABLE public.quarterly_reports ADD CONSTRAINT quarterly_reports_pkey PRIMARY KEY (id);
ALTER TABLE public.quarterly_reports ADD CONSTRAINT quarterly_reports_project_id_quarter_annual_period_key UNIQUE (project_id, quarter, annual_period);
ALTER TABLE public.employee_followups ADD CONSTRAINT employee_followups_pkey PRIMARY KEY (id);
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);
ALTER TABLE public.user_entity_assignments ADD CONSTRAINT user_entity_assignments_pkey PRIMARY KEY (id);
ALTER TABLE public.user_entity_assignments ADD CONSTRAINT user_entity_assignments_user_id_government_entity_id_key UNIQUE (user_id, government_entity_id);
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'editor'::text, 'viewer'::text, 'temporary_viewer'::text])));
ALTER TABLE public.project_end_date_history ADD CONSTRAINT project_end_date_history_pkey PRIMARY KEY (id);
ALTER TABLE public.project_plan_documents ADD CONSTRAINT project_plan_documents_pkey PRIMARY KEY (id);
ALTER TABLE public.project_plan_documents ADD CONSTRAINT project_plan_documents_storage_path_key UNIQUE (storage_path);
ALTER TABLE public.user_notification_settings ADD CONSTRAINT user_notification_settings_days_before_check CHECK (((days_before >= 0) AND (days_before <= 365)));
ALTER TABLE public.user_notification_settings ADD CONSTRAINT user_notification_settings_pkey PRIMARY KEY (user_id);
ALTER TABLE public.platform_settings ADD CONSTRAINT platform_settings_id_check CHECK ((id = 'global'::text));
ALTER TABLE public.platform_settings ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);
ALTER TABLE public.employee_followups ADD CONSTRAINT employee_followups_priority_check CHECK ((priority = ANY (ARRAY['منخفضة'::text, 'متوسطة'::text, 'عالية'::text, 'عاجلة'::text])));
ALTER TABLE public.companies ADD CONSTRAINT companies_contact_points_is_array CHECK ((jsonb_typeof(contact_points) = 'array'::text));
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.projects ADD CONSTRAINT projects_government_entity_id_fkey FOREIGN KEY (government_entity_id) REFERENCES government_entities(id);
ALTER TABLE public.projects ADD CONSTRAINT projects_implementing_company_id_fkey FOREIGN KEY (implementing_company_id) REFERENCES companies(id);
ALTER TABLE public.local_content_plans ADD CONSTRAINT local_content_plans_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.local_content_plans ADD CONSTRAINT local_content_plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.project_baselines ADD CONSTRAINT project_baselines_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.quarterly_reports ADD CONSTRAINT quarterly_reports_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.quarterly_reports ADD CONSTRAINT quarterly_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.employee_followups ADD CONSTRAINT employee_followups_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.employee_followups ADD CONSTRAINT employee_followups_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id);
ALTER TABLE public.user_entity_assignments ADD CONSTRAINT user_entity_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
ALTER TABLE public.user_entity_assignments ADD CONSTRAINT user_entity_assignments_government_entity_id_fkey FOREIGN KEY (government_entity_id) REFERENCES government_entities(id) ON DELETE CASCADE;
ALTER TABLE public.project_end_date_history ADD CONSTRAINT project_end_date_history_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.project_plan_documents ADD CONSTRAINT project_plan_documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.project_plan_documents ADD CONSTRAINT project_plan_documents_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES local_content_plans(id) ON DELETE CASCADE;
ALTER TABLE public.user_notification_settings ADD CONSTRAINT user_notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.platform_settings ADD CONSTRAINT platform_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.employee_followups ADD CONSTRAINT employee_followups_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public.employee_followups ADD CONSTRAINT employee_followups_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);
ALTER TABLE public.employee_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_end_date_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quarterly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_entity_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.government_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_plan_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Functions
CREATE OR REPLACE FUNCTION private.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (SELECT auth.uid()) AND role = 'admin' AND is_active = true
      AND (access_starts_at IS NULL OR access_starts_at <= now()) AND (access_expires_at IS NULL OR access_expires_at >= now()));
$function$;
CREATE OR REPLACE FUNCTION private.can_manage_assignments() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'editor') AND is_active = true
      AND (access_starts_at IS NULL OR access_starts_at <= now()) AND (access_expires_at IS NULL OR access_expires_at >= now()));
$function$;
CREATE OR REPLACE FUNCTION private.user_access_valid(p_user_id uuid DEFAULT auth.uid()) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT (p_user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()))
    AND EXISTS (SELECT 1 FROM public.user_profiles u WHERE u.id = p_user_id AND COALESCE(u.is_active, true)
        AND (u.access_starts_at IS NULL OR u.access_starts_at <= now()) AND (u.access_expires_at IS NULL OR u.access_expires_at >= now()));
$function$;
CREATE OR REPLACE FUNCTION private.has_entity_access(p_entity_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT private.user_access_valid((SELECT auth.uid())) AND (
    EXISTS(SELECT 1 FROM public.user_profiles u WHERE u.id=(SELECT auth.uid()) AND u.role='admin')
    OR EXISTS(SELECT 1 FROM public.user_entity_assignments a WHERE a.user_id=(SELECT auth.uid()) AND a.government_entity_id=p_entity_id));
$function$;
CREATE OR REPLACE FUNCTION private.write_audit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  insert into public.audit_log(actor_user_id,operation,table_name,record_id,old_data,new_data)
  values ((select auth.uid()),tg_op,tg_table_name,
    coalesce((to_jsonb(new)->>'id'),(to_jsonb(old)->>'id')),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new,old);
end;
$function$;
CREATE OR REPLACE FUNCTION public.admin_update_user_profile_guarded(p_user_id uuid, p_full_name text, p_role text, p_is_active boolean, p_access_starts_at timestamp with time zone, p_access_expires_at timestamp with time zone)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$ BEGIN RAISE EXCEPTION 'legacy 6-arg version (body omitted in replica)'; END; $function$;
CREATE OR REPLACE FUNCTION public.admin_update_user_profile_guarded(p_user_id uuid, p_full_name text, p_role text, p_is_active boolean, p_access_starts_at timestamp with time zone, p_access_expires_at timestamp with time zone, p_actor_user_id uuid)
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
    WHERE a.id = p_actor_user_id
      AND a.role = 'admin'
      AND a.is_active IS TRUE
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
$function$
;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  insert into public.user_profiles(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.handle_project_end_date_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  if tg_op = 'INSERT' then
    if new.original_end_date is null then new.original_end_date := new.end_date; end if;
    return new;
  end if;
  if tg_op = 'UPDATE' and new.end_date is distinct from old.end_date then
    if new.original_end_date is null then new.original_end_date := old.end_date; end if;
    insert into public.project_end_date_history (project_id, old_end_date, new_end_date, changed_by, reason)
    values (new.id, old.end_date, new.end_date, auth.uid(), null);
  end if;
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.set_company_contact_points(p_company_id uuid, p_contact_points jsonb)
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

  UPDATE public.companies SET contact_points = p_contact_points WHERE id = p_company_id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.set_government_entity_contact_details(p_entity_id uuid, p_name text, p_contact_points jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := (SELECT auth.uid());
  v_role text;
BEGIN
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
  UPDATE public.government_entities SET contact_points = p_contact_points WHERE id = p_entity_id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.set_my_entity_assignments(p_entity_ids uuid[]) RETURNS void LANGUAGE plpgsql SET search_path TO ''
AS $function$
BEGIN
  IF NOT private.user_access_valid((SELECT auth.uid())) THEN RAISE EXCEPTION 'الحساب غير نشط أو انتهت صلاحيته'; END IF;
  DELETE FROM public.user_entity_assignments WHERE user_id=(SELECT auth.uid());
  INSERT INTO public.user_entity_assignments(user_id,government_entity_id)
  SELECT (SELECT auth.uid()), x FROM unnest(coalesce(p_entity_ids,ARRAY[]::uuid[])) x ON CONFLICT DO NOTHING;
END;
$function$;
CREATE OR REPLACE FUNCTION public.set_user_entity_assignments(p_user_id uuid, p_entity_ids uuid[]) RETURNS void LANGUAGE plpgsql SET search_path TO ''
AS $function$
BEGIN
  IF NOT private.can_manage_assignments() OR NOT private.user_access_valid((SELECT auth.uid())) THEN RAISE EXCEPTION 'غير مصرح'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN RAISE EXCEPTION 'المستخدم غير موجود'; END IF;
  DELETE FROM public.user_entity_assignments WHERE user_id = p_user_id;
  INSERT INTO public.user_entity_assignments(user_id, government_entity_id)
  SELECT p_user_id, x FROM unnest(coalesce(p_entity_ids, ARRAY[]::uuid[])) AS x ON CONFLICT DO NOTHING;
END;
$function$;
CREATE OR REPLACE FUNCTION public.touch_project_plan_documents_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path TO ''
AS $function$ begin new.updated_at = now(); return new; end; $function$;

-- Views
CREATE VIEW public.user_management WITH (security_invoker=true) AS
 SELECT id AS user_id, username, full_name AS display_name, role, is_active, access_starts_at, access_expires_at,
   CASE WHEN (NOT COALESCE(is_active, true)) THEN 'غير نشط'::text
        WHEN ((access_starts_at IS NOT NULL) AND (access_starts_at > now())) THEN 'لم تبدأ الصلاحية'::text
        WHEN ((access_expires_at IS NOT NULL) AND (access_expires_at < now())) THEN 'منتهية'::text
        ELSE 'نشط'::text END AS access_status,
   (SELECT count(*) AS count FROM user_entity_assignments a WHERE (a.user_id = u.id)) AS assigned_entities
 FROM user_profiles u;
CREATE VIEW public.user_entity_assignments_view WITH (security_invoker=true) AS
 SELECT a.user_id, a.government_entity_id, e.name AS government_entity, e.code, a.created_at
 FROM (user_entity_assignments a JOIN government_entities e ON ((e.id = a.government_entity_id)));

-- Triggers
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER audit_sensitive_changes AFTER INSERT OR UPDATE OR DELETE ON public.companies FOR EACH ROW EXECUTE FUNCTION private.write_audit();
CREATE TRIGGER audit_sensitive_changes AFTER INSERT OR UPDATE OR DELETE ON public.employee_followups FOR EACH ROW EXECUTE FUNCTION private.write_audit();
CREATE TRIGGER audit_sensitive_changes AFTER INSERT OR UPDATE OR DELETE ON public.government_entities FOR EACH ROW EXECUTE FUNCTION private.write_audit();
CREATE TRIGGER audit_plans AFTER INSERT OR UPDATE OR DELETE ON public.local_content_plans FOR EACH ROW EXECUTE FUNCTION private.write_audit();
CREATE TRIGGER audit_sensitive_changes AFTER INSERT OR UPDATE OR DELETE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION private.write_audit();
CREATE TRIGGER audit_sensitive_changes AFTER INSERT OR UPDATE OR DELETE ON public.project_plan_documents FOR EACH ROW EXECUTE FUNCTION private.write_audit();
CREATE TRIGGER trg_project_plan_documents_updated_at BEFORE UPDATE ON public.project_plan_documents FOR EACH ROW EXECUTE FUNCTION public.touch_project_plan_documents_updated_at();
CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects FOR EACH ROW EXECUTE FUNCTION private.write_audit();
CREATE TRIGGER trg_project_end_date_change BEFORE INSERT OR UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_project_end_date_change();
CREATE TRIGGER audit_reports AFTER INSERT OR UPDATE OR DELETE ON public.quarterly_reports FOR EACH ROW EXECUTE FUNCTION private.write_audit();
CREATE TRIGGER audit_sensitive_changes AFTER INSERT OR UPDATE OR DELETE ON public.user_entity_assignments FOR EACH ROW EXECUTE FUNCTION private.write_audit();
CREATE TRIGGER audit_sensitive_changes AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION private.write_audit();

-- Grants (as live)
GRANT SELECT ON public.audit_log, public.user_entity_assignments_view, public.user_management TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies, public.employee_followups, public.government_entities,
  public.local_content_plans, public.platform_settings, public.project_baselines, public.project_end_date_history,
  public.project_plan_documents, public.projects, public.quarterly_reports, public.user_entity_assignments,
  public.user_notification_settings TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_profiles TO authenticated;
GRANT UPDATE (full_name, updated_at) ON public.user_profiles TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated;
