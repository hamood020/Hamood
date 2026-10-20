-- REFERENCE SNAPSHOT ONLY. Captured from live project on 2026-10-20T17:20:11.068579+00:00.
-- Review dependencies, grants, helper functions, triggers, storage policies, and extension versions before replay.
-- This file is not a turnkey migration; the companion JSON snapshot documents functions/triggers/RLS policy state.

CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  actor_user_id uuid,
  operation text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  changed_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  company_type text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  contact_points jsonb DEFAULT '[]'::jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.employee_followups (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid,
  employee_name text,
  category text,
  action_required text,
  due_date date,
  status text DEFAULT 'open'::text NOT NULL,
  notes text,
  assigned_to uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  priority text DEFAULT 'متوسطة'::text NOT NULL,
  created_by uuid,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  resolution_note text,
  resolved_by_name text
);

CREATE TABLE IF NOT EXISTS public.government_entities (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  code text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  contact_points jsonb DEFAULT '[]'::jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.local_content_plans (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  version text NOT NULL,
  source_file text,
  plan_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  received_at date,
  reviewed_at date,
  status text DEFAULT 'received'::text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  project_id uuid,
  dedupe_key text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  read_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id text DEFAULT 'global'::text NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_baselines (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  source_file text,
  baseline_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  captured_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.project_end_date_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  old_end_date date,
  new_end_date date NOT NULL,
  changed_by uuid,
  changed_at timestamp with time zone DEFAULT now() NOT NULL,
  reason text
);

CREATE TABLE IF NOT EXISTS public.project_plan_documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  plan_id uuid,
  display_name text NOT NULL,
  original_file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  file_size bigint,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  serial_no integer,
  government_entity_id uuid,
  project_name text NOT NULL,
  tender_type text,
  project_status text,
  consultant text,
  implementing_company_id uuid,
  work_sector text,
  total_project_value numeric(18,2),
  start_date date,
  end_date date,
  local_content_plan boolean,
  progress_pct numeric(7,4),
  target_reports integer,
  due_reports integer,
  received_reports integer,
  late_reports integer,
  current_quarter text,
  annual_update text,
  target_omani integer,
  current_omani integer,
  achieved_omani numeric(12,4),
  non_omani integer,
  omanization_pct numeric(9,6),
  target_non_omani integer,
  plan_omani_salary numeric(18,2),
  actual_omani_salary numeric(18,2),
  local_content_omani numeric(18,2),
  plan_non_omani_salary numeric(18,2),
  actual_non_omani_salary numeric(18,2),
  local_content_non_omani numeric(18,2),
  cat1_omani integer,
  cat1_non_omani integer,
  cat2_omani integer,
  cat2_non_omani integer,
  cat3_omani integer,
  cat3_non_omani integer,
  plan_made_in_oman numeric(18,2),
  actual_made_in_oman numeric(18,2),
  mandatory_made_in_oman numeric(18,2),
  made_in_oman_status text,
  local_content_made_in_oman numeric(18,2),
  plan_local_supplier numeric(18,2),
  actual_local_supplier numeric(18,2),
  local_content_local_supplier numeric(18,2),
  plan_direct_import numeric(18,2),
  actual_direct_import numeric(18,2),
  local_content_direct_import numeric(18,2),
  plan_sme_supplier numeric(18,2),
  actual_sme_supplier numeric(18,2),
  local_content_sme_supplier numeric(18,2),
  plan_local_service numeric(18,2),
  actual_local_service numeric(18,2),
  local_content_local_service numeric(18,2),
  plan_foreign_service numeric(18,2),
  actual_foreign_service numeric(18,2),
  local_content_foreign_service numeric(18,2),
  plan_sme_service numeric(18,2),
  actual_sme_service numeric(18,2),
  sme_10_status text,
  local_content_sme_service numeric(18,2),
  total_spend numeric(18,2),
  total_local_content numeric(18,2),
  local_content_spend_pct numeric(9,6),
  local_content_project_pct numeric(9,6),
  sme_pct numeric(9,6),
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  original_end_date date,
  goods_pct numeric,
  services_pct numeric,
  omanization_status text,
  services_status text,
  compliance_status text,
  actual_subcontract_local numeric,
  actual_subcontract_foreign numeric,
  actual_subcontract_sme numeric,
  metrics_updated_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.quarterly_reports (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  quarter text NOT NULL,
  annual_period text,
  source_file text,
  report_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  status text DEFAULT 'received'::text NOT NULL,
  submitted_at date,
  reviewed_at date,
  notes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_entity_assignments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  government_entity_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_notification_settings (
  user_id uuid NOT NULL,
  report_due boolean DEFAULT true NOT NULL,
  project_expiry boolean DEFAULT true NOT NULL,
  approval boolean DEFAULT true NOT NULL,
  delay boolean DEFAULT true NOT NULL,
  plan_update boolean DEFAULT true NOT NULL,
  days_before integer DEFAULT 10 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid NOT NULL,
  full_name text,
  role text DEFAULT 'viewer'::text NOT NULL,
  is_active boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  username text,
  access_starts_at timestamp with time zone,
  access_expires_at timestamp with time zone
);

ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id);

ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);

ALTER TABLE public.companies ADD CONSTRAINT companies_contact_points_is_array CHECK (jsonb_typeof(contact_points) = 'array'::text);

ALTER TABLE public.companies ADD CONSTRAINT companies_name_key UNIQUE (name);

ALTER TABLE public.companies ADD CONSTRAINT companies_pkey PRIMARY KEY (id);

ALTER TABLE public.employee_followups ADD CONSTRAINT employee_followups_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);

