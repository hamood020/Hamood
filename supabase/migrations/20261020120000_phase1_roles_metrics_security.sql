-- Phase 1 (review 2026-10-20): roles, unified compliance metrics, self sign-up hardening.
-- Backup: schema backup_20261020_phase1 (taken before this migration). Rollback: backups/phase1-2026-10-20/rollback.sql

-------------------------------------------------------------------------------
-- 1. Self sign-up: accounts created outside the admin Edge Function start inactive
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
begin
  insert into public.user_profiles(id, full_name, role, is_active)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'viewer', false);
  return new;
end;
$function$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.user_profiles ALTER COLUMN is_active SET DEFAULT false;

CREATE OR REPLACE FUNCTION private.user_access_valid(p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT (p_user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()))
    AND EXISTS (
      SELECT 1 FROM public.user_profiles u
      WHERE u.id = p_user_id
        AND u.is_active IS TRUE
        AND (u.access_starts_at IS NULL OR u.access_starts_at <= now())
        AND (u.access_expires_at IS NULL OR u.access_expires_at >= now()));
$function$;

REVOKE INSERT, DELETE ON public.user_profiles FROM authenticated;
DROP FUNCTION IF EXISTS public.admin_update_user_profile_guarded(uuid, text, text, boolean, timestamptz, timestamptz);

-------------------------------------------------------------------------------
-- 2. Roles: section_head (رئيس قسم); temporary_viewer must have an end date
-------------------------------------------------------------------------------
ALTER TABLE public.user_profiles DROP CONSTRAINT user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role = ANY (ARRAY['admin','section_head','editor','viewer','temporary_viewer']));
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_temporary_viewer_expiry_check
  CHECK (role <> 'temporary_viewer' OR access_expires_at IS NOT NULL);

CREATE OR REPLACE FUNCTION private.has_valid_role(p_roles text[])
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = (SELECT auth.uid())
      AND role = ANY (p_roles)
      AND is_active IS TRUE
      AND (access_starts_at IS NULL OR access_starts_at <= now())
      AND (access_expires_at IS NULL OR access_expires_at >= now()));
$function$;
REVOKE ALL ON FUNCTION private.has_valid_role(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_valid_role(text[]) TO authenticated;

-- Assigning entities to OTHER users: admin and section head only (self-selection unchanged).
CREATE OR REPLACE FUNCTION private.can_manage_assignments()
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$ SELECT private.has_valid_role(ARRAY['admin','section_head']); $function$;

-- A section head assigns entities to specialists only; the admin assigns to anyone.
CREATE OR REPLACE FUNCTION public.set_user_entity_assignments(p_user_id uuid, p_entity_ids uuid[])
 RETURNS void LANGUAGE plpgsql SET search_path TO ''
AS $function$
BEGIN
  IF NOT private.can_manage_assignments() OR NOT private.user_access_valid((SELECT auth.uid())) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'ACCESS_DENIED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'المستخدم غير موجود';
  END IF;
  IF NOT private.is_admin() AND p_user_id <> (SELECT auth.uid())
     AND NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_user_id AND role = 'editor') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'ACCESS_DENIED';
  END IF;
  DELETE FROM public.user_entity_assignments WHERE user_id = p_user_id;
  INSERT INTO public.user_entity_assignments(user_id, government_entity_id)
  SELECT p_user_id, x FROM unnest(coalesce(p_entity_ids, ARRAY[]::uuid[])) AS x
  ON CONFLICT DO NOTHING;
END;
$function$;

-- Every policy that allowed admin+editor now also allows section_head (public + storage).
DO $roles$
DECLARE p record; q text; w text;
BEGIN
  FOR p IN SELECT * FROM pg_policies
    WHERE schemaname IN ('public','storage')
      AND coalesce(qual,'') || coalesce(with_check,'') LIKE '%ARRAY[''admin''::text, ''editor''::text]%'
  LOOP
    q := replace(p.qual, 'ARRAY[''admin''::text, ''editor''::text]', 'ARRAY[''admin''::text, ''editor''::text, ''section_head''::text]');
    w := replace(p.with_check, 'ARRAY[''admin''::text, ''editor''::text]', 'ARRAY[''admin''::text, ''editor''::text, ''section_head''::text]');
    EXECUTE format('ALTER POLICY %I ON %I.%I%s%s', p.policyname, p.schemaname, p.tablename,
      CASE WHEN q IS NOT NULL THEN ' USING (' || q || ')' ELSE '' END,
      CASE WHEN w IS NOT NULL THEN ' WITH CHECK (' || w || ')' ELSE '' END);
  END LOOP;
