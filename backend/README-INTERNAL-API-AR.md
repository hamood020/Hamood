# بيئة API الداخلية — منصة متابعة المحتوى المحلي

## عزل كامل عن الموقع الحالي

- هذا العمل محفوظ في الفرع `internal-sqlserver-api-work` المبني على فرع التحويل الداخلي.
- لا توجد أي تغييرات على `main` أو إعدادات GitHub Pages أو قاعدة Supabase الحالية.
- لا تدمج هذا الفرع ولا تنشره على GitHub Pages؛ النشر المقصود لاحقًا على خادم داخلي تجريبي.
- قاعدة البيانات المسماة في أمثلة الاتصال هي `ICV_Internal_Staging` وليست قاعدة الإنتاج.
- لا يحتوي المستودع على كلمات مرور أو مفاتيح اتصال حقيقية.

## ما أُضيف في هذه الدفعة

- مشروع ASP.NET Core Web API يستهدف .NET 8.
- اتصال SQL Server عبر إعداد محمي خارج ملفات المصدر.
- ASP.NET Core Identity مع Cookie جلسة HttpOnly وSecure ومدة ساعتين.
- حماية CSRF للطلبات غير الآمنة عبر `X-CSRF-TOKEN`.
- نقطة فحص صحة `GET /api/health`.
- سياق Identity منفصل ومسمّى الجداول بوضوح.

## إعداد محلي تجريبي

1. تثبيت .NET 8 SDK وSQL Server Developer/Express على جهاز الاختبار.
2. إنشاء قاعدة منفصلة باسم `ICV_Internal_Staging`.
3. ضبط متغير البيئة `ConnectionStrings__IcvSqlServer` على اتصال قاعدة الاختبار.
4. من مجلد `backend/Icv.Api` نفّذ:
   ```powershell
   dotnet restore
   dotnet build
   dotnet ef migrations add InitialIdentity --output-dir Data/Migrations
   dotnet ef database update
   dotnet run
   ```
5. تحقق من `/api/health` على عنوان الخدمة المحلي.

## حدود هذه الدفعة — لا تعتبر تحويلًا مكتملًا

- لم تُنفّذ بعد كيانات وواجهات CRUD لجداول المشاريع والتقارير والخطط والجهات والشركات والإعدادات والتدقيق والمتابعة والإشعارات.
- لم تُحوّل صفحات الواجهة من استدعاءات Supabase إلى API.
- لم تُنقل بيانات Supabase أو ملفات Storage.
- يلزم ربط المستخدمين بأدوار المنصة الخمسة وملف `user_profiles`، وفرض انتهاء `temporary_viewer` على الخادم.
- يلزم تنفيذ تحقق الصلاحيات على جميع الجهات: `admin`, `section_head`, `editor` تعديل؛ `viewer`, `temporary_viewer` قراءة فقط.
- يلزم إضافة حماية CSRF token issuance/validation integration في الواجهة قبل اختبار طلبات Cookie.
- لا تستخدم `EnsureCreated` أو ترحيلات هذا المشروع على أي قاعدة إنتاج.

## قاعدة عدم التأثير على المنصة الحالية

لا يتم تحويل أي مستخدم أو تغيير DNS أو تعديل GitHub Pages أو Supabase. جميع التجارب على فرع منفصل وخادم وقاعدة اختبار منفصلين. الانتقال لا يحدث إلا بعد موافقة صريحة واختبارات قبول ونسخة احتياطية وخطة رجوع.