-- Applied to Supabase project bmwtrnosqosbkezdswcx on 2026-10-20.
-- Uses reports.dueDays for the due date and reports.lateAfter as a grace period before overdue classification.
CREATE OR REPLACE FUNCTION private.generate_notifications()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  s jsonb;
  v_today date := (now() AT TIME ZONE 'Asia/Muscat')::date;
  v_cur_q integer := extract(quarter FROM v_today)::integer;
  v_q integer; v_y integer; v_q_start date; v_q_end date; v_deadline date; v_late_date date;
  v_count integer := 0; v_n integer;
BEGIN
  SELECT settings INTO s FROM public.platform_settings WHERE id = 'global';
  s := coalesce(s, '{}'::jsonb);
  v_q := CASE WHEN v_cur_q = 1 THEN 4 ELSE v_cur_q - 1 END;
  v_y := extract(year FROM v_today)::integer - CASE WHEN v_cur_q = 1 THEN 1 ELSE 0 END;
  v_q_start := make_date(v_y, (v_q - 1) * 3 + 1, 1);
  v_q_end := (v_q_start + interval '3 months' - interval '1 day')::date;
  v_deadline := v_q_end + greatest(0, coalesce((s->'reports'->>'dueDays')::integer, 30));
  v_late_date := v_deadline + greatest(0, coalesce((s->'reports'->>'lateAfter')::integer, 7));

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

  INSERT INTO public.notifications(user_id, kind, title, body, project_id, dedupe_key)
  SELECT sc.user_id, CASE WHEN v_today > v_late_date THEN 'delay' ELSE 'report_due' END,
         CASE WHEN v_today > v_late_date THEN 'تقرير متأخر' ELSE 'تقرير مستحق قريبًا' END,
         sc.project_name || ' — تقرير Q' || v_q || ' ' || v_y ||
           CASE WHEN v_today > v_late_date THEN ' متأخر منذ ' || (v_today - v_late_date) || ' يوم بعد مهلة السماح'
                WHEN v_today > v_deadline THEN ' تجاوز موعد الاستحقاق منذ ' || (v_today - v_deadline) || ' يوم (ضمن مهلة السماح)'
                ELSE ' مستحق خلال ' || (v_deadline - v_today) || ' يوم' END,
         sc.project_id,
         (CASE WHEN v_today > v_late_date THEN 'delay:' ELSE 'report_due:' END) || sc.project_id || ':' || v_y || 'Q' || v_q
  FROM pg_temp._icv_scope sc
  WHERE sc.start_date IS NOT NULL AND sc.start_date <= v_q_end
    AND (sc.end_date IS NULL OR sc.end_date >= v_q_start)
    AND NOT EXISTS (
      SELECT 1 FROM public.quarterly_reports r
      WHERE r.project_id = sc.project_id AND r.annual_period = v_y::text
        AND nullif(regexp_replace(coalesce(r.quarter, ''), '\D', '', 'g'), '')::integer = v_q)
    AND CASE WHEN v_today > v_late_date
             THEN sc.want_delay AND coalesce((s->'notifications'->>'delay')::boolean, true)
             ELSE sc.want_due AND coalesce((s->'notifications'->>'reportDue')::boolean, true)
                  AND (v_deadline - v_today <= sc.days_before OR v_today > v_deadline) END
  ON CONFLICT (user_id, dedupe_key) DO NOTHING;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_count := v_count + v_n;

  INSERT INTO public.notifications(user_id, kind, title, body, project_id, dedupe_key)
  SELECT sc.user_id, 'project_expiry', 'مشروع يقترب من نهايته',
         sc.project_name || ' — ينتهي في ' || to_char(sc.end_date, 'DD/MM/YYYY'),
         sc.project_id, 'project_expiry:' || sc.project_id || ':' || sc.end_date
  FROM pg_temp._icv_scope sc
  WHERE sc.want_expiry AND coalesce((s->'notifications'->>'projectExpiry')::boolean, true)
    AND sc.end_date BETWEEN v_today AND v_today + sc.days_before
  ON CONFLICT (user_id, dedupe_key) DO NOTHING;
  GET DIAGNOSTICS v_n = ROW_COUNT; v_count := v_count + v_n;

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
  DELETE FROM public.notifications WHERE read_at < now() - interval '90 days';
  RETURN v_count;
END;
$function$
;