END
$roles$;

-- Specialists and section heads may add companies; update/delete stay admin-only.
ALTER POLICY "companies admin write insert" ON public.companies
  WITH CHECK (private.has_valid_role(ARRAY['admin','section_head','editor']));

-- Section head reads all profiles (team view) and the specialists' audit trail.
CREATE POLICY "profile section head read" ON public.user_profiles FOR SELECT TO authenticated
  USING (private.has_valid_role(ARRAY['section_head']));
CREATE POLICY "audit section head read specialists" ON public.audit_log FOR SELECT TO authenticated
  USING (private.has_valid_role(ARRAY['section_head'])
         AND EXISTS (SELECT 1 FROM public.user_profiles u WHERE u.id = audit_log.actor_user_id AND u.role = 'editor'));

-- Contact-point RPCs: admin, section head, specialist.
DO $rpc$
DECLARE f text; src text;
BEGIN
  FOREACH f IN ARRAY ARRAY['public.set_company_contact_points(uuid,jsonb)','public.set_government_entity_contact_details(uuid,text,jsonb)'] LOOP
    src := pg_get_functiondef(f::regprocedure);
    src := replace(src, 'up.role IN (''admin'', ''editor'')', 'up.role IN (''admin'', ''section_head'', ''editor'')');
    EXECUTE src;
  END LOOP;
END
$rpc$;

-- Guarded profile update (used by the admin Edge Function): new role + temporary viewer end date.
DO $guard$
DECLARE src text;
BEGIN
  src := pg_get_functiondef('public.admin_update_user_profile_guarded(uuid,text,text,boolean,timestamptz,timestamptz,uuid)'::regprocedure);
  src := replace(src, 'p_role NOT IN (''admin'', ''editor'', ''viewer'', ''temporary_viewer'')',
                      'p_role NOT IN (''admin'', ''section_head'', ''editor'', ''viewer'', ''temporary_viewer'')');
  src := replace(src, '  IF p_is_active IS NULL THEN',
                      '  IF p_role = ''temporary_viewer'' AND p_access_expires_at IS NULL THEN' || E'\n' ||
                      '    RAISE EXCEPTION USING ERRCODE = ''P0001'', MESSAGE = ''EXPIRY_REQUIRED'';' || E'\n' ||
                      '  END IF;' || E'\n' ||
                      '  IF p_is_active IS NULL THEN');
  EXECUTE src;
END
$guard$;

-------------------------------------------------------------------------------
-- 3. Unified compliance metrics, computed in the database from APPROVED reports only
-------------------------------------------------------------------------------
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS goods_pct numeric,
  ADD COLUMN IF NOT EXISTS services_pct numeric,
  ADD COLUMN IF NOT EXISTS omanization_status text,
  ADD COLUMN IF NOT EXISTS services_status text,
  ADD COLUMN IF NOT EXISTS compliance_status text,
  ADD COLUMN IF NOT EXISTS actual_subcontract_local numeric,
  ADD COLUMN IF NOT EXISTS actual_subcontract_foreign numeric,
  ADD COLUMN IF NOT EXISTS actual_subcontract_sme numeric,
  ADD COLUMN IF NOT EXISTS metrics_updated_at timestamptz;

CREATE OR REPLACE FUNCTION private.num(p jsonb, k text)
 RETURNS numeric LANGUAGE plpgsql IMMUTABLE SET search_path TO ''
AS $function$
BEGIN
  RETURN coalesce((p->>k)::numeric, 0);
EXCEPTION WHEN others THEN RETURN 0;
END;
$function$;

CREATE OR REPLACE FUNCTION private.pct_setting(p jsonb, k text, d numeric)
 RETURNS numeric LANGUAGE plpgsql IMMUTABLE SET search_path TO ''
AS $function$
DECLARE v numeric;
BEGIN
  v := coalesce((p->>k)::numeric, d);
  RETURN CASE WHEN v > 0 AND v <= 1 THEN v * 100 ELSE v END;
EXCEPTION WHEN others THEN RETURN d;
END;
$function$;

