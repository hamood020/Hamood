# تصدير البيانات والمرفقات

القراءة الحالية لـ Supabase تكشف بنية الجداول وأعداد الصفوف لكنها لا توفر bytes لملفات Storage أو dump متكاملًا للبيانات في هذا الاتصال.

المطلوب من مسؤول قاعدة البيانات عبر قناة الهيئة المعتمدة: ملف pg_dump مخصص يحتوي schema وdata وsequences وviews وfunctions وtriggers. يجب تشفير الملف وتحديد checksum SHA-256 وتسليم كلمة التشفير عبر قناة منفصلة.

المطلوب من مسؤول Storage: تصدير جميع objects من bucket المرتبط بمرفقات الخطط والتقارير، مع manifest يربط storage_path وfile_size وmime_type وSHA-256. يجب مطابقة الملفات مع project_plan_documents وحقول المصدر في التقارير والخطط.

لا تصدّر auth password hashes أو service_role keys أو JWT secrets. تُنشأ حسابات النظام الداخلي من جديد مع سياسة تعيين كلمات مرور آمنة أو ربط الدليل المؤسسي.
