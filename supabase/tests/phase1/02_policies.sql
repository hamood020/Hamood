CREATE POLICY "audit admin read" ON public.audit_log AS PERMISSIVE FOR SELECT TO authenticated USING ((private.is_admin() AND private.user_access_valid(( SELECT ( SELECT auth.uid() AS uid) AS uid))));
CREATE POLICY "companies admin write delete" ON public.companies AS PERMISSIVE FOR DELETE TO authenticated USING (private.is_admin());
CREATE POLICY "companies admin write insert" ON public.companies AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (private.is_admin());
CREATE POLICY "companies admin write update" ON public.companies AS PERMISSIVE FOR UPDATE TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "companies valid users read" ON public.companies AS PERMISSIVE FOR SELECT TO authenticated USING (private.user_access_valid(( SELECT auth.uid() AS uid)));
CREATE POLICY "followups admin editor insert" ON public.employee_followups AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (created_by = ( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text])))))));
CREATE POLICY "followups admin editor read" ON public.employee_followups AS PERMISSIVE FOR SELECT TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text])))))));
CREATE POLICY "followups admin editor update" ON public.employee_followups AS PERMISSIVE FOR UPDATE TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text]))))))) WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text])))))));
CREATE POLICY "entities admin editor insert valid users" ON public.government_entities AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((private.user_access_valid(( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND (up.role = ANY (ARRAY['admin'::text, 'editor'::text])) AND (up.is_active = true))))));
CREATE POLICY "entities admin write delete" ON public.government_entities AS PERMISSIVE FOR DELETE TO authenticated USING (private.is_admin());
CREATE POLICY "entities admin write update" ON public.government_entities AS PERMISSIVE FOR UPDATE TO authenticated USING (private.is_admin()) WITH CHECK (private.is_admin());
CREATE POLICY "entities valid users read" ON public.government_entities AS PERMISSIVE FOR SELECT TO authenticated USING (private.user_access_valid(( SELECT auth.uid() AS uid)));
CREATE POLICY "plans editor write delete" ON public.local_content_plans AS PERMISSIVE FOR DELETE TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text])))))));
CREATE POLICY "plans editor write insert" ON public.local_content_plans AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text])))))));
CREATE POLICY "plans editor write update" ON public.local_content_plans AS PERMISSIVE FOR UPDATE TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text]))))))) WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text])))))));
CREATE POLICY "plans valid users read" ON public.local_content_plans AS PERMISSIVE FOR SELECT TO authenticated USING (private.user_access_valid(( SELECT auth.uid() AS uid)));
CREATE POLICY "Admins can insert platform settings" ON public.platform_settings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((private.is_admin() AND private.user_access_valid(( SELECT ( SELECT auth.uid() AS uid) AS uid))));
CREATE POLICY "Admins can update platform settings" ON public.platform_settings AS PERMISSIVE FOR UPDATE TO authenticated USING ((private.is_admin() AND private.user_access_valid(( SELECT ( SELECT auth.uid() AS uid) AS uid)))) WITH CHECK ((private.is_admin() AND private.user_access_valid(( SELECT ( SELECT auth.uid() AS uid) AS uid))));
CREATE POLICY "Authenticated users can read platform settings" ON public.platform_settings AS PERMISSIVE FOR SELECT TO authenticated USING (private.user_access_valid(( SELECT auth.uid() AS uid)));
CREATE POLICY "projects admin delete" ON public.projects AS PERMISSIVE FOR DELETE TO authenticated USING (private.is_admin());
CREATE POLICY "projects editor insert" ON public.projects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text])))))));
CREATE POLICY "projects editor update" ON public.projects AS PERMISSIVE FOR UPDATE TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text]))))))) WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text])))))));
CREATE POLICY "projects valid users read" ON public.projects AS PERMISSIVE FOR SELECT TO authenticated USING (private.user_access_valid(( SELECT auth.uid() AS uid)));
CREATE POLICY "reports editor write delete" ON public.quarterly_reports AS PERMISSIVE FOR DELETE TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text])))))));
CREATE POLICY "reports editor write insert" ON public.quarterly_reports AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text])))))));
CREATE POLICY "reports editor write update" ON public.quarterly_reports AS PERMISSIVE FOR UPDATE TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text]))))))) WITH CHECK ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND (EXISTS ( SELECT 1
   FROM user_profiles u
  WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::text, 'editor'::text])))))));
CREATE POLICY "reports valid users read" ON public.quarterly_reports AS PERMISSIVE FOR SELECT TO authenticated USING (private.user_access_valid(( SELECT auth.uid() AS uid)));
CREATE POLICY "assignments delete self or manager" ON public.user_entity_assignments AS PERMISSIVE FOR DELETE TO authenticated USING ((((user_id = ( SELECT auth.uid() AS uid)) AND private.user_access_valid(( SELECT auth.uid() AS uid))) OR ((user_id <> ( SELECT auth.uid() AS uid)) AND private.can_manage_assignments())));
CREATE POLICY "assignments insert self or manager" ON public.user_entity_assignments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((((user_id = ( SELECT auth.uid() AS uid)) AND private.user_access_valid(( SELECT auth.uid() AS uid))) OR ((user_id <> ( SELECT auth.uid() AS uid)) AND private.can_manage_assignments())));
CREATE POLICY "assignments self or manager read" ON public.user_entity_assignments AS PERMISSIVE FOR SELECT TO authenticated USING ((private.user_access_valid(( SELECT auth.uid() AS uid)) AND ((user_id = ( SELECT auth.uid() AS uid)) OR private.can_manage_assignments())));
CREATE POLICY "notification settings self read" ON public.user_notification_settings AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid)) AND private.user_access_valid(( SELECT auth.uid() AS uid))));
CREATE POLICY "profile self read" ON public.user_profiles AS PERMISSIVE FOR SELECT TO authenticated USING (((id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ( SELECT private.is_admin() AS is_admin)));
CREATE POLICY "profile self update" ON public.user_profiles AS PERMISSIVE FOR UPDATE TO authenticated USING (((id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ( SELECT private.is_admin() AS is_admin))) WITH CHECK (((id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ( SELECT private.is_admin() AS is_admin)));
CREATE POLICY "Editors and admins can upload project report documents" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((bucket_id = 'project-report-documents'::text) AND private.user_access_valid(auth.uid()) AND (EXISTS ( SELECT 1
   FROM user_profiles up
  WHERE ((up.id = auth.uid()) AND (up.is_active = true) AND (up.role = ANY (ARRAY['admin'::text, 'editor'::text])))))));
CREATE POLICY "Valid users can read project report documents" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (((bucket_id = 'project-report-documents'::text) AND private.user_access_valid(auth.uid())));