ALTER TABLE public.employee_followups ADD CONSTRAINT employee_followups_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.employee_followups ADD CONSTRAINT employee_followups_pkey PRIMARY KEY (id);

ALTER TABLE public.employee_followups ADD CONSTRAINT employee_followups_priority_check CHECK (priority = ANY (ARRAY['منخفضة'::text, 'متوسطة'::text, 'عالية'::text, 'عاجلة'::text]));

ALTER TABLE public.employee_followups ADD CONSTRAINT employee_followups_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE public.employee_followups ADD CONSTRAINT employee_followups_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);

ALTER TABLE public.employee_followups ADD CONSTRAINT employee_followups_status_check CHECK (status = ANY (ARRAY['open'::text, 'closed'::text]));

ALTER TABLE public.government_entities ADD CONSTRAINT government_entities_name_key UNIQUE (name);

ALTER TABLE public.government_entities ADD CONSTRAINT government_entities_pkey PRIMARY KEY (id);

ALTER TABLE public.local_content_plans ADD CONSTRAINT local_content_plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.local_content_plans ADD CONSTRAINT local_content_plans_pkey PRIMARY KEY (id);

ALTER TABLE public.local_content_plans ADD CONSTRAINT local_content_plans_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_kind_check CHECK (kind = ANY (ARRAY['report_due'::text, 'delay'::text, 'project_expiry'::text, 'approval'::text, 'plan_update'::text]));

ALTER TABLE public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);

ALTER TABLE public.notifications ADD CONSTRAINT notifications_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_dedupe_key_key UNIQUE (user_id, dedupe_key);

ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.platform_settings ADD CONSTRAINT platform_settings_id_check CHECK (id = 'global'::text);

ALTER TABLE public.platform_settings ADD CONSTRAINT platform_settings_pkey PRIMARY KEY (id);

ALTER TABLE public.platform_settings ADD CONSTRAINT platform_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.project_baselines ADD CONSTRAINT project_baselines_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.project_baselines ADD CONSTRAINT project_baselines_pkey PRIMARY KEY (id);

ALTER TABLE public.project_baselines ADD CONSTRAINT project_baselines_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_baselines ADD CONSTRAINT project_baselines_project_id_key UNIQUE (project_id);

ALTER TABLE public.project_end_date_history ADD CONSTRAINT project_end_date_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);

ALTER TABLE public.project_end_date_history ADD CONSTRAINT project_end_date_history_pkey PRIMARY KEY (id);

ALTER TABLE public.project_end_date_history ADD CONSTRAINT project_end_date_history_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_plan_documents ADD CONSTRAINT project_plan_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.project_plan_documents ADD CONSTRAINT project_plan_documents_pkey PRIMARY KEY (id);

ALTER TABLE public.project_plan_documents ADD CONSTRAINT project_plan_documents_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES local_content_plans(id) ON DELETE CASCADE;

ALTER TABLE public.project_plan_documents ADD CONSTRAINT project_plan_documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE public.project_plan_documents ADD CONSTRAINT project_plan_documents_storage_path_key UNIQUE (storage_path);

ALTER TABLE public.projects ADD CONSTRAINT projects_government_entity_id_fkey FOREIGN KEY (government_entity_id) REFERENCES government_entities(id);

ALTER TABLE public.projects ADD CONSTRAINT projects_implementing_company_id_fkey FOREIGN KEY (implementing_company_id) REFERENCES companies(id);

ALTER TABLE public.projects ADD CONSTRAINT projects_pkey PRIMARY KEY (id);

ALTER TABLE public.quarterly_reports ADD CONSTRAINT quarterly_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.quarterly_reports ADD CONSTRAINT quarterly_reports_pkey PRIMARY KEY (id);

