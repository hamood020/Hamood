# فحص مخطط Supabase الحي — 2026-11-08

> هذا الملف توثيق قراءة فقط. لم يتم تنفيذ أي تعديل على Supabase أو قاعدة SQL Server المحلية.

## النطاق الذي تم التحقق منه

المشروع: `bmwtrnosqosbkezdswcx` (Icv new)  
المخطط: `public`

### الكائنات العلائقية

- 15 جدولًا أساسيًا:
  - audit_log
  - companies
  - employee_followups
  - government_entities
  - local_content_plans
  - notifications
  - platform_settings
  - project_baselines
  - project_end_date_history
  - project_plan_documents
  - projects
  - quarterly_reports
  - user_entity_assignments
  - user_notification_settings
  - user_profiles
- عرضان (Views): `user_entity_assignments_view` و`user_management`.
- RLS مفعّل على الجداول الأساسية الخمسة عشر بحسب `pg_class.relrowsecurity`.

## علاقات مؤكدة من قيود المفاتيح الخارجية

- employee_followups.project_id → projects.id
- local_content_plans.project_id → projects.id
- notifications.project_id → projects.id
- project_baselines.project_id → projects.id
- project_end_date_history.project_id → projects.id
- project_plan_documents.project_id → projects.id
- project_plan_documents.plan_id → local_content_plans.id
- projects.government_entity_id → government_entities.id
- projects.implementing_company_id → companies.id
- quarterly_reports.project_id → projects.id
- user_entity_assignments.government_entity_id → government_entities.id
- user_entity_assignments.user_id → user_profiles.id

## نتائج مهمة لمراجعة SQL Server baseline الحالي

الملف `database/sqlserver/001-internal-baseline.sql` ليس نسخة مطابقة للمخطط الحي بعد. من الفروقات التي ظهرت في الاستعلام الحي:

1. جدول `projects` يحتوي عمود `location jsonb NOT NULL DEFAULT '{}'` غير موجود في baseline الحالي.
2. يجب مراجعة جميع الأعمدة والأنواع والقيود قبل اعتبار baseline صالحًا؛ لا يكفي تطابق أسماء الجداول.
3. يجب تمثيل العرضين `user_entity_assignments_view` و`user_management` في SQL Server كـ views بعد فحص تعريف SQL الأصلي لكل عرض.
4. RLS في PostgreSQL لا ينتقل تلقائيًا إلى SQL Server. يجب ترجمة صلاحيات الصفوف إلى Authorization policies داخل API أو آلية SQL Server مناسبة، ثم اختبارها لكل دور.
5. مفاتيح Supabase Auth ومخازن Storage ليست ضمن جداول `public`؛ نقل المستخدمين والمرفقات يتطلب مسارًا منفصلًا. لا تنقل password hashes أو مفاتيح الخدمة إلى المستودع.

## توجيه التنفيذ

- لا تشغّل baseline الحالي قبل تحديثه ومراجعته.
- لا تنشئ migrations EF Core على المخطط الحالي قبل توحيد مفتاح Identity إلى GUID ومطابقة جميع الكيانات.
- لا تفعّل `ICV_INTERNAL_API_ENABLED` في الواجهة.
- لا تُعدّل قاعدة Supabase الأصلية؛ استخدمها للقراءة والمقارنة فقط.
- لا تُنفّذ أي نقل بيانات حتى يكتمل المخطط المستهدف وخطة نقل Storage والحسابات.