CREATE OR REPLACE FUNCTION private.recompute_project_metrics(p_project_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  L jsonb;
  k_om numeric; k_fo numeric; k_mo numeric; k_ls numeric; k_di numeric; k_sp numeric;
  k_lsv numeric; k_fsv numeric; k_ssv numeric; k_sl numeric; k_sf numeric; k_ss numeric;
  t_om numeric; t_sme numeric; t_goods numeric; t_srv numeric;
  r record; d jsonb; cum boolean;
  om numeric := 0; fo numeric := 0;
  mo numeric := 0; ls numeric := 0; di numeric := 0; sp numeric := 0;
  lsv numeric := 0; fsv numeric := 0; ssv numeric := 0;
  sl numeric := 0; sf numeric := 0; ss numeric := 0;
  w_om numeric; w_fo numeric; has_rep boolean := false;
  v_value numeric; v_spend numeric; v_lc numeric; v_purch numeric; v_srv numeric;
  p_om numeric; p_sme numeric; p_goods numeric; p_srv numeric;
  s_om text; s_sme text; s_goods text; s_srv text; s_all text;
BEGIN
  SELECT total_project_value INTO v_value FROM public.projects WHERE id = p_project_id;
  IF NOT FOUND THEN RETURN; END IF;
  v_value := coalesce(v_value, 0);

  SELECT coalesce(settings->'local', '{}'::jsonb) INTO L FROM public.platform_settings WHERE id = 'global';
  L := coalesce(L, '{}'::jsonb);
  k_om  := private.pct_setting(L, 'omaniSalary', 80) / 100;
  k_fo  := private.pct_setting(L, 'foreignSalary', 20) / 100;
  k_mo  := private.pct_setting(L, 'madeInOman', 70) / 100;
  k_ls  := private.pct_setting(L, 'localSupplier', 18) / 100;
  k_di  := private.pct_setting(L, 'directImport', 6) / 100;
  k_sp  := private.pct_setting(L, 'smePurchase', 18) / 100;
  k_lsv := private.pct_setting(L, 'localService', 100) / 100;
  k_fsv := private.pct_setting(L, 'foreignService', 10) / 100;
  k_ssv := private.pct_setting(L, 'smeService', 70) / 100;
  k_sl  := private.pct_setting(L, 'subcontractLocal', private.pct_setting(L, 'smeSubcontract', 70)) / 100;
  k_sf  := private.pct_setting(L, 'subcontractForeign', 10) / 100;
  k_ss  := private.pct_setting(L, 'smeSubcontract', 70) / 100;
  t_om    := private.pct_setting(L, 'omanization', 30);
  t_sme   := private.pct_setting(L, 'sme', 10);
  t_goods := private.pct_setting(L, 'goodsMin', 40);
  t_srv   := private.pct_setting(L, 'servicesMin', 10);

  FOR r IN
    SELECT q.report_data
    FROM public.quarterly_reports q
    WHERE q.project_id = p_project_id AND q.status = 'معتمد'
    ORDER BY coalesce(nullif(pg_catalog.regexp_replace(coalesce(q.annual_period, ''), '\D', '', 'g'), '')::int, 0),
             coalesce(nullif(pg_catalog.regexp_replace(coalesce(q.quarter, ''), '\D', '', 'g'), '')::int, 0),
             q.created_at
  LOOP
    has_rep := true;
    d := coalesce(r.report_data, '{}'::jsonb);
    IF pg_catalog.strpos(coalesce(d->>'salary_input_type', ''), 'تراكمية') > 0 THEN
      om := private.num(d, 'omani_salary'); fo := private.num(d, 'foreign_salary');
    ELSE
      om := om + private.num(d, 'omani_salary'); fo := fo + private.num(d, 'foreign_salary');
    END IF;
    cum := pg_catalog.strpos(coalesce(d->>'report_type', ''), 'تراكمي') > 0;
    IF cum THEN
      mo := private.num(d->'purchases', 'made_in_oman'); ls := private.num(d->'purchases', 'local_supplier');
      di := private.num(d->'purchases', 'direct_import'); sp := private.num(d->'purchases', 'sme_purchase');
      lsv := private.num(d->'services', 'local_service'); fsv := private.num(d->'services', 'foreign_service');
      ssv := private.num(d->'services', 'sme_service');
      sl := private.num(d->'subcontracts', 'local'); sf := private.num(d->'subcontracts', 'foreign');
      ss := private.num(d->'subcontracts', 'sme');
    ELSE
      mo := mo + private.num(d->'purchases', 'made_in_oman'); ls := ls + private.num(d->'purchases', 'local_supplier');
      di := di + private.num(d->'purchases', 'direct_import'); sp := sp + private.num(d->'purchases', 'sme_purchase');
      lsv := lsv + private.num(d->'services', 'local_service'); fsv := fsv + private.num(d->'services', 'foreign_service');
      ssv := ssv + private.num(d->'services', 'sme_service');
      sl := sl + private.num(d->'subcontracts', 'local'); sf := sf + private.num(d->'subcontracts', 'foreign');
      ss := ss + private.num(d->'subcontracts', 'sme');
    END IF;
    w_om := private.num(d, 'omani_total'); w_fo := private.num(d, 'foreign_total');  -- latest approved report wins
  END LOOP;

  v_spend := om + fo + mo + ls + di + sp + lsv + fsv + ssv + sl + sf + ss;
  v_lc := om*k_om + fo*k_fo + mo*k_mo + ls*k_ls + di*k_di + sp*k_sp
        + lsv*k_lsv + fsv*k_fsv + ssv*k_ssv + sl*k_sl + sf*k_sf + ss*k_ss;
  v_purch := mo + ls + di + sp;
  v_srv := lsv + fsv + ssv;

  p_om    := CASE WHEN has_rep AND coalesce(w_om,0) + coalesce(w_fo,0) > 0 THEN w_om / (w_om + w_fo) * 100 END;
  p_sme   := CASE WHEN has_rep AND v_value > 0 THEN (ss + ssv) / v_value * 100 END;
  p_goods := CASE WHEN has_rep AND v_purch > 0 THEN mo / v_purch * 100 END;
  p_srv   := CASE WHEN has_rep AND v_value > 0 THEN v_srv / v_value * 100 END;

  s_om    := CASE WHEN p_om    IS NULL THEN 'غير منطبق' WHEN p_om    >= t_om    THEN 'مستوفي' ELSE 'غير مستوفي' END;
  s_sme   := CASE WHEN p_sme   IS NULL THEN 'غير منطبق' WHEN p_sme   >= t_sme   THEN 'مستوفي' ELSE 'غير مستوفي' END;
  s_goods := CASE WHEN p_goods IS NULL THEN 'غير منطبق' WHEN p_goods >= t_goods THEN 'مستوفي' ELSE 'غير مستوفي' END;
  s_srv   := CASE WHEN p_srv   IS NULL THEN 'غير منطبق' WHEN p_srv   >= t_srv   THEN 'مستوفي' ELSE 'غير مستوفي' END;
  s_all   := CASE
    WHEN 'غير مستوفي' IN (s_om, s_sme, s_goods, s_srv) THEN 'غير مستوفي'
    WHEN 'مستوفي' IN (s_om, s_sme, s_goods, s_srv) THEN 'مستوفي'
    ELSE 'غير منطبق' END;

  UPDATE public.projects SET
    actual_omani_salary = om, local_content_omani = om * k_om,
    actual_non_omani_salary = fo, local_content_non_omani = fo * k_fo,
    actual_made_in_oman = mo, local_content_made_in_oman = mo * k_mo,
    actual_local_supplier = ls, local_content_local_supplier = ls * k_ls,
    actual_direct_import = di, local_content_direct_import = di * k_di,
    actual_sme_supplier = sp, local_content_sme_supplier = sp * k_sp,
    actual_local_service = lsv, local_content_local_service = lsv * k_lsv,
    actual_foreign_service = fsv, local_content_foreign_service = fsv * k_fsv,
    actual_sme_service = ssv, local_content_sme_service = ssv * k_ssv,
    actual_subcontract_local = sl, actual_subcontract_foreign = sf, actual_subcontract_sme = ss,
    current_omani = w_om, non_omani = w_fo,
    total_spend = v_spend, total_local_content = v_lc,
    local_content_spend_pct = CASE WHEN v_spend > 0 THEN v_lc / v_spend * 100 ELSE 0 END,
    local_content_project_pct = CASE WHEN v_value > 0 THEN v_lc / v_value * 100 ELSE 0 END,
    omanization_pct = p_om, sme_pct = p_sme, goods_pct = p_goods, services_pct = p_srv,
    omanization_status = s_om, sme_10_status = s_sme, made_in_oman_status = s_goods,
    services_status = s_srv, compliance_status = s_all,
    metrics_updated_at = now()
  WHERE id = p_project_id;
END;
$function$;
REVOKE ALL ON FUNCTION private.recompute_project_metrics(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.trg_reports_recompute()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  IF tg_op IN ('UPDATE','DELETE') THEN PERFORM private.recompute_project_metrics(old.project_id); END IF;
  IF tg_op IN ('INSERT','UPDATE') AND (tg_op = 'INSERT' OR new.project_id IS DISTINCT FROM old.project_id) THEN
    PERFORM private.recompute_project_metrics(new.project_id);
  END IF;
  RETURN NULL;
END;
$function$;
DROP TRIGGER IF EXISTS recompute_project_metrics ON public.quarterly_reports;
CREATE TRIGGER recompute_project_metrics AFTER INSERT OR UPDATE OR DELETE ON public.quarterly_reports
  FOR EACH ROW EXECUTE FUNCTION private.trg_reports_recompute();

CREATE OR REPLACE FUNCTION private.trg_project_value_recompute()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
BEGIN
  PERFORM private.recompute_project_metrics(new.id);
  RETURN NULL;
END;
$function$;
DROP TRIGGER IF EXISTS recompute_on_value_change ON public.projects;
CREATE TRIGGER recompute_on_value_change AFTER INSERT OR UPDATE OF total_project_value ON public.projects
  FOR EACH ROW EXECUTE FUNCTION private.trg_project_value_recompute();

CREATE OR REPLACE FUNCTION private.trg_settings_recompute()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE pid uuid;
BEGIN
  IF tg_op = 'UPDATE' AND new.settings->'local' IS NOT DISTINCT FROM old.settings->'local' THEN RETURN NULL; END IF;
  FOR pid IN SELECT id FROM public.projects LOOP PERFORM private.recompute_project_metrics(pid); END LOOP;
  RETURN NULL;
END;
$function$;
DROP TRIGGER IF EXISTS recompute_on_settings_change ON public.platform_settings;
CREATE TRIGGER recompute_on_settings_change AFTER INSERT OR UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION private.trg_settings_recompute();

REVOKE ALL ON FUNCTION private.trg_reports_recompute() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.trg_project_value_recompute() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.trg_settings_recompute() FROM PUBLIC, anon, authenticated;

-- Browsers may no longer write computed metric columns; only the fields the forms edit.
REVOKE UPDATE ON public.projects FROM authenticated;
GRANT UPDATE (serial_no, government_entity_id, project_name, tender_type, project_status, consultant,
              implementing_company_id, work_sector, total_project_value, start_date, end_date,
              local_content_plan, progress_pct, notes, updated_at)
  ON public.projects TO authenticated;

-------------------------------------------------------------------------------
-- 4. Optional lock on approved reports (setting reports.lockApproved, starts OFF)
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.trg_lock_approved_reports()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_lock boolean;
BEGIN
  IF old.status IS DISTINCT FROM 'معتمد' OR private.is_admin() THEN RETURN coalesce(new, old); END IF;
  SELECT coalesce((settings->'reports'->>'lockApproved')::boolean, false) INTO v_lock
  FROM public.platform_settings WHERE id = 'global';
  IF coalesce(v_lock, false) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'REPORT_LOCKED';
  END IF;
  RETURN coalesce(new, old);
END;
$function$;
REVOKE ALL ON FUNCTION private.trg_lock_approved_reports() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS lock_approved_reports ON public.quarterly_reports;
CREATE TRIGGER lock_approved_reports BEFORE UPDATE OR DELETE ON public.quarterly_reports
  FOR EACH ROW EXECUTE FUNCTION private.trg_lock_approved_reports();

-------------------------------------------------------------------------------
-- 5. Notes and tasks (employee_followups): status is either open or closed
-------------------------------------------------------------------------------
UPDATE public.employee_followups
SET status = CASE WHEN status IN ('closed', 'مكتمل', 'مغلقة', 'done') THEN 'closed' ELSE 'open' END
WHERE status IS NULL OR status NOT IN ('open', 'closed');
ALTER TABLE public.employee_followups ALTER COLUMN status SET DEFAULT 'open';
ALTER TABLE public.employee_followups ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.employee_followups DROP CONSTRAINT IF EXISTS employee_followups_status_check;
ALTER TABLE public.employee_followups
  ADD CONSTRAINT employee_followups_status_check CHECK (status IN ('open', 'closed'));

-------------------------------------------------------------------------------
-- 6. Audit log: always on; skip no-op saves and the database's own metric refresh;
--    one user's edits to the same record within 10 minutes become one event;
--    events older than settings.audit.retention days (min 30, default 365) are deleted daily.
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION private.audit_ignored_keys(p_table text)
 RETURNS text[] LANGUAGE sql IMMUTABLE SET search_path TO ''
AS $function$
  SELECT CASE WHEN p_table = 'projects' THEN ARRAY[
    'updated_at','metrics_updated_at',
    'actual_omani_salary','local_content_omani','actual_non_omani_salary','local_content_non_omani',
    'actual_made_in_oman','local_content_made_in_oman','actual_local_supplier','local_content_local_supplier',
    'actual_direct_import','local_content_direct_import','actual_sme_supplier','local_content_sme_supplier',
    'actual_local_service','local_content_local_service','actual_foreign_service','local_content_foreign_service',
    'actual_sme_service','local_content_sme_service',
    'actual_subcontract_local','actual_subcontract_foreign','actual_subcontract_sme',
    'current_omani','non_omani','total_spend','total_local_content',
    'local_content_spend_pct','local_content_project_pct',
    'omanization_pct','sme_pct','goods_pct','services_pct',
    'omanization_status','sme_10_status','made_in_oman_status','services_status','compliance_status']
  ELSE ARRAY['updated_at'] END;
$function$;

CREATE OR REPLACE FUNCTION private.write_audit()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := (SELECT auth.uid());
  v_old jsonb := CASE WHEN tg_op IN ('UPDATE','DELETE') THEN to_jsonb(old) END;
  v_new jsonb := CASE WHEN tg_op IN ('INSERT','UPDATE') THEN to_jsonb(new) END;
  v_id text := coalesce(v_new->>'id', v_old->>'id');
  v_skip text[] := private.audit_ignored_keys(tg_table_name);
  v_prev bigint;
BEGIN
  IF tg_op = 'UPDATE' AND (v_old - v_skip) = (v_new - v_skip) THEN
    RETURN new;  -- nothing a person changed
  END IF;
  IF tg_op = 'UPDATE' AND v_actor IS NOT NULL THEN
    SELECT id INTO v_prev FROM public.audit_log
    WHERE actor_user_id = v_actor AND table_name = tg_table_name AND record_id = v_id
      AND operation IN ('INSERT','UPDATE') AND changed_at > now() - interval '10 minutes'
    ORDER BY changed_at DESC LIMIT 1;
    IF v_prev IS NOT NULL THEN
      -- keep the first "before" picture, refresh the "after" picture
      UPDATE public.audit_log SET new_data = v_new, changed_at = now() WHERE id = v_prev;
      RETURN new;
    END IF;
  END IF;
  INSERT INTO public.audit_log(actor_user_id, operation, table_name, record_id, old_data, new_data)
  VALUES (v_actor, tg_op, tg_table_name, v_id, v_old, v_new);
  RETURN coalesce(new, old);
END;
$function$;
REVOKE ALL ON FUNCTION private.write_audit() FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS audit_log_merge_idx
  ON public.audit_log (actor_user_id, table_name, record_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_changed_at_idx ON public.audit_log (changed_at);

CREATE OR REPLACE FUNCTION private.purge_audit_log()
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_days integer; v_count integer;
BEGIN
  SELECT greatest(30, coalesce((settings->'audit'->>'retention')::integer, 365)) INTO v_days
  FROM public.platform_settings WHERE id = 'global';
  DELETE FROM public.audit_log WHERE changed_at < now() - make_interval(days => coalesce(v_days, 365));
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$;
REVOKE ALL ON FUNCTION private.purge_audit_log() FROM PUBLIC, anon, authenticated;

-------------------------------------------------------------------------------
-- 7. In-platform notifications (bell). Built daily for staff, from their assigned
--    entities, respecting platform toggles and each user's own settings.
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('report_due','delay','project_expiry','approval','plan_update')),
  title text NOT NULL,
  body text,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  dedupe_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  UNIQUE (user_id, dedupe_key)
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_project_idx ON public.notifications (project_id);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications own read" ON public.notifications;
CREATE POLICY "notifications own read" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) AND private.user_access_valid((SELECT auth.uid())));
DROP POLICY IF EXISTS "notifications own mark read" ON public.notifications;
CREATE POLICY "notifications own mark read" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND private.user_access_valid((SELECT auth.uid())))
  WITH CHECK (user_id = (SELECT auth.uid()));
