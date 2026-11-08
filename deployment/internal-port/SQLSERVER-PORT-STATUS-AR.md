# حالة التحويل إلى SQL Server

## مصادر تم فحصها
مستودع GitHub hamood020/Hamood، فرع main، ومشروع Supabase bmwtrnosqosbkezdswcx.

## جرد live
15 public tables، 608 صفوف وقت الفحص، وحوالي 51 migration مسجلة في live. الوظائف المنشورة: icv-new-app v4 (إيقاف endpoint قديم برسالة 410) وmanage-platform-user v9 (إدارة الحسابات والصلاحيات).

## اختلافات مهمة
ملفات migrations في المستودع لا تطابق سجل migrations الحي؛ يجب استكمال الفجوة قبل إنتاج schema مكافئ. مخطط SQL المرجعي في docs/schema-baseline-2026-10-20.sql هو PostgreSQL ولا يجوز تشغيله في SQL Server.

## قواعد لا يجوز تغييرها
- الأدوار: admin، section_head، editor، viewer، temporary_viewer.
- المستخدم المؤقت يجب أن تكون له نهاية صلاحية.
- يجب تطبيق الصلاحيات داخل API وليس الواجهة فقط.
- العمالة تُقرأ من آخر تقرير معتمد ولا تجمع تراكميًا.
- المرفقات توضع على مشاركة ملفات داخلية ACL-protected، ولا تُخزن في public web root.
- جلسة الخمول ساعتان حسب متطلب النظام، مع Cookie HttpOnly/Secure/SameSite.

## وضع الحزمة
لا يوجد بعد تحويل كامل للواجهة إلى API، ولا importer لبيانات الإنتاج، ولا نقل لبايتات Storage، ولا اختبارات parity ناجحة. لا تُعلن النسخة جاهزة للتشغيل حتى تُستكمل هذه البنود.
