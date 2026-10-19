-- Restrict application RLS policies from PUBLIC to authenticated users.
-- Applied to Supabase project bmwtrnosqosbkezdswcx on 2026-10-19.
-- Predicates are intentionally unchanged; only the policy role target is narrowed.

ALTER POLICY "companies valid users read" ON public.companies TO authenticated;
ALTER POLICY "followups admin editor insert" ON public.employee_followups TO authenticated;
ALTER POLICY "followups admin editor read" ON public.employee_followups TO authenticated;
ALTER POLICY "followups admin editor update" ON public.employee_followups TO authenticated;
ALTER POLICY "entities valid users read" ON public.government_entities TO authenticated;
ALTER POLICY "plans editor write" ON public.local_content_plans TO authenticated;
ALTER POLICY "plans valid users read" ON public.local_content_plans TO authenticated;
ALTER POLICY "baseline editor write" ON public.project_baselines TO authenticated;
ALTER POLICY "baseline valid users read" ON public.project_baselines TO authenticated;
ALTER POLICY "project end history editors insert" ON public.project_end_date_history TO authenticated;
ALTER POLICY "project end history valid users read" ON public.project_end_date_history TO authenticated;
ALTER POLICY "projects editor insert" ON public.projects TO authenticated;
ALTER POLICY "projects editor update" ON public.projects TO authenticated;
ALTER POLICY "projects valid users read" ON public.projects TO authenticated;
ALTER POLICY "reports editor write" ON public.quarterly_reports TO authenticated;
ALTER POLICY "reports valid users read" ON public.quarterly_reports TO authenticated;