REVOKE ALL ON public.notifications FROM anon, authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;

CREATE OR REPLACE FUNCTION private.generate_notifications()
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE
  s jsonb;
  v_today date := (now() AT TIME ZONE 'Asia/Muscat')::date;
  v_cur_q integer := extract(quarter FROM v_today)::integer;
  v_q integer; v_y integer; v_q_start date; v_q_end date; v_deadline date;
  v_count integer := 0; v_n integer;
BEGIN
  SELECT settings INTO s FROM public.platform_settings WHERE id = 'global';
  s := coalesce(s, '{}'::jsonb);
  v_q := CASE WHEN v_cur_q = 1 THEN 4 ELSE v_cur_q - 1 END;
  v_y := extract(year FROM v_today)::integer - CASE WHEN v_cur_q = 1 THEN 1 ELSE 0 END;
  v_q_start := make_date(v_y, (v_q - 1) * 3 + 1, 1);
  v_q_end := (v_q_start + interval '3 months' - interval '1 day')::date;
  v_deadline := v_q_end + coalesce((s->'reports'->>'dueDays')::integer, 30);

  DROP TABLE IF EXISTS pg_temp._icv_scope;
  CREATE TEMP TABLE _icv_scope ON COMMIT DROP AS
  SELECT u.id AS user_id, p.id AS project_id, p.project_name, p.start_date, p.end_date, p.local_content_plan,
         coalesce(ns.report_due, true) AS want_due, coalesce(ns.delay, true) AS want_delay,
         coalesce(ns.project_expiry, true) AS want_expiry, coalesce(ns.plan_update, true) AS want_plan,
         greatest(0, coalesce(ns.days_before, (s->'notifications'->>'daysBefore')::integer, 10)) AS days_before
  FROM public.user_profiles u
  JOIN public.user_entity_assignments a ON a.user_id = u.id
  JOIN public.projects p ON p.government_entity_id = a.government_entity_id
  LEFT JOIN public.user_notification_settings ns ON ns.user_id = u.id
  WHERE u.role IN ('admin','section_head','editor') AND u.is_active IS TRUE
    AND (u.access_starts_at IS NULL OR u.access_starts_at <= now())
    AND (u.access_expires_at IS NULL OR u.access_expires_at >= now());

  -- Report for the last finished quarter not received yet: due soon, then late.
  INSERT INTO public.notifications(user_id, kind, title, body, project_id, dedupe_key)
  SELECT sc.user_id,
         CASE WHEN v_today > v_deadline THEN 'delay' ELSE 'report_due' END,
         CASE WHEN v_today > v_deadline THEN 'تقرير متأخر' ELSE 'تقرير مستحق قريبًا' END,
         sc.project_name || ' — تقرير Q' || v_q || ' ' || v_y ||
           CASE WHEN v_today > v_deadline THEN ' متأخر منذ ' || (v_today - v_deadline) || ' يوم'
                ELSE ' مستحق خلال ' || (v_deadline - v_today) || ' يوم' END,
         sc.project_id,
         (CASE WHEN v_today > v_deadline THEN 'delay:' ELSE 'report_due:' END) || sc.project_id || ':' || v_y || 'Q' || v_q
  FROM pg_temp._icv_scope sc
  WHERE sc.start_date IS NOT NULL AND sc.start_date <= v_q_end
    AND (sc.end_date IS NULL OR sc.end_date >= v_q_start)
    AND NOT EXISTS (
      SELECT 1 FROM public.quarterly_reports r
      WHERE r.project_id = sc.project_id AND r.annual_period = v_y::text
        AND nullif(regexp_replace(coalesce(r.quarter, ''), '\D', '', 'g'), '')::integer = v_q)
    AND CASE WHEN v_today > v_deadline
             THEN sc.want_delay AND coalesce((s->'notifications'->>'delay')::boolean, true)
             ELSE sc.want_due AND coalesce((s->'notifications'->>'reportDue')::boolean, true)
                  AND v_deadline - v_today <= sc.days_before END
  ON CONFLICT (user_id, dedupe_key) DO NOTHING;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_count := v_count + v_n;

  -- Project ending soon.
  INSERT INTO public.notifications(user_id, kind, title, body, project_id, dedupe_key)
  SELECT sc.user_id, 'project_expiry', 'مشروع يقترب من نهايته',
         sc.project_name || ' — ينتهي في ' || to_char(sc.end_date, 'DD/MM/YYYY'),
         sc.project_id, 'project_expiry:' || sc.project_id || ':' || sc.end_date
  FROM pg_temp._icv_scope sc
  WHERE sc.want_expiry AND coalesce((s->'notifications'->>'projectExpiry')::boolean, true)
    AND sc.end_date BETWEEN v_today AND v_today + sc.days_before
  ON CONFLICT (user_id, dedupe_key) DO NOTHING;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_count := v_count + v_n;

  -- No local content plan yet (reminded once a month).
  INSERT INTO public.notifications(user_id, kind, title, body, project_id, dedupe_key)
  SELECT sc.user_id, 'plan_update', 'لا توجد خطة محتوى محلي',
         sc.project_name || ' — أضف خطة المحتوى المحلي للمشروع', sc.project_id,
         'plan_update:' || sc.project_id || ':' || to_char(v_today, 'YYYY-MM')
  FROM pg_temp._icv_scope sc
  WHERE sc.want_plan AND coalesce((s->'notifications'->>'planUpdate')::boolean, true)
    AND NOT coalesce(sc.local_content_plan, false)
    AND NOT EXISTS (SELECT 1 FROM public.local_content_plans lp WHERE lp.project_id = sc.project_id)
  ON CONFLICT (user_id, dedupe_key) DO NOTHING;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_count := v_count + v_n;

  DROP TABLE IF EXISTS pg_temp._icv_scope;
  -- Read notifications are kept 90 days.
  DELETE FROM public.notifications WHERE read_at < now() - interval '90 days';
  RETURN v_count;
