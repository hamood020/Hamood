-- Phase 1 behaviour checks. Each ERROR printed below a "(expect …)" or rule line is the expected refusal:
-- T2 temp viewer needs an end date, T3 metrics are database-only, T7b status open/closed, T9 editor cannot
-- assign others, T9b no self-promotion, T11 head cannot assign the admin, T17 viewers have no tasks,
-- T20 lock on approved reports, T22b notifications are read-only except read_at, T28 EXPIRY_REQUIRED.
\set ON_ERROR_STOP 0
\pset tuples_only on
-- helpers: run as a given user
CREATE OR REPLACE FUNCTION pg_temp.as_user(u text) RETURNS void LANGUAGE sql AS $$ SELECT set_config('request.jwt.claim.sub', u, false); $$;
-- section head user
INSERT INTO auth.users(id,email) VALUES ('00000000-0000-0000-0000-0000000000cc','head@icv-new.local');
SELECT 'T1 self-signup profile', role, is_active FROM public.user_profiles WHERE id='00000000-0000-0000-0000-0000000000cc';
UPDATE public.user_profiles SET role='section_head', is_active=true WHERE id='00000000-0000-0000-0000-0000000000cc';
SELECT 'T2 temp viewer without end date:';
UPDATE public.user_profiles SET role='temporary_viewer' WHERE id='00000000-0000-0000-0000-00000000000f';

SET ROLE authenticated;
-- editor
SELECT pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
SELECT 'T3 editor writes metric column:';
UPDATE public.projects SET total_spend = 1 WHERE id='7022f5ea-8dfb-453b-b1e6-8a7665b0a19a';
SELECT 'T4 editor edits name twice (expect 1 audit row):';
UPDATE public.projects SET project_name='مشروع ليما 2' WHERE id='7022f5ea-8dfb-453b-b1e6-8a7665b0a19a';
UPDATE public.projects SET project_name='مشروع ليما 3' WHERE id='7022f5ea-8dfb-453b-b1e6-8a7665b0a19a';
SELECT 'T5 editor edits approved report (lock off):';
UPDATE public.quarterly_reports SET report_data = jsonb_set(report_data,'{purchases,made_in_oman}','100000') WHERE id='75cbe935-4b61-498a-be29-a5f8d19d3358';
SELECT 'T5b goods after edit', round(goods_pct,2), made_in_oman_status FROM public.projects WHERE id='7022f5ea-8dfb-453b-b1e6-8a7665b0a19a';
SELECT 'T6 editor adds company:';
INSERT INTO public.companies(name) VALUES ('شركة جديدة من الأخصائي');
SELECT 'T7 editor creates task:';
INSERT INTO public.employee_followups(assigned_to, created_by, action_required, status) VALUES ('00000000-0000-0000-0000-00000000000e','00000000-0000-0000-0000-00000000000e','مهمة','open');
SELECT 'T7b bad status:';
INSERT INTO public.employee_followups(assigned_to, created_by, action_required, status) VALUES ('00000000-0000-0000-0000-00000000000e','00000000-0000-0000-0000-00000000000e','مهمة','مفتوح');
SELECT 'T8 editor reads audit (expect 0):', count(*) FROM public.audit_log;
SELECT 'T9 editor assigns entities to another user:';
SELECT public.set_user_entity_assignments('00000000-0000-0000-0000-00000000000f', ARRAY['68a312e7-6696-47fb-baed-57efc28ade1f']::uuid[]);
SELECT 'T9b editor self role escalation:';
UPDATE public.user_profiles SET role='admin' WHERE id='00000000-0000-0000-0000-00000000000e';