ALTER TABLE public.quarterly_reports ADD CONSTRAINT quarterly_reports_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE public.quarterly_reports ADD CONSTRAINT quarterly_reports_project_id_quarter_annual_period_key UNIQUE (project_id, quarter, annual_period);

ALTER TABLE public.user_entity_assignments ADD CONSTRAINT user_entity_assignments_government_entity_id_fkey FOREIGN KEY (government_entity_id) REFERENCES government_entities(id) ON DELETE CASCADE;

ALTER TABLE public.user_entity_assignments ADD CONSTRAINT user_entity_assignments_pkey PRIMARY KEY (id);

ALTER TABLE public.user_entity_assignments ADD CONSTRAINT user_entity_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_entity_assignments ADD CONSTRAINT user_entity_assignments_user_id_government_entity_id_key UNIQUE (user_id, government_entity_id);

ALTER TABLE public.user_notification_settings ADD CONSTRAINT user_notification_settings_days_before_check CHECK (days_before >= 0 AND days_before <= 365);

ALTER TABLE public.user_notification_settings ADD CONSTRAINT user_notification_settings_pkey PRIMARY KEY (user_id);

ALTER TABLE public.user_notification_settings ADD CONSTRAINT user_notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);

ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check CHECK (role = ANY (ARRAY['admin'::text, 'section_head'::text, 'editor'::text, 'viewer'::text, 'temporary_viewer'::text]));

ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_temporary_viewer_expiry_check CHECK (role <> 'temporary_viewer'::text OR access_expires_at IS NOT NULL);

CREATE INDEX IF NOT EXISTS audit_log_changed_at_idx ON public.audit_log USING btree (changed_at);

CREATE INDEX IF NOT EXISTS audit_log_merge_idx ON public.audit_log USING btree (actor_user_id, table_name, record_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_log USING btree (actor_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS companies_normalized_name_uidx ON public.companies USING btree (private.normalize_directory_name(name));

CREATE INDEX IF NOT EXISTS idx_employee_followups_created_by ON public.employee_followups USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_employee_followups_resolved_by ON public.employee_followups USING btree (resolved_by);

CREATE INDEX IF NOT EXISTS idx_followups_assigned_to ON public.employee_followups USING btree (assigned_to);

CREATE INDEX IF NOT EXISTS idx_followups_project ON public.employee_followups USING btree (project_id);

CREATE UNIQUE INDEX IF NOT EXISTS government_entities_normalized_name_uidx ON public.government_entities USING btree (private.normalize_directory_name(name));

CREATE INDEX IF NOT EXISTS idx_plans_created_by ON public.local_content_plans USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_plans_project ON public.local_content_plans USING btree (project_id);

CREATE INDEX IF NOT EXISTS notifications_project_idx ON public.notifications USING btree (project_id);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications USING btree (user_id, read_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_by ON public.platform_settings USING btree (updated_by);

CREATE INDEX IF NOT EXISTS idx_baseline_created_by ON public.project_baselines USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_project_end_date_history_changed_by ON public.project_end_date_history USING btree (changed_by);

CREATE INDEX IF NOT EXISTS project_end_date_history_project_idx ON public.project_end_date_history USING btree (project_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_plan_documents_created_by ON public.project_plan_documents USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_project_plan_documents_plan_id ON public.project_plan_documents USING btree (plan_id);

CREATE INDEX IF NOT EXISTS idx_project_plan_documents_project_id ON public.project_plan_documents USING btree (project_id);

CREATE INDEX IF NOT EXISTS idx_projects_company ON public.projects USING btree (implementing_company_id);

CREATE INDEX IF NOT EXISTS idx_projects_entity ON public.projects USING btree (government_entity_id);

CREATE INDEX IF NOT EXISTS idx_reports_created_by ON public.quarterly_reports USING btree (created_by);

CREATE INDEX IF NOT EXISTS idx_reports_project ON public.quarterly_reports USING btree (project_id);

CREATE INDEX IF NOT EXISTS idx_user_entity_assignments_government_entity_id ON public.user_entity_assignments USING btree (government_entity_id);

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_uq ON public.user_profiles USING btree (username) WHERE (username IS NOT NULL);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.employee_followups ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.government_entities ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.local_content_plans ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.project_baselines ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.project_end_date_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.project_plan_documents ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.quarterly_reports ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_entity_assignments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit admin read" ON public.audit_log AS permissive FOR SELECT TO authenticated USING ((private.is_admin() AND private.user_access_valid(( SELECT ( SELECT auth.uid() AS uid) AS uid))));

CREATE POLICY "audit section head read specialists" ON public.audit_log AS permissive FOR SELECT TO authenticated USING ((private.has_valid_role(ARRAY['section_head'::text]) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = audit_log.actor_user_id) AND (u.role = 'editor'::text))))));