END;
$function$;
REVOKE ALL ON FUNCTION private.generate_notifications() FROM PUBLIC, anon, authenticated;

-- Approval / rejection: tell whoever entered the report, as it happens.
CREATE OR REPLACE FUNCTION private.trg_report_status_notify()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_on boolean; v_name text;
BEGIN
  IF new.status IS NOT DISTINCT FROM old.status OR new.status NOT IN ('معتمد','مرفوض')
     OR new.created_by IS NULL OR new.created_by = (SELECT auth.uid()) THEN
    RETURN new;
  END IF;
  SELECT coalesce((settings->'notifications'->>'approval')::boolean, true) INTO v_on
  FROM public.platform_settings WHERE id = 'global';
  IF NOT coalesce(v_on, true) OR NOT coalesce(
       (SELECT approval FROM public.user_notification_settings WHERE user_id = new.created_by), true) THEN
    RETURN new;
  END IF;
  SELECT project_name INTO v_name FROM public.projects WHERE id = new.project_id;
  INSERT INTO public.notifications(user_id, kind, title, body, project_id, dedupe_key)
  VALUES (new.created_by, 'approval',
          CASE WHEN new.status = 'معتمد' THEN 'تم اعتماد تقرير' ELSE 'تم رفض تقرير' END,
          coalesce(v_name, 'مشروع') || ' — ' || coalesce(new.quarter, '') || ' ' || coalesce(new.annual_period, ''),
          new.project_id, 'approval:' || new.id || ':' || new.status || ':' || extract(epoch FROM now())::bigint)
  ON CONFLICT (user_id, dedupe_key) DO NOTHING;
  RETURN new;
