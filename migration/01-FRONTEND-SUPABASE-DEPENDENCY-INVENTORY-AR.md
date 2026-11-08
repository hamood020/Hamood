# جرد اعتماد الواجهة على Supabase وخطة نقل العمليات

**النطاق:** ملفات `public/` في حزمة التحويل، جرد ساكن للشفرة وليس اختبار تشغيل.

## الخلاصة التنفيذية

- الملفات التي تحتوي استدعاءات بيانات/مصادقة: **12**.
- أسماء الجداول/العروض المختلفة المكتشفة: **19**.
- استدعاءات RPC المختلفة: **5**.
- عمليات Auth المختلفة: **6**.
- لا يجوز توصيل الواجهة بقاعدة SQL Server مباشرة؛ كل الوصول يمر عبر API مع تحقق صلاحيات على الخادم.

## توزيع الاعتماد حسب الملف

| الملف | الجداول والعروض | RPC | Auth |
|---|---|---|---|
| companies-page-final.js | companies, projects, quarterly_reports | set_company_contact_points | — |
| icv-common.js | — | get_contact_points | — |
| icv-idle.js | — | — | getSession, signOut |
| icv-structure-v13.js | government_entities, companies, user_entity_assignments_view | — | — |
| icv-team.js | user_profiles, government_entities, companies, projects, audit_log, user_entity_assignments_view, quarterly_reports, employee_followups, notifications | — | — |
| index.html | user_profiles, projects, quarterly_reports, local_content_plans, government_entities, companies, audit_log | — | signInWithPassword, signOut, getSession, onAuthStateChange |
| plan.html | user_profiles, local_content_plans, project_plan_documents, projects, project-plan-documents, government_entities | — | getSession, signOut |
| ptlc-access.js | user_profiles, employee_followups, user_entity_assignments_view, projects, quarterly_reports, local_content_plans, government_entities, user_management, user_entity_assignments | set_my_entity_assignments, set_user_entity_assignments | getSession, signInWithPassword, signOut, updateUser |
| ptlc-project-pages.js | projects, government_entities, companies, local_content_plans, quarterly_reports, project_end_date_history, employee_followups, user_profiles, project-report-documents | set_government_entity_contact_details | getUser |
| report-form.html | platform_settings, user_profiles, projects, quarterly_reports, project-report-documents | — | signOut, getSession |
| settings-page.js | platform_settings, user_notification_settings, government_entities, user_entity_assignments, projects, project_plan_documents, quarterly_reports, project-plan-documents, project-report-documents | set_my_entity_assignments | getSession, onAuthStateChange |

ملاحظة: تم استبعاد ملف vendor من قائمة العمليات الفعلية؛ قد تظهر فيه مطابقات نصية لا تمثل اتصالًا بالخلفية. كما أن هذا الجرد لا يكشف الاستدعاءات التي تُنشأ ديناميكيًا.

## قاموس العمليات المطلوب في API

| المجال | موارد/عمليات ظاهرة في الواجهة | الأولوية |
|---|---|---|
| الهوية والجلسات | تسجيل الدخول، الجلسة الحالية، تسجيل الخروج، تغيير كلمة المرور، تغير حالة المصادقة | P0 |
| المستخدمون والصلاحيات | user_profiles، user_management، user_entity_assignments، user_entity_assignments_view، تعيين الجهات | P0 |
| المشاريع | projects، عرض/إنشاء/تعديل المشروع، ربط الجهة والشركة، الحالة وتواريخ الإنجاز | P0 |
| التقارير | quarterly_reports، قراءة/إنشاء/تعديل/اعتماد التقارير | P0 |
| الملفات | project-report-documents، project-plan-documents | P0 |
| الخطط | local_content_plans، project_plan_documents | P1 |
| الجهات والشركات | government_entities، companies، نقاط الاتصال | P1 |
| المتابعة والإشعارات | employee_followups، notifications، user_notification_settings | P1 |
| الإعدادات والتدقيق | platform_settings، audit_log | P1 |
| السجل التاريخي | project_end_date_history | P2 |

## وظائف قاعدة البيانات التي تحتاج بدائل خادمية

- `set_my_entity_assignments` — تعيين الجهات للمستخدم الحالي.
- `set_user_entity_assignments` — تعيين الجهات لمستخدم بواسطة مسؤول مخوّل.
- `get_contact_points` — قراءة نقاط الاتصال.
- `set_company_contact_points` — تحديث نقاط اتصال الشركة.
- `set_government_entity_contact_details` — تحديث بيانات اتصال الجهة الحكومية.

يجب أن تتحقق كل عملية من هوية المستخدم ودوره ونطاق الجهات المسموح بها، وأن تسجل التغييرات الحساسة في سجل التدقيق.

## تصميم API المقترح

المسارات التالية عقد أولية للتنفيذ وليست ادعاءً بأنها موجودة حاليًا:

```http
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
POST   /api/auth/change-password
GET    /api/projects
GET    /api/projects/{id}
POST   /api/projects
PUT    /api/projects/{id}
GET    /api/projects/{id}/reports
POST   /api/projects/{id}/reports
POST   /api/reports/{id}/submit
POST   /api/reports/{id}/approve
GET    /api/projects/{id}/plans
POST   /api/projects/{id}/plans
GET    /api/government-entities
GET    /api/companies
GET    /api/users
PUT    /api/users/{id}/assignments
GET    /api/audit
POST   /api/files/reports
POST   /api/files/plans
GET    /api/files/{id}
```

## ضوابط يجب الحفاظ عليها

- التحقق من الدور ونطاق الجهات على الخادم، وعدم الاكتفاء بإخفاء الأزرار في المتصفح.
- مؤشرات المحتوى المحلي تُحسب من التقارير المعتمدة فقط وفق قواعد النظام المعتمدة.
- عدد العاملين الحالي يؤخذ من آخر تقرير معتمد، وليس جمعًا تراكميًا.
- كل رفع/تنزيل ملف يمر عبر API ويتحقق من صلاحية المستخدم للمشروع؛ التخزين يكون على مشاركة داخلية بصلاحيات NTFS، وليس مسارًا عامًا.
- تسجيل أحداث الإدارة والاعتماد وتغيير الصلاحيات في audit_log.
- مهلة الخمول المطلوبة ساعتان؛ يلزم إنهاء الجلسة على الخادم أيضًا، وليس الاعتماد على مؤقت الواجهة فقط.
- لا تُنقل مفاتيح Supabase السرية أو كلمات المرور أو تجزئات مصادقة المستخدمين إلى المستودع.

## موانع إغلاق التحويل

1. استكمال جرد migrations الحية ومطابقتها مع ملفات المستودع قبل اعتماد مخطط SQL Server.
2. تنفيذ API ثم تعديل كل استدعاءات الواجهة لإزالة supabase-js والاتصال المباشر.
3. تنفيذ ترحيل البيانات مع مطابقة أعداد السجلات والعلاقات.
4. تصدير ملفات Storage وربطها بمعرّفات داخلية وصلاحيات وصول.
5. اختبار الأدوار الخمسة، انتهاء المستخدم المؤقت، نطاق الجهات، الحسابات، الاعتماد، والتقارير.
6. اختبار متكامل على Windows Server/IIS/SQL Server قبل تحويل المستخدمين.

**الحالة:** تحليل ساكن موثق للشفرة. لا تعني هذه الوثيقة أن المسارات المقترحة نُفذت أو اختُبرت.
