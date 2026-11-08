# مراجعة ومعالجة API وEF Core — 2026-11-08

## نطاق التغيير
- جميع التعديلات في الفرع `internal-sqlserver-api-work` فقط.
- لم يتم تعديل `main` أو الموقع المنشور أو Supabase.
- لا يتم فرض نطاق المشاريع بناءً على `user_entity_assignments`: ظهور المشاريع لجميع المستخدمين النشطين المسجلين يبقى كما هو مطلوب. التحكم في الإضافة والتعديل والاعتماد يبقى حسب أدوار المنصة.

## ما عولج في هذه الدفعة
1. ضبط دقة الحقول العشرية في `Project` لتطابق SQL Server baseline:
   - `progress_pct decimal(7,4)`
   - `achieved_omani decimal(12,4)`
   - حقول النسب `decimal(9,6)`
   - حقول المبالغ `decimal(18,2)`
2. ضبط حقول `DateTimeOffset` لكيانات الأعمال على `datetimeoffset(0)` مثل baseline، مع استثناء جداول ASP.NET Identity.
3. إضافة حقول إغلاق المتابعة إلى `EmployeeFollowup`: `resolved_at`, `resolved_by`, `resolution_note`, `resolved_by_name`.
4. استخدام EF Core لإضافة سجل تاريخ نهاية المشروع بدل SQL نصي مباشر، مع تجنب محاولة تسجيل تاريخ جديد فارغ في العمود غير القابل لـ NULL.
5. جعل تعديل التقرير وسجل التدقيق الخاص به ضمن معاملة واحدة.
6. استكمال إدخال جهة الإسناد وحالة الإغلاق في واجهات ملاحظات المشروع.
7. إزالة قيد CHECK المكرر للإشعارات من سكربت baseline الجديد. لا تعِد تشغيل سكربت الإنشاء على قاعدة موجودة.

## ما لم يُختبر بعد
- لم يتم تشغيل `dotnet build` بعد هذه التعديلات من بيئة Windows/Visual Studio.
- لم يتم تنفيذ اختبارات API فعلية على `ICV_Local_Test` لهذه النسخة.
- لم تكتمل بعد دورة إنشاء مستخدم Identity وملف `user_profiles` داخل معاملة واحدة.
- لم تكتمل بعد واجهات CRUD لكل الجداول، ولا تزال بعض وظائف الواجهة مرتبطة بـ Supabase.
- يلزم استكمال التحقق من أنواع الملفات وفحصها ضد البرمجيات الضارة قبل تشغيل رفع الملفات على خادم داخلي.
- يلزم اختبار CSRF وتسجيل الدخول وانتهاء صلاحية الحساب والجلسة من الواجهة الفعلية.
- يلزم التحقق من تطابق كل الأعمدة مع مخطط Supabase الحي؛ baseline مبني على snapshot موثق وليس export كاملًا من المصدر الحي.

## ترتيب العمل التالي
1. Build وتشغيل API على قاعدة الاختبار.
2. اختبارات تسجيل الدخول والجلسات والأدوار.
3. اختبارات CRUD للمشاريع والتقارير والخطط والجهات والشركات والمتابعات.
4. إكمال Provisioning المستخدمين وإدارة الجداول المساندة.
5. اختبار رفع وتنزيل الملفات على NTFS خاص.
6. استكمال تحويل الواجهة تدريجيًا ثم اختبار قبول شامل.

لا تفعّل `ICV_INTERNAL_API_ENABLED` ولا تنقل بيانات فعلية ولا تدمج الفرع قبل اجتياز الاختبارات وموافقة المستخدم.


## Follow-up remediation pass

- Report creation now always starts in `received`; client-supplied status and submitted date are not accepted as workflow transitions.
- Report editing no longer changes report status or submitted date. Status changes remain limited to the submit and approve endpoints; approved reports remain locked.
- Project creation now persists the optional `local_content_plan` flag.
- Report attachment endpoint now allows only PDF, XLS, XLSX, DOC, and DOCX extensions, checks the corresponding file signature, enforces the 20 MB limit, generates server-side filenames, validates the final storage path, and removes a newly written file if the database save fails.
- Attachment changes are written to the audit log. Downloads remain authenticated, use attachment metadata from the report, validate the expected project/report folder, and return private no-store responses.
- File signature checks are a first-pass format validation, not malware scanning. Before production deployment, add institution-approved antivirus/content scanning and confirm NTFS ACLs restrict the storage root to the API service account and authorized administrators.
- These changes have not yet been compiled or integration-tested on the user's machine. Do not enable frontend API mode or deploy.