END;
$function$;
REVOKE ALL ON FUNCTION private.trg_report_status_notify() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS notify_report_status ON public.quarterly_reports;
CREATE TRIGGER notify_report_status AFTER UPDATE OF status ON public.quarterly_reports
  FOR EACH ROW EXECUTE FUNCTION private.trg_report_status_notify();

-------------------------------------------------------------------------------
-- 8. Daily jobs (pg_cron, included in the free plan). Times are UTC: 21:15 = 01:15 Muscat.
-------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('icv-audit-retention', '15 21 * * *', $$SELECT private.purge_audit_log()$$);
SELECT cron.schedule('icv-daily-notifications', '30 21 * * *', $$SELECT private.generate_notifications()$$);

-------------------------------------------------------------------------------
-- 9. Settings: separate subcontract coefficients, lock OFF, audit always on.
--    (This UPDATE fires the settings trigger, which recomputes every project.)
-------------------------------------------------------------------------------
UPDATE public.platform_settings
SET settings = jsonb_set(jsonb_set(jsonb_set(
      settings #- '{audit,enabled}',
      '{local,subcontractLocal}', to_jsonb(coalesce((settings->'local'->>'smeSubcontract')::numeric, 70))),
      '{local,subcontractForeign}', '10'::jsonb),
      '{reports,lockApproved}', 'false'::jsonb),
    updated_at = now()
WHERE id = 'global';
