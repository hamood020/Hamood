/* ICV bilingual UI layer: Arabic/English, RTL/LTR, persistent per browser. */
(function () {
  "use strict";
  const KEY = "icv-ui-language";
  const dict = {
    "متابعة المحتوى المحلي":"Local Content Follow-up",
    "الصفحة الرئيسية":"Dashboard","المشاريع":"Projects","الجهات الحكومية":"Government Entities",
    "الشركات":"Companies","التقارير الربع سنوية":"Quarterly Reports","خطط المحتوى المحلي":"Local Content Plans",
    "متابعة الموظفين":"Employee Follow-up","سجل التدقيق":"Audit Log","ملفي الشخصي":"My Profile",
    "إدارة المستخدمين":"User Management","المحتوى المحلي":"Local Content","الإعدادات":"Settings",
    "ملفات الجهات الحكومية":"Government Entity Profiles","تسجيل الدخول":"Sign in","البريد الإلكتروني":"Email",
    "كلمة المرور":"Password","دخول":"Sign in","تسجيل الخروج":"Sign out","بحث":"Search","بحث...":"Search...",
    "حفظ":"Save","حفظ التغييرات":"Save changes","إلغاء":"Cancel","إغلاق":"Close","إضافة":"Add",
    "إضافة مشروع":"Add project","إضافة شركة":"Add company","إضافة جهة":"Add entity","تعديل":"Edit",
    "حذف":"Delete","عرض":"View","عرض الكل":"Show all","تحديث":"Refresh","تصدير Excel":"Export Excel",
    "تحميل":"Download","رفع ملف":"Upload file","السنة":"Year","الربع":"Quarter","الحالة":"Status",
    "اسم المشروع":"Project name","رقم المناقصة":"Tender number","قيمة المشروع":"Project value",
    "الجهة الحكومية":"Government entity","الشركة المنفذة":"Implementing company","تاريخ البداية":"Start date",
    "تاريخ الانتهاء":"End date","القيمة الإجمالية":"Total value","الإجمالي":"Total","النسبة":"Percentage",
    "عدد المشاريع":"Number of projects","إجمالي قيمة المشاريع":"Total project value","إجمالي الصرف":"Total expenditure",
    "المحتوى المحلي المستهدف":"Target local content","المحتوى المحلي الفعلي":"Actual local content",
    "أفضل 3 مشاريع حسب الاستيفاء":"Top 3 projects by compliance","أعلى الجهات إنفاقًا":"Top entities by expenditure",
    "أعلى الشركات إنفاقًا":"Top companies by expenditure","عام":"General","المستخدمون والصلاحيات":"Users and permissions",
    "الإشعارات":"Notifications","البيانات المرجعية":"Reference data","النسخ الاحتياطي والسجل":"Backup and audit log",
    "إعدادات المنصة":"Platform settings","اسم المنصة":"Platform name","الجهة المالكة / المشغلة":"Owning / operating entity",
    "اللغة":"Language","العربية":"Arabic","العملة":"Currency","ريال عماني (OMR)":"Omani Rial (OMR)",
    "دولار أمريكي (USD)":"US Dollar (USD)","السنة المالية":"Fiscal year","المنطقة الزمنية":"Time zone",
    "مسقط — UTC+4":"Muscat — UTC+4","تنسيق التاريخ":"Date format","رابط الشعار":"Logo URL",
    "وضع العرض المختصر":"Compact mode","حفظ جميع إعدادات المنصة":"Save all platform settings",
    "حفظ إعدادات الإشعارات":"Save notification settings","المشاريع المسندة":"Assigned projects",
    "مسند":"Assigned","قيد التنفيذ":"In progress","منتهي":"Completed","متعثر":"Stalled",
    "مسودة":"Draft","مقدم":"Submitted","تحت المراجعة":"Under review","معتمد":"Approved","مرفوض":"Rejected",
    "صنع في عمان":"Made in Oman","مورد محلي":"Local supplier","استيراد مباشر":"Direct import",
    "محلي":"Local","أجنبي":"Foreign","الموظفون":"Employees","التقارير":"Reports",
    "جارٍ التحميل...":"Loading...","لا توجد بيانات":"No data available","لا توجد نتائج":"No results",
    "تم الحفظ بنجاح.":"Saved successfully.","حدث خطأ غير متوقع.":"An unexpected error occurred.",
    "تعذر الاتصال بقاعدة البيانات":"Could not connect to the database","الرجاء الانتظار":"Please wait",
    "من أصل":"of","من":"From","إلى":"To","الملاحظات":"Notes","الأدوار":"Roles",
    "الصلاحيات":"Permissions","جهات الاتصال":"Contact points","نقاط التواصل":"Contact points",
    "إضافة مهمة":"Add task","المهام":"Tasks","الأولوية":"Priority","مفتوحة":"Open","مغلقة":"Closed",
    "العملة":"Currency","تاريخ الإنشاء":"Created at","آخر تحديث":"Last updated",

    "مشاهد":"Viewer","مستلم":"Received","خدمات":"Services","عالية":"High","عاجلة":"Urgent","الرمز":"Code","الاسم":"Name",
    "الدور":"Role","الحدث":"Event","بنجاح.":"Successfully.","متوسطة":"Medium","منخفضة":"Low","منتهية":"Finished",
    "مستخدم":"User","ملاحظة":"Note","النظام":"System","أخصائي":"Specialist","المشروع":"Project","الأرباع":"Quarters",
    "نسبة SME":"SME percentage","رئيس قسم":"Section head","الوظيفة:":"Job title:","المستهدف":"Target","التفاصيل":"Details",
    "حفظ الخطة":"Save plan","ملف الخطة":"Plan file","قوى عاملة":"Workforce","العمانيون":"Omanis","الاستشاري":"Consultant",
    "اسم الجهة":"Entity name","سارية حتى":"Valid until","آخر تقرير":"Latest report","خدمات SME":"SME services","إسناد جهة":"Assign entity",
    "مستند خطة":"Plan document","مسندة إلى":"Assigned to","غير مُسند":"Unassigned","جهة حكومية":"Government entity",
    "شركة منفذة":"Implementing company","عرض المرفق":"View attachment","مرفق محفوظ":"Attachment saved","اسم الشركة":"Company name",
    "نوع الشركة":"Company type","بدون مشروع":"No project","بدون تاريخ":"No date","مهمة شخصية":"Personal task","إظهار الكل":"Show all",
    "بدون نهاية":"No end date","الحساب نشط":"Account active","حد السلع %":"Goods threshold %","اسم الدور:":"Role name:",
    "مدير النظام":"System administrator","رواتب الربع":"Quarterly wages","حفظ التقرير":"Save report","عقود الباطن":"Subcontracting",
    "لا توجد خطة":"No plan","ابحث بالاسم":"Search by name","مهمة متابعة":"Follow-up task","حالة المشروع":"Project status",
    "مثال: user01":"Example: user01","آخر 15 حدثًا":"Latest 15 events","المورد المحلي":"Local supplier","تاريخ التقرير":"Report date",
    "صنع في عمان %":"Made in Oman %","إجمالي الأجانب":"Total expatriates","تقرير الشركة -":"Company report -",
    "رواتب العمانيين":"Omani wages","خدمة مزود أجنبي":"Foreign supplier service","الخدمات المحلية":"Local services",
    "تعديل ملف الجهة":"Edit entity profile","تم إضافة المهمة":"Task added","تاريخ الانتهاء:":"End date:",
    "تاريخ الاستحقاق":"Due date","التزام القسم":"Section compliance","المورد المحلي %":"Local supplier %",
    "تم اختيار الملف:":"File selected:","تم رفع ملف الخطة":"Plan file uploaded","تعذر فتح المرفق:":"Could not open attachment:",
    "إجمالي العمانيين":"Total Omanis","الخدمات الأجنبية":"Foreign services","إخفاء المشاريع (":"Hide projects (","إظهار المشاريع (":"Show projects (",
    "· تاريخ الانتهاء":"· End date","إعدادات التقارير":"Report settings","إعدادات المشاريع":"Project settings",
    "الاستيراد المباشر":"Direct imports","إعدادات الإشعارات":"Notification settings","معامل صنع في عمان":"Made in Oman coefficient",
    "معامل مشتريات SME":"SME purchase coefficient","تمديد قيد الدراسة":"Extension under review","SME — المشتريات %":"SME — purchases %",
    "الخدمات المحلية %":"Local services %","إجمالي المستخدمين:":"Total users:","إعدادات المستخدمين":"User settings",
    "الرواتب العمانية %":"Omani wages %","الخدمات الأجنبية %":"Foreign services %","قسم الدعم والمتابعة":"Support and follow-up section",
    "تم إسناد المهمة إلى":"Task assigned to","تعذر تعديل الملاحظة.":"Could not edit note.","تعذر إغلاق الملاحظة:":"Could not close note:",
    "تعديل بيانات المشروع":"Edit project details","مؤسسات صغيرة ومتوسطة":"Small and medium enterprises","إجمالي القيم المالية":"Total financial values",
    "قواعد المحتوى المحلي":"Local content rules","تغيير تاريخ الانتهاء":"Change end date","الحد الأدنى لـ SME %":"Minimum SME threshold %",
    "قيمة المشروع إلزامية":"Project value is required","اعتماد / رفض التقرير":"Approve / reject report","تعذر تحميل المشاريع:":"Could not load projects:",
    "إدارة الجهات الحكومية":"Government entity management","قيمة المشروع الاجمالي":"Total project value","إجمالي المحتوى المحلي":"Total local content",
    "لم يتم تحديد المشروع.":"No project selected.","تم حفظ التقرير بنجاح.":"Report saved successfully.","يمكنك تحديثها من هنا.":"You can update it here.",
    "تاريخ الانتهاء الحالي":"Current end date","المستخدمون المعروضون:":"Displayed users:","تعذر تحميل ملف الموظف":"Could not load employee file",
    "رقم المناقصة / المرجع":"Tender / reference number","رواتب العمانيين (ر.ع)":"Omani wages (OMR)","نسبة استيفاء المشاريع":"Project fulfillment rate",
    "تعذر إنشاء ملف Excel:":"Could not create Excel file:","لا توجد تقارير معتمدة":"No approved reports","معامل رواتب العمانيين":"Omani wages coefficient",
    "معامل الخدمات المحلية":"Local services coefficient","قفل التقارير المعتمدة":"Lock approved reports","الحد الأدنى للتعمين %":"Minimum Omanization threshold %",
    "الحد الأدنى للخدمات %":"Minimum services threshold %","نوع التقرير الافتراضي":"Default report type","اقتراب انتهاء المشروع":"Project nearing completion",
    "الشركة المنفذة مطلوبة.":"Implementing company is required.","تحسب من بيانات المشروع":"Calculated from project data","يرجى اختيار ملف أولاً.":"Please choose a file first.",
    "عرض خطة المحتوى المحلي":"View local content plan","بطاقات الجهات الحكومية":"Government entity cards","لا توجد خطة محتوى محلي":"No local content plan",
    "اضغط لفتح صفحة المشروع":"Click to open project page","مكتبة Excel غير متاحة.":"Excel library is unavailable.","المشاريع غير المستوفية":"Non-compliant projects",
    "المحتوى المحلي المحسوب":"Calculated local content","القوى العاملة والرواتب":"Workforce and wages","تعذر حفظ نقاط التواصل:":"Could not save contact points:",
    "معامل الخدمات الأجنبية":"Foreign services coefficient","الرواتب غير العمانية %":"Expatriate wages %","الجهة الحكومية إلزامية":"Government entity is required",
    "الشركة المنفذة إلزامية":"Implementing company is required","يجب تسجيل الدخول أولاً.":"You must sign in first.",
    "يرجى إدخال اسم للمستند.":"Please enter a document name.","المعايير غير المستوفاة:":"Unmet criteria:","المحتوى المحلي / القيمة":"Local content / value",
    "معامل الاستيراد المباشر":"Direct import coefficient","يجب أن تكون بين 0 و100.":"Must be between 0 and 100.","ملف الإعدادات غير صالح.":"Invalid settings file.",
    "تعذر ربط الملف بالتقرير:":"Could not attach file to report:","الفئة الأولى — العمانيون":"Category 1 — Omanis",
    "تعذر تحميل بيانات الجهة:":"Could not load entity data:","قفل التقرير بعد الاعتماد":"Lock report after approval","العمالة والتعمين والرواتب":"Workforce, Omanization and wages",
    "يمكنك إضافة الخطة من هنا.":"You can add the plan here.","تعذر العثور على الملاحظة.":"Could not find note.",
    "يرجى تسجيل الدخول مجددًا.":"Please sign in again.","المشروع / الجهة في الملف:":"Project / entity in file:",
    "رواتب غير العمانيين (ر.ع)":"Expatriate wages (OMR)","معامل عقود الباطن المحلية":"Local subcontracting coefficient",
    "مدة الاحتفاظ بالسجل (يوم)":"Audit retention (days)","عقود الباطن — مزود محلي %":"Subcontracting — local provider %",
    "يُعتبر متأخرًا بعد (أيام)":"Consider overdue after (days)","أنواع التوريد / المشتريات":"Supply / purchase types",
    "تعذر تحميل صلاحيات الحساب.":"Could not load account permissions.","اختر جهة حكومية من القائمة":"Select a government entity from the list",
    "المؤسسات الصغيرة والمتوسطة":"Small and medium enterprises","تم تغيير الرقم السري بنجاح":"Password changed successfully",
    "تعديل الدور وفترة الصلاحية":"Edit role and access period","معامل عقود الباطن الأجنبية":"Foreign subcontracting coefficient",
    "عقود الباطن — مزود أجنبي %":"Subcontracting — foreign provider %","تعذر حذف بعض مرفقات الخطة.":"Some plan attachments could not be deleted.",
    "اسم المشروع أو رقم المناقصة":"Project name or tender number","هل أنت متأكد من حذف المستند":"Are you sure you want to delete the document",
    "ملخص التقرير الربعي بالكامل":"Full quarterly report summary","تم حفظ الجهة الحكومية بنجاح":"Government entity saved successfully",
    "لا تتوفر بيانات كافية للعرض":"Not enough data to display","مشاريع لديها خطة محتوى محلي":"Projects with a local content plan",
    "تم حفظ نقاط التواصل للشركة.":"Company contact points saved.","السماح بأكثر من تقرير للربع":"Allow multiple reports per quarter",
    "جارٍ تحميل جميع المشاريع...":"Loading all projects...","لا تملك صلاحية حفظ التقارير.":"You do not have permission to save reports.",
    "ليست لديك صلاحية إضافة شركة.":"You do not have permission to add a company.","الحذف متاح لمدير النظام فقط.":"Only the system administrator can delete.",
    "تم حفظ التقرير والمرفق بنجاح.":"Report and attachment saved successfully.","مشاريع مستوفية لجميع المعايير":"Projects meeting all criteria",
    "عدد المشاريع المرتبطة بالشركة":"Projects linked to the company","تعذر الاتصال بقاعدة البيانات.":"Could not connect to the database.",
    "اتصال قاعدة البيانات غير متاح":"Database connection unavailable","نشاط أخصائيي الدعم والمتابعة.":"Support specialists activity.",
    "📝 الملاحظات والمهام المفتوحة":"📝 Open notes and tasks","تاريخ البداية والنهاية إلزامي":"Start and end dates are required",
    "تعذر حذف بعض مرفقات التقارير.":"Some report attachments could not be deleted.","لا توجد خطة مسجلة لهذا المشروع":"No plan registered for this project",
    "أدخل عنوان الملاحظة وتفاصيلها.":"Enter a note title and details.","المهام متاحة لموظفي القسم فقط.":"Tasks are available to section staff only.",
    "تقرير الشركة — الملخص التنفيذي":"Company report — executive summary","تقرير الشركة — تفاصيل المشاريع":"Company report — project details",
    "يرجى السماح بالنوافذ المنبثقة.":"Please allow pop-up windows.","كل العمليات على بيانات المنصة.":"All operations on platform data.",
    "مدة التسليم الافتراضية بالأيام":"Default delivery period (days)","تاريخ البداية والنهاية مطلوبان.":"Start and end dates are required.",
    "تعذّر التحقق من الجهة الحكومية:":"Could not verify government entity:","مورد المؤسسات الصغيرة والمتوسطة":"SME supplier",
    "مزود المؤسسات الصغيرة والمتوسطة":"SME provider","تقرير الشركة — التفاصيل المالية":"Company report — financial details",
    "حد المؤسسات الصغيرة والمتوسطة %":"SME threshold %","تم حفظ إعدادات الإشعارات لحسابك":"Notification settings saved for your account",
    "الخطة الحالية مسجلة لهذا المشروع":"A plan is already registered for this project","أدخل اسم الشركة المنفذة الجديدة:":"Enter the new implementing company name:",
    "مورد المؤسسات الصغيرة و المتوسطة":"SME supplier","خدمات المؤسسات الصغيرة والمتوسطة":"SME services",
    "هذا القسم متاح لمدير النظام فقط.":"This section is available to the system administrator only.",
    "عنوان الملاحظة وتفاصيلها مطلوبان.":"Note title and details are required.","جميع المعايير المنطبقة: التعمين ≥":"All applicable criteria: Omanization ≥",
    "تقرير الشركة — المؤشرات والامتثال":"Company report — indicators and compliance","أنواع الموردين للخدمات والمقاولات":"Supplier types for services and subcontracting",
    "أدخل السنة بأربعة أرقام، مثل 2026.":"Enter a four-digit year, e.g. 2026.","تأكيد إغلاق الملاحظة بعد المعالجة؟":"Confirm closing the note after resolution?",
    "الشركة موجودة بالفعل وتم اختيارها.":"The company already exists and has been selected.","مشتريات المؤسسات الصغيرة والمتوسطة":"SME purchases",
    "أضف حالة واحدة على الأقل للمشاريع.":"Add at least one project status.","أضف حالة واحدة على الأقل للتقارير.":"Add at least one report status.",
    "تمت إضافة الشركة واختيارها للمشروع.":"Company added and selected for the project.","تم حفظ تعديلات الجهة الحكومية بنجاح":"Government entity changes saved successfully",
    "ملخص تنفيذي للمدير مع حدود الامتثال":"Executive summary with compliance thresholds","نسبة المحتوى المحلي إلى إجمالي الصرف":"Local content as a percentage of total expenditure",
    "نسبة المحتوى المحلي إلى قيمة المشروع":"Local content as a percentage of project value","تقرير الشركة — القوى العاملة والرواتب":"Company report — workforce and wages",
    "تم حفظ الجهات الحكومية المرتبطة بحسابك":"Government entities linked to your account saved","نهاية الصلاحية (إلزامية للمشاهد المؤقت)":"Access expiry (required for temporary viewers)",
    "انتهت الجلسة، يرجى تسجيل الدخول من جديد":"Session expired; please sign in again","خدمة مزود من المؤسسات الصغيرة و المتوسطة":"SME provider service",
    "تقليل المساحات في بعض الجداول والبطاقات.":"Reduce spacing in some tables and cards.",
    "القوى العاملة والرواتب من آخر تقرير معتمد":"Workforce and wages from the latest approved report",
    "تم حفظ بيانات التقرير لكن تعذر حفظ المرفق:":"Report data saved, but the attachment could not be saved:",
    "اكتب ملاحظة توضح ما تم قبل إغلاق الملاحظة.":"Write a note explaining what was done before closing it.",
    "انتهت الجلسة، سجّل الدخول ثم حاول مرة أخرى.":"Session expired; sign in and try again.",
    "تعذر تحميل إعدادات المنصة من قاعدة البيانات":"Could not load platform settings from the database",
    "تم حفظ جميع إعدادات المنصة في قاعدة البيانات":"All platform settings saved to the database",
    "لوحة التحكم":"Dashboard","تم":"Done","نعم":"Yes","جهة":"Entity","حدث":"Event","سلع":"Goods","خدم":"Services","يوم":"Day",
    "محقق":"Achieved","موظف":"Employee","فعال":"Active","شركة":"Company","مهمة":"Task","مشروع":"Project","الفئة":"Category",
    "مكتمل":"Completed","إخفاء":"Hide","سارية":"Valid","معطّل":"Disabled","مستوفي":"Compliant","مستوفٍ":"Compliant",
    "معتمدة":"Approved","تراكمي":"Cumulative","تراكمية":"Cumulative","الأولى":"First","الثانية":"Second","الثالثة":"Third","الرابعة":"Fourth",
    "الفئات":"Categories","الفترة":"Period","المؤشر":"Indicator","المرفق":"Attachment","الإصدار":"Version","غير نشط":"Inactive",
    "غير فعال":"Inactive","غير محدد":"Not specified","غير محددة":"Not specified","غير منطبق":"Not applicable","لم تبدأ":"Not started",
    "بدون حد":"No limit","غير مستوفي":"Non-compliant","غير مستوفٍ":"Non-compliant","خطة متوفرة":"Plan available",
    "قطاع العمل":"Work sector","اسم العرض":"Display name","التغييرات":"Changes","تمديد مدة":"Duration extension",
    "مشاهد مؤقت":"Temporary viewer","مزود SME":"SME supplier","مزود محلي":"Local supplier","مزود أجنبي":"Foreign supplier",
    "حفظ كمسودة":"Save as draft","ربعي منفصل":"Separate quarterly","مشاريع تحقق":"Compliant projects","تقرير متأخر":"Overdue report",
    "تقرير مستحق":"Report due","مشروع متعثر":"Stalled project","مشتريات SME":"SME purchases","خدمات محلية":"Local services",
    "حساب مستخدم":"User account","تمديد مشروع":"Project extension","تاريخ البدء":"Start date","نوع التقرير":"Report type",
    "عدد الأجانب":"Number of expatriates","تمديد معتمد":"Approved extension","هذا المشروع":"This project","حذف المشروع":"Delete project",
    "تعذر الحفظ:":"Save failed:","بطاقة الجهة:":"Entity card:","تم حفظ الخطة":"Plan saved","نسبة الانجاز":"Completion percentage",
    "نسبة الإنجاز":"Completion percentage","صفحة المشروع":"Project page","أقل من الخطة":"Below plan","صنع في عُمان":"Made in Oman",
    "لا يوجد مرفق":"No attachment","ملخص العمالة":"Workforce summary","تحتاج متابعة":"Needs follow-up","تعديل مستخدم":"Edit user",
    "إضافة مستخدم":"Add user","خدمات أجنبية":"Foreign services","بيانات الخطة":"Plan data","نقاط التواصل":"Contact points",
    "اسم المستخدم":"Username","الملف المصدر":"Source file","حد التعمين %":"Omanization threshold %","حد الخدمات %":"Services threshold %",
    "تأخر المشروع":"Project delay","ملاحظات الخطة":"Plan notes","جارٍ الحفظ...":"Saving...","جاري الحفظ...":"Saving...",
    "لم يُحدّث بعد":"Not updated yet","رواتب الأجانب":"Expatriate wages","حفظ التعديلات":"Save changes","تم حفظ الجهات":"Entities saved",
    "غير العمانيين":"Non-Omanis","عقود باطن SME":"SME subcontracting","طريقة القراءة":"Reading method","ملاحظة / مهمة":"Note / task",
    "خط أساس مشروع":"Project baseline","عدد العمانيين":"Number of Omanis","إعدادات السجل":"Audit settings","أسماء الأدوار":"Role names",
    "الجهة المالكة":"Owning entity","حالات التقرير":"Report statuses","حالات المشروع":"Project statuses","أنواع التمديد":"Extension types",
    "جارٍ الحذف...":"Deleting...","تم حفظ المشروع":"Project saved","تم حفظ التقرير":"Report saved","اكتب اسم الملف":"Enter file name",
    "تعديل الملاحظة":"Edit note","خدمة مزود محلي":"Local supplier service","التقرير الربعي":"Quarterly report","إجمالي العمالة":"Total workforce",
    "الصلاحية حتى":"Access valid until","إنشاء المستخدم":"Create user","نهاية الصلاحية":"Access expiry","نسبة الاستيفاء":"Fulfillment rate",
    "متوسط المشاريع":"Average projects","تقرير ربع سنوي":"Quarterly report","خطة محتوى محلي":"Local content plan","الرقم التسلسلي":"Serial number",
    "بيانات التقرير":"Report data","بداية الصلاحية":"Access start","ملاحظة الإغلاق":"Closure note","التاريخ والوقت":"Date and time",
    "جهة بلا أخصائي":"Entity without specialist","إدارة المشاريع":"Project management","سنوات التقارير":"Reporting years",
    "تم رفع المستند.":"Document uploaded.","المرفق المحفوظ:":"Saved attachment:","الفئات الوظيفية":"Job categories","إجمالي المشاريع":"Total projects",
    "الملخص التنفيذي":"Executive summary","الحالة النهائية":"Final status","تفاصيل المشاريع":"Project details","عقود باطن محلية":"Local subcontracting",
    "ملاحظات التقرير":"Report notes","معامل خدمات SME":"SME services coefficient","SME — الخدمات %":"SME — services %",
    "لا توجد ملاحظات.":"No notes.","تعذر عرض التقرير":"Unable to display report","اسم الجهة مطلوب.":"Entity name is required.",
    "إضافة جهة حكومية":"Add government entity","تحتاج إلى متابعة":"Needs follow-up","عقود باطن أجنبية":"Foreign subcontracting",
    "التفاصيل المالية":"Financial details","حفظ نقاط التواصل":"Save contact points","الإعدادات العامة":"General settings",
    "متأخر بعد (أيام)":"Late after (days)","تحديث خطة المشروع":"Update project plan","إضافة خطة المشروع":"Add project plan",
    "ينتهي خلال 3 أشهر":"Ends within 3 months","تاريخ إنشاء الملف":"File creation date","كل مشروع مقابل حد":"Each project against threshold",
    "الخطة تحتاج تحديث":"Plan needs updating","البحث في المشاريع":"Search projects","تعذر حذف المشروع:":"Could not delete project:",
    "أخصائي دعم ومتابعة":"Support and follow-up specialist","لا يوجد مرفق محفوظ":"No saved attachment","ملاحظة على المشروع":"Project note",
    "تعذر حفظ الملاحظة.":"Could not save note.","اسم المشروع مطلوب.":"Project name is required.","تقارير تحتاج إجراء":"Reports requiring action",
    "المشاريع المستوفية":"Compliant projects","قيمة المشروع (ر.ع)":"Project value (OMR)","الشركة غير موجودة.":"Company not found.",
    "مدة التسليم (أيام)":"Delivery duration (days)","التنبيه قبل (أيام)":"Notify before (days)","مؤسسة صغيرة ومتوسطة":"Small and medium enterprise",
    "تم حفظ الشركة بنجاح":"Company saved successfully","تعذر تحميل المستخدم":"Could not load user","يحتاج متابعة مباشرة":"Requires immediate follow-up",
    "إجمالي الصرف المسجل":"Total recorded expenditure","معامل رواتب الأجانب":"Expatriate wages coefficient","معامل المورد المحلي":"Local supplier coefficient",
    "معامل عقود باطن SME":"SME subcontracting coefficient","الحد الأدنى للسلع %":"Minimum goods threshold %","الاستيراد المباشر %":"Direct imports %",
    "عقود الباطن — SME %":"Subcontracting — SME %","اقتراب موعد التقرير":"Report due date approaching","تعذر حفظ الإعدادات:":"Could not save settings:",
    "السلع (صنع في عُمان)":"Goods (Made in Oman)","جارٍ تسجيل الدخول...":"Signing in...","تم تحديث حالة المهمة":"Task status updated",
    "تم تحديث مهمة متابعة":"Follow-up task updated","تم حفظ جهات المتابعة":"Follow-up entities saved","إجمالي قيمة المشاريع":"Total project value","نشط":"Active","عنصر":"Item","القيمة":"Value","القطاع":"Sector","الأجانب":"Expatriates","الخدمات":"Services","الجهة «":"Entity “","الشركة «":"Company “","الرواتب":"Wages","التعمين":"Omanization","التوضيح":"Explanation","العنوان":"Title","المستخدم":"User","المؤشرات":"Indicators","المشتريات":"Purchases","قيد المراجعة":"Under review","غير مُسندة":"Unassigned","ملف الشركة:":"Company file:","نسبة التعمين":"Omanization rate","لم يتم اختيار ملف":"No file selected","خطة المحتوى المحلي":"Local content plan","هيئة المشاريع والمناقصات والمحتوى المحلي":"Authority of Projects, Tenders and Local Content","تعذر تحميل ملف الشركة:":"Could not load company file:","تأكيد حذف المشروع؟\n\n":"Confirm deleting this project?\n\n","الفئة الأولى — الأجانب":"Category 1 — expatriates","الفئة الثانية — الأجانب":"Category 2 — expatriates","الفئة الثالثة — الأجانب":"Category 3 — expatriates","الفئة الثانية — العمانيون":"Category 2 — Omanis","الفئة الثالثة — العمانيون":"Category 3 — Omanis","اكتب الاسم الجديد للمستند:":"Enter the new document name:","ICV - تقرير الشركة الكامل -":"ICV - Full company report -","التنبيه قبل الموعد بـ (أيام)":"Notify before due date (days)","إجمالي المحتوى المحلي المحسوب":"Total calculated local content","عددًا صحيحًا بين 0 و365 يومًا.":"an integer between 0 and 365 days.","» غير موجودة. اخترها من القائمة.":"” was not found. Select it from the list.","الأحمال والجهات غير المتابَعة":"Workload and unmonitored entities","ر.ع — وفق معاملات الحساب في الإعدادات":"OMR — using the coefficients in settings","% من المشاريع ذات البيانات تحقق المستهدف":"% of projects with data meeting the target","كل مشروع مرتبط بالشركة مع مؤشرات الامتثال":"Each project linked to the company with compliance indicators","(أحدث 1000 حدث؛ ضيّق الفترة لرؤية الأقدم)":"(Latest 1,000 events; narrow the date range to see older events)","يجب أن تكون الأرباع المعتمدة Q1 وQ2 وQ3 وQ4.":"The configured quarters must be Q1, Q2, Q3, and Q4.","قيمة المشروع مطلوبة ويجب أن تكون أكبر من صفر.":"Project value is required and must be greater than zero.","تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية.":"The end date must be after the start date.","أدخل أي ملاحظات أو توضيحات مرتبطة بالتقرير...":"Enter any notes or explanations related to the report...","المستوفية ÷ المشاريع التي لديها تقارير معتمدة":"Compliant ÷ projects with approved reports","تم استيراد الإعدادات وحفظها في قاعدة البيانات":"Settings imported and saved to the database","صلاحية المستخدم لا تسمح بإضافة أو تعديل الخطط.":"Your access does not allow adding or editing plans.","اكتب ملاحظة الإغلاق (مثال: تم تنسيق الاجتماع):":"Enter a closure note (e.g. meeting coordinated):","تم حذف المشروع وجميع سجلاته ومرفقاته المرتبطة.":"The project and its related records and attachments have been deleted.","صلاحية حسابك للاطلاع فقط ولا تسمح بإدخال التقارير.":"Your account is read-only and cannot enter reports.","تُحذف الأحداث الأقدم من هذه المدة تلقائيًا كل يوم.":"Events older than this period are automatically deleted each day.","هل تريد إعادة جميع إعدادات المنصة للقيم الافتراضية؟":"Reset all platform settings to their defaults?","تعذر العثور على المشروع. حدّث الصفحة وحاول مرة أخرى.":"Project not found. Refresh the page and try again.","أدخل اسم المستخدم أو البريد الإلكتروني وكلمة المرور.":"Enter your username or email and password.","المشروع مستوفٍ عندما يحقق جميع المعايير المنطبقة عليه":"A project is compliant when it meets all applicable criteria.","عند التفعيل لا يعدّل التقرير المعتمد إلا مدير النظام.":"When enabled, only an administrator can edit an approved report.","أدخل سنوات تقارير صحيحة من أربعة أرقام، من دون تكرار.":"Enter valid four-digit reporting years without duplicates.","تعديل نقاط التواصل متاح لموظفي القسم ومدير النظام فقط.":"Only section staff and administrators can edit contact points.","لا":"No","ر.ع":"OMR","· الحد":"· Limit","مشروع.":"Project.","👥 الفريق":"👥 Team","يجب أن تكون مدة":"Duration must be","مثال: V1":"Example: V1","العنوان":"Address","مثال:":"Example:","القيمة في":"Value in","غير مستلم من":"Not received from","جاري التحميل...":"Loading...","التنبيه قبل الموعد بـ (أيام)":"Notify before due date (days)","ICV - سجل التدقيق -":"ICV - Audit log -","منصة ICV FollowUp |":"ICV FollowUp Platform |","📋 تقارير Q":"📋 Q reports","— متبقي":"— remaining","· متأخر":"· overdue","· متبقي":"· remaining","— مستحق خلال":"— due in","· المسؤول:":"· Responsible:","· الصلاحية حتى":"· Access expires:","🕐 نشاط الفريق":"🕐 Team activity","📊 التزام القسم":"📊 Section compliance","%، SME ≥":"%, SME ≥","%، السلع ≥":"%, goods ≥","%، الخدمات ≥":"%, services ≥","ر.ع — من التقارير المعتمدة فقط":"OMR — approved reports only","% (المشاريع المنطبق عليها المعيار فقط)":"% (projects to which the criterion applies only)","% من المشاريع ذات البيانات تحقق المستهدف":"% of projects with data meeting the target","إنشاء حساب جديد بنفس آلية المنصة السابقة":"Create a new account using the platform's existing workflow","» غير موجودة. اخترها من القائمة أو أضفها أولًا.":"” was not found. Select it from the list or add it first.","⚖️ الأحمال والجهات غير المتابَعة":"⚖️ Workload and unmonitored entities","المستوفية ÷ المشاريع التي لديها تقارير معتمدة":"Compliant ÷ projects with approved reports","اكتب ملاحظة الإغلاق (مثال: تم تنسيق الاجتماع):":"Enter a closure note (e.g. meeting coordinated):","— التقرير غير مستلم · متأخر":"— report not received · overdue","(تعذر إنشاء رابط العرض)":"(Unable to create view link)","ICV - تقرير الشركة الكامل -":"ICV - Full company report -","عرض الجهات المسندة افتراضيًا":"Show assigned entities by default","ر.ع — وفق معاملات الحساب في الإعدادات":"OMR — using the calculation coefficients in settings","شعار هيئة المشاريع والمناقصات والمحتوى المحلي":"Authority of Projects, Tenders and Local Content logo","الفئة الأولى — الأجانب":"Category 1 — expatriates","الفئة الثانية — العمانيون":"Category 2 — Omanis","الفئة الثالثة — العمانيون":"Category 3 — Omanis","أقل من الحد (":"Below threshold (","مثال: V1":"Example: V1","أضاف":"Added","عدّل":"Edited","القيمة":"Value","السلع":"Goods","المستخدم":"User","العنوان":"Title","الرواتب":"Wages","المشتريات":"Purchases","خطة المحتوى المحلي":"Local content plan","قيد المراجعة":"Under review","غير مُسندة":"Unassigned","نسبة التعمين":"Omanization rate","تعذر تحميل ملف الشركة:":"Could not load company file:","تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية.":"The end date must be after the start date.","قيمة المشروع مطلوبة ويجب أن تكون أكبر من صفر.":"Project value is required and must be greater than zero.","صلاحية حسابك للاطلاع فقط ولا تسمح بإدخال التقارير.":"Your account is read-only and cannot enter reports.","المشروع مستوفٍ عندما يحقق جميع المعايير المنطبقة عليه":"A project is compliant when it meets all applicable criteria.","عند التفعيل لا يعدّل التقرير المعتمد إلا مدير النظام.":"When enabled, only an administrator can edit an approved report.","تم استيراد الإعدادات وحفظها في قاعدة البيانات":"Settings imported and saved to the database",
    // Additional coverage for dashboard, forms, and settings labels.
    "كل السنوات":"All years",
    "جميع الجهات الحكومية":"All government entities",
    "جميع الجهات":"All entities",
    "فتح المشروع ←":"Open project ←",
    "لا توجد مشاريع مرتبطة بهذه الجهة.":"No projects are linked to this entity.",
    "لا توجد نقاط تواصل مضافة.":"No contact points have been added.",
    "قائمة المشاريع مع المتابعة السريعة للتقارير والإنجاز.":"Project list with quick follow-up on reports and progress.",
    "قيمة المشروع من":"Project value from",
    "قيمة المشروع إلى":"Project value to",
    "المشاريع التي تنتهي خلال":"Projects ending within",
    "10 أيام":"10 days",
    "30 يوم":"30 days",
    "90 يوم":"90 days",
    "مسح الفلاتر":"Clear filters",
    "قائمة المشاريع":"Project list",
    "هذا التقرير معتمد ومقفل. يعيد مدير النظام فتحه عند الحاجة.":"This report is approved and locked. An administrator can reopen it when needed.",
    "آخر حفظ:":"Last saved:",
    "حسابي":"My account",
    "جهات المتابعة فقط":"Assigned entities only",
    "كل الجهات":"All entities",
    "مشروع مسجل":"Registered project",
    "ريال عماني":"Omani Rial",
    "الصرف المسجل للمشاريع":"Recorded project expenditure",
    "وفق بيانات الخطط المتاحة":"Based on available plan data",
    "وفق بيانات المشاريع الحالية":"Based on current project data",
    "الصرف والمحتوى المحلي عبر الأرباع":"Expenditure and local content by quarter",
    "مقارنة التقارير المسجلة في النظام":"Comparison of reports recorded in the system",
    "الصرف الفعلي":"Actual expenditure",
    "مستوى الالتزام":"Compliance level",
    "الجهة الحكومية:":"Government entity:",
    "مؤشرات الالتزام للجهة المختارة فقط":"Compliance indicators for the selected entity only",
    "المعدل العام للمحتوى المحلي":"Overall local content rate",
    "من الصرف الفعلي للجهة المختارة":"Of the selected entity's actual expenditure",
    "متوسط التعمين":"Average Omanization",
    "حسب بيانات المشاريع":"Based on project data",
    "استيفاء SME":"SME compliance",
    "مشاريع مستوفية":"Compliant projects",
    "حالة المشاريع":"Project status",
    "تنبيهات ومتابعة المشاريع":"Project alerts and follow-up",
    "عناصر تحتاج إلى متابعة إدارية — حسب البيانات المسجلة":"Items requiring administrative follow-up — based on recorded data",
    "مشاريع متعثرة":"Stalled projects",
    "تحتاج إلى متابعة حالة التنفيذ":"Require implementation-status follow-up",
    "مشاريع بدون خطة محتوى محلي":"Projects without a local content plan",
    "الخطة اختيارية ويمكن استكمالها عند الحاجة":"The plan is optional and can be completed when needed",
    "مشاريع بدون تقارير ربع سنوية":"Projects without quarterly reports",
    "لم يُسجّل لها تقرير حتى الآن":"No report has been recorded yet",
    "الجهات الأعلى صرفًا":"Entities with the highest expenditure",
    "حسب مجموع الصرف المسجل":"By total recorded expenditure",
    "الشركات الأعلى صرفًا":"Companies with the highest expenditure",
    "حسب المشاريع المرتبطة بالشركة":"Based on projects linked to the company",
    "أفضل 3 مشاريع في الاستيفاء":"Top 3 projects by compliance",
    "مرتبة حسب نسبة المحتوى المحلي المسجلة":"Ranked by the recorded local content rate",
    "إضافة تقرير":"Add report",
    "إضافة خطة":"Add plan",
    "إضافة خطة محتوى محلي":"Add local content plan",
    "هذه الصفحة جاهزة لتسجيل المهام والتنبيهات المرتبطة بالمشاريع والتقارير.":"This page is ready to record tasks and alerts related to projects and reports.",
    "هذه الصفحة متاحة لمسؤول النظام فقط.":"This page is available to administrators only.",
    "الجهة غير موجودة في القائمة. أضفها أولاً من صفحة الجهات الحكومية ثم أعد المحاولة.":"The entity is not in the list. Add it from the Government Entities page first, then try again.",
    "عرض الجهات الحكومية وعدد مشاريعها وقيمتها والإنفاق، مع إمكانية فتح بطاقة كل جهة.":"View government entities, their project counts, values and expenditure, and open each entity card.",
    "بطاقة الجهة":"Entity card",
    "معلومات الجهة":"Entity information",
    "مشاريع الجهة":"Entity projects",
    "رقم المشروع/المناقصة":"Project/tender number",
    "جاري تحميل صفحة الشركات الجديدة...":"Loading the new Companies page...",
    "إدخال التقرير على مراحل واضحة وفق النموذج المعتمد للتقارير.":"Enter the report in clear steps using the approved reporting form.",
    "العودة للمشروع":"Back to project",
    "تحديد الكل":"Select all",
    "إلغاء الكل":"Clear selection",
    "تعذر حفظ بيانات القوى العاملة والرواتب تلقائيًا:":"Could not automatically save workforce and wage data:",
    "تعذر حفظ الرواتب للفترة السابقة، لذلك أبقينا المدخلات ظاهرة:":"Could not save wages for the previous period, so the entered values have been kept visible:",
    "لا توجد مستندات مرفوعة":"No documents uploaded",
    "يوجد تقرير محفوظ لهذا المشروع في الربع والسنة نفسيهما. افتح التقرير الموجود وعدّله بدل إنشاء تقرير جديد.":"A report already exists for this project, quarter and year. Open and edit the existing report instead of creating a duplicate.",
    "تعذر تحميل معاملات المحتوى المحلي؛ سيتم استخدام المعاملات الافتراضية":"Could not load local content coefficients; default coefficients will be used.",
    "خطة المحتوى المحلي — ICV New":"Local Content Plan — ICV New",
    "إدخال تقرير ربع سنوي — ICV New":"Quarterly Report Entry — ICV New",
    "لوحة المؤشرات":"Dashboard",
    "متابعة المشاريع والمحتوى المحلي":"Project and Local Content Follow-up",
    "إعدادات المظهر":"Appearance settings",
    "الثيم والخط وحجم النص":"Theme, font and text size",
    "اختيار الثيم":"Choose theme",
    "أخضر مؤسسي":"Corporate green",
    "كحلي فاخر":"Premium navy",
    "إضافة نقطة تواصل":"Add contact point",
    "إدارة نقاط التواصل متاحة لموظفي القسم ومدير النظام فقط.":"Contact-point management is available only to section staff and administrators.",
    "اختر جهة من القائمة. لإضافة جهة جديدة، استخدم صفحة الجهات الحكومية.":"Choose an entity from the list. To add a new entity, use the Government Entities page.",
    "اختر الشركة المنفذة":"Select implementing company",
    "اختر قطاع العمل":"Select work sector",
    "الإنشاءات":"Construction",
    "الطرق":"Roads",
    "الكهرباء والمياه":"Electricity and water",
    "تقنية المعلومات":"Information technology",
    "التوريد":"Supply",
    "الاستشارات":"Consulting",
    "أخرى":"Other",
    "نسبة الإنجاز %":"Progress %",
    "تاريخ آخر تعديل":"Last modified date",
    "تاريخ الاستلام":"Received date",
    "المصدر":"Source",
    "خطة المشروع":"Project plan",
    "نظرة عامة":"Overview",
    "العمالة والرواتب":"Workforce and wages",
    "الإنفاق":"Expenditure",
    "قيمة المشاريع":"Project value",

  };
  let lang = localStorage.getItem(KEY) === "en" ? "en" : "ar";
  const translate = (s) => {
    const t = String(s || "").trim();
    if (!t || lang !== "en") return s;
    if (dict[t]) return String(s).replace(t, dict[t]);
    const prefix = Object.keys(dict).filter(k => (k.endsWith(":") && t.startsWith(k)) || (k === "يجب أن تكون مدة" && t.startsWith(k + " "))).sort((a,b) => b.length-a.length)[0];
    if (prefix) return String(s).replace(t, dict[prefix] + t.slice(prefix.length));
    return s;
  };
  function walk(root) {
    if (lang === "ar") return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      if (!n.parentElement || /^(SCRIPT|STYLE|CODE|PRE|TEXTAREA)$/i.test(n.parentElement.tagName)) return;
      const original = n.nodeValue;
      const trimmed = original.trim();
      const translated = translate(trimmed);
      if (translated !== trimmed) n.nodeValue = original.replace(trimmed, translated);
    });
    root.querySelectorAll("input[placeholder],textarea[placeholder],button[title],input[aria-label]").forEach(el => {
      ["placeholder","title","aria-label"].forEach(a => { if (el.hasAttribute(a)) { const v=el.getAttribute(a); if(dict[v]) el.setAttribute(a,dict[v]); }});
    });
  }
  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.body.classList.toggle("icv-lang-en", lang === "en");
    document.body.classList.toggle("icv-lang-ar", lang === "ar");
    if (lang === "en") walk(document.body);
    document.querySelectorAll(".icv-language-choice").forEach(btn => {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    document.title = lang === "en" ? (dict[document.title] || "Local Content Follow-up") : (document.title === "Local Content Follow-up" ? "متابعة المحتوى المحلي" : document.title);
  }
  function mount() {
    if (!document.body) return;
    const style = document.createElement("style");
    style.textContent = "html[dir=ltr] body{font-family:Arial,sans-serif}html[dir=ltr] .side{right:auto;left:0}html[dir=ltr] .main{margin-right:0;margin-left:250px}html[dir=ltr] .nav button{text-align:left}html[dir=ltr] .side .logout{right:14px;left:14px}html[dir=ltr] .is-nav button{text-align:left}html[dir=ltr] .icv-message{direction:ltr}.icv-language-switch{display:flex;align-items:center;gap:4px;margin:7px 0 5px;direction:ltr;flex-wrap:nowrap}.icv-language-choice{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:5px 8px;border:1px solid rgba(255,255,255,.24);border-radius:8px;background:rgba(255,255,255,.07);color:var(--nav-ink,#fff);font:700 12px/1.2 Arial,sans-serif;cursor:pointer;white-space:nowrap;min-width:58px}.icv-language-choice.active{background:#fff;color:#0c514b;border-color:#fff;box-shadow:0 2px 7px #0002}.icv-language-choice:focus-visible{outline:2px solid #d9a441;outline-offset:2px}.brand .icv-language-switch{margin-top:8px;margin-bottom:8px}.brand .icv-language-choice{flex:0 0 auto}";
    document.head.appendChild(style);
    const brand = document.querySelector(".side .brand");
    const brandTitle = brand && brand.querySelector(":scope > div:last-child > b");
    if (brandTitle && !document.getElementById("icvLanguageSwitch")) {
      const group = document.createElement("div");
      group.id = "icvLanguageSwitch";
      group.className = "icv-language-switch";
      group.setAttribute("role","group");
      group.setAttribute("aria-label","Choose language");
      [["en","🇬🇧","EN"],["ar","🇴🇲","AR"]].forEach(([value,flag,label]) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "icv-language-choice";
        btn.dataset.lang = value;
        btn.textContent = flag + " " + label;
        btn.setAttribute("aria-label", value === "en" ? "English" : "العربية");
        btn.addEventListener("click", () => {
          if (lang === value) return;
          localStorage.setItem(KEY,value);
          location.reload();
        });
        group.appendChild(btn);
      });
      brandTitle.insertAdjacentElement("afterend",group);
    }
    apply();
    const observer = new MutationObserver(mutations => { if(lang === "en") mutations.forEach(m => m.addedNodes.forEach(n => { if(n.nodeType===Node.ELEMENT_NODE) walk(n); else if(n.nodeType===Node.TEXT_NODE && dict[n.nodeValue.trim()]) n.nodeValue=dict[n.nodeValue.trim()]; })); });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",mount); else mount();
  window.ICVLanguage = { get:()=>lang, set:(v)=>{lang=v==="en"?"en":"ar";localStorage.setItem(KEY,lang);location.reload();}, translate };
})();