-- section head
SELECT pg_temp.as_user('00000000-0000-0000-0000-0000000000cc');
SELECT 'T10 head assigns to editor:';
SELECT public.set_user_entity_assignments('00000000-0000-0000-0000-00000000000e', ARRAY['68a312e7-6696-47fb-baed-57efc28ade1f','6792f194-d519-4aa6-90a2-77f8eed9dcfa']::uuid[]);
SELECT 'T10b assignments of editor:', count(*) FROM public.user_entity_assignments WHERE user_id='00000000-0000-0000-0000-00000000000e';
SELECT 'T11 head assigns to admin (expect denied):';
SELECT public.set_user_entity_assignments('00000000-0000-0000-0000-00000000000a', ARRAY[]::uuid[]);
SELECT 'T12 head reads profiles:', count(*) FROM public.user_profiles;
SELECT 'T13 head reads audit (specialist rows only):', count(*), string_agg(DISTINCT actor_user_id::text, ',') FROM public.audit_log;
SELECT 'T14 head edits project:';
UPDATE public.projects SET notes='ملاحظة رئيس القسم' WHERE id='7022f5ea-8dfb-453b-b1e6-8a7665b0a19a';
SELECT 'T15 head reads followups:', count(*) FROM public.employee_followups;

-- viewer
SELECT pg_temp.as_user('00000000-0000-0000-0000-00000000000f');
SELECT 'T16 viewer reads projects:', count(*) FROM public.projects;
SELECT 'T17 viewer creates task:';
INSERT INTO public.employee_followups(assigned_to, created_by, action_required) VALUES ('00000000-0000-0000-0000-00000000000f','00000000-0000-0000-0000-00000000000f','x');
SELECT 'T18 viewer edits project:';
UPDATE public.projects SET notes='x' WHERE id='7022f5ea-8dfb-453b-b1e6-8a7665b0a19a';
SELECT 'T18b rows changed by viewer:', count(*) FROM public.projects WHERE notes='x';

-- admin: lock on, editor blocked
SELECT pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
UPDATE public.platform_settings SET settings = jsonb_set(settings,'{reports,lockApproved}','true');
SELECT 'T19 admin changes report status -> notify creator:';
UPDATE public.quarterly_reports SET status='مرفوض' WHERE id='994f287e-5dac-4dba-b380-ce81d22bdc8d';
SELECT 'T19b compliance after rejecting Q2', round(sme_pct,3), round(total_spend,2) FROM public.projects WHERE id='7022f5ea-8dfb-453b-b1e6-8a7665b0a19a';
UPDATE public.quarterly_reports SET status='معتمد' WHERE id='994f287e-5dac-4dba-b380-ce81d22bdc8d';
SELECT pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
SELECT 'T20 editor edits approved report with lock on:';
UPDATE public.quarterly_reports SET notes='x' WHERE id='75cbe935-4b61-498a-be29-a5f8d19d3358';
SELECT 'T21 editor notifications:', count(*), string_agg(kind||':'||title, ' | ') FROM public.notifications;
SELECT 'T22 editor marks read:';
UPDATE public.notifications SET read_at = now();
SELECT 'T22b editor rewrites notification title:';
UPDATE public.notifications SET title = 'x';
RESET ROLE;
SELECT 'T23 settings coefficient change recomputes all:';
UPDATE public.platform_settings SET settings = jsonb_set(settings,'{local,subcontractForeign}','70');
SELECT 'T23b LC after foreign 70%', round(total_local_content,2) FROM public.projects WHERE id='7022f5ea-8dfb-453b-b1e6-8a7665b0a19a';
SELECT 'T24 notifications job:', private.generate_notifications();
SELECT 'T25 purge job:', private.purge_audit_log();
SELECT 'T26 audit rows by table/op:', string_agg(table_name||':'||operation||'='||c, ', ') FROM (SELECT table_name, operation, count(*) c FROM public.audit_log GROUP BY 1,2) x;
SELECT 'T27 cron jobs:', string_agg(jobname||' '||schedule, ', ') FROM cron.job;
SELECT 'T28 guarded fn temp viewer w/o expiry:';
SELECT public.admin_update_user_profile_guarded('00000000-0000-0000-0000-00000000000f','v','temporary_viewer',true,null,null,'00000000-0000-0000-0000-00000000000a');
SELECT 'T28b guarded fn section_head:';
SELECT public.admin_update_user_profile_guarded('00000000-0000-0000-0000-00000000000f','v','section_head',true,null,null,'00000000-0000-0000-0000-00000000000a');
SELECT 'T28c', role FROM public.user_profiles WHERE id='00000000-0000-0000-0000-00000000000f';