CREATE POLICY "companies admin write delete" ON public.companies AS permissive FOR DELETE TO authenticated USING (private.is_admin());

CREATE POLICY "companies admin write insert" ON public.companies AS permissive FOR INSERT TO authenticated WITH CHECK (private.has_valid_role(ARRAY['admin'::text, 'section_head'::text, 'editor'::text]));

CREATE POLICY "companies admin write update" ON public.companies AS permissive FOR UPDATE TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE POLICY "companies valid users read" ON public.companies AS permissive FOR SELECT TO authenticated USING (private.user_access_valid(( SELECT auth.uid() AS uid)));

CREATE POLICY "followups admin editor insert" ON public.employee_followups AS permissive FOR INSERT TO authenticated WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (created_by = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "followups admin editor read" ON public.employee_followups AS permissive FOR SELECT TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "followups admin editor update" ON public.employee_followups AS permissive FOR UPDATE TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text]))))))) WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "entities admin editor insert valid users" ON public.government_entities AS permissive FOR INSERT TO authenticated WITH CHECK ((private.user_access_valid(( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (up.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])) AND (up.is_active = true))))));

CREATE POLICY "entities admin write delete" ON public.government_entities AS permissive FOR DELETE TO authenticated USING (private.is_admin());

CREATE POLICY "entities admin write update" ON public.government_entities AS permissive FOR UPDATE TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());

CREATE POLICY "entities valid users read" ON public.government_entities AS permissive FOR SELECT TO authenticated USING (private.user_access_valid(( SELECT auth.uid() AS uid)));

CREATE POLICY "plans editor write delete" ON public.local_content_plans AS permissive FOR DELETE TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "plans editor write insert" ON public.local_content_plans AS permissive FOR INSERT TO authenticated WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "plans editor write update" ON public.local_content_plans AS permissive FOR UPDATE TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text]))))))) WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "plans valid users read" ON public.local_content_plans AS permissive FOR SELECT TO authenticated USING (private.user_access_valid(( SELECT auth.uid() AS uid)));

CREATE POLICY "notifications own mark read" ON public.notifications AS permissive FOR UPDATE TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) AND private.user_access_valid(( SELECT auth.uid() AS uid)))) WITH CHECK ((user_id = ( SELECT auth.uid() AS uid)));

CREATE POLICY "notifications own read" ON public.notifications AS permissive FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) AND private.user_access_valid(( SELECT auth.uid() AS uid))));

CREATE POLICY "Admins can insert platform settings" ON public.platform_settings AS permissive FOR INSERT TO authenticated WITH CHECK ((private.is_admin() AND private.user_access_valid(( SELECT ( SELECT auth.uid() AS uid) AS uid))));

CREATE POLICY "Admins can update platform settings" ON public.platform_settings AS permissive FOR UPDATE TO authenticated USING ((private.is_admin() AND private.user_access_valid(( SELECT ( SELECT auth.uid() AS uid) AS uid)))) WITH CHECK ((private.is_admin() AND private.user_access_valid(( SELECT ( SELECT auth.uid() AS uid) AS uid))));

CREATE POLICY "Authenticated users can read platform settings" ON public.platform_settings AS permissive FOR SELECT TO authenticated USING (private.user_access_valid(( SELECT auth.uid() AS uid)));

CREATE POLICY "baseline editor write delete" ON public.project_baselines AS permissive FOR DELETE TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "baseline editor write insert" ON public.project_baselines AS permissive FOR INSERT TO authenticated WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "baseline editor write update" ON public.project_baselines AS permissive FOR UPDATE TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text]))))))) WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "baseline valid users read" ON public.project_baselines AS permissive FOR SELECT TO authenticated USING (private.user_access_valid(( SELECT auth.uid() AS uid)));

CREATE POLICY "project end history editors insert" ON public.project_end_date_history AS permissive FOR INSERT TO authenticated WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "project end history valid users read" ON public.project_end_date_history AS permissive FOR SELECT TO authenticated USING (private.user_access_valid(( SELECT auth.uid() AS uid)));

CREATE POLICY "plan documents delete editors" ON public.project_plan_documents AS permissive FOR DELETE TO authenticated USING ((private.user_access_valid() AND (EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.id = ( SELECT auth.uid() AS uid)) AND (up.is_active = true) AND (up.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "plan documents read valid users" ON public.project_plan_documents AS permissive FOR SELECT TO authenticated USING ((private.user_access_valid() AND (EXISTS ( SELECT 1
   FROM projects p
  WHERE (p.id = project_plan_documents.project_id)))));

CREATE POLICY "plan documents update editors" ON public.project_plan_documents AS permissive FOR UPDATE TO authenticated USING ((private.user_access_valid() AND (EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.id = ( SELECT auth.uid() AS uid)) AND (up.is_active = true) AND (up.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text]))))))) WITH CHECK ((private.user_access_valid() AND (EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.id = ( SELECT auth.uid() AS uid)) AND (up.is_active = true) AND (up.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "plan documents write editors" ON public.project_plan_documents AS permissive FOR INSERT TO authenticated WITH CHECK ((private.user_access_valid() AND (EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.id = ( SELECT auth.uid() AS uid)) AND (up.is_active = true) AND (up.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text]))))) AND (EXISTS ( SELECT 1
   FROM projects p
  WHERE (p.id = project_plan_documents.project_id)))));

CREATE POLICY "projects admin delete" ON public.projects AS permissive FOR DELETE TO authenticated USING (private.is_admin());

CREATE POLICY "projects editor insert" ON public.projects AS permissive FOR INSERT TO authenticated WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "projects editor update" ON public.projects AS permissive FOR UPDATE TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text]))))))) WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "projects valid users read" ON public.projects AS permissive FOR SELECT TO authenticated USING (private.user_access_valid(( SELECT auth.uid() AS uid)));

CREATE POLICY "reports editor write delete" ON public.quarterly_reports AS permissive FOR DELETE TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "reports editor write insert" ON public.quarterly_reports AS permissive FOR INSERT TO authenticated WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "reports editor write update" ON public.quarterly_reports AS permissive FOR UPDATE TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text]))))))) WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text, 'section_head'::text])))))));

CREATE POLICY "reports valid users read" ON public.quarterly_reports AS permissive FOR SELECT TO authenticated USING (private.user_access_valid(( SELECT auth.uid() AS uid)));

CREATE POLICY "assignments delete self or manager" ON public.user_entity_assignments AS permissive FOR DELETE TO authenticated USING ((((user_id = ( SELECT auth.uid() AS uid)) AND private.user_access_valid(( SELECT auth.uid() AS uid))) OR ((user_id <> ( SELECT auth.uid() AS uid)) AND private.can_manage_assignments())));

CREATE POLICY "assignments insert self or manager" ON public.user_entity_assignments AS permissive FOR INSERT TO authenticated WITH CHECK ((((user_id = ( SELECT auth.uid() AS uid)) AND private.user_access_valid(( SELECT auth.uid() AS uid))) OR ((user_id <> ( SELECT auth.uid() AS uid)) AND private.can_manage_assignments())));

CREATE POLICY "assignments manager update" ON public.user_entity_assignments AS permissive FOR UPDATE TO authenticated USING (private.can_manage_assignments()) WITH CHECK (private.can_manage_assignments());

CREATE POLICY "assignments self or manager read" ON public.user_entity_assignments AS permissive FOR SELECT TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND ((user_id = ( SELECT auth.uid() AS uid)) OR private.can_manage_assignments())));

CREATE POLICY "notification settings self read" ON public.user_notification_settings AS permissive FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) AND private.user_access_valid(( SELECT auth.uid() AS uid))));

CREATE POLICY "notification settings self write delete" ON public.user_notification_settings AS permissive FOR DELETE TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) AND private.user_access_valid(( SELECT auth.uid() AS uid))));

CREATE POLICY "notification settings self write insert" ON public.user_notification_settings AS permissive FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND private.user_access_valid(( SELECT auth.uid() AS uid))));

CREATE POLICY "notification settings self write update" ON public.user_notification_settings AS permissive FOR UPDATE TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) AND private.user_access_valid(( SELECT auth.uid() AS uid)))) WITH CHECK (((user_id = ( SELECT auth.uid() AS uid)) AND private.user_access_valid(( SELECT auth.uid() AS uid))));

CREATE POLICY "profile section head read" ON public.user_profiles AS permissive FOR SELECT TO authenticated USING (private.has_valid_role(ARRAY['section_head'::text]));

CREATE POLICY "profile self read" ON public.user_profiles AS permissive FOR SELECT TO authenticated USING (((id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ( SELECT private.is_admin() AS is_admin)));

CREATE POLICY "profile self update" ON public.user_profiles AS permissive FOR UPDATE TO authenticated USING (((id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ( SELECT private.is_admin() AS is_admin))) WITH CHECK (((id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ( SELECT private.is_admin() AS is_admin)));
