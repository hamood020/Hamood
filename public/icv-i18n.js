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
    "من أصل":"of","عرض":"Showing","من":"From","إلى":"To","الملاحظات":"Notes","الأدوار":"Roles",
    "الصلاحيات":"Permissions","جهات الاتصال":"Contact points","نقاط التواصل":"Contact points",
    "إضافة مهمة":"Add task","المهام":"Tasks","الأولوية":"Priority","مفتوحة":"Open","مغلقة":"Closed",
    "العملة":"Currency","تاريخ الإنشاء":"Created at","آخر تحديث":"Last updated"
  };
  let lang = localStorage.getItem(KEY) === "en" ? "en" : "ar";
  const translate = (s) => {
    const t = String(s || "").trim();
    if (!t || lang !== "en") return s;
    if (dict[t]) return String(s).replace(t, dict[t]);
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
      if (dict[trimmed]) n.nodeValue = original.replace(trimmed, dict[trimmed]);
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
    const btn = document.getElementById("icvLanguageToggle");
    if (btn) { btn.textContent = lang === "ar" ? "English" : "العربية"; btn.setAttribute("aria-label", lang === "ar" ? "Switch language to English" : "التبديل إلى العربية"); }
    document.title = lang === "en" ? (dict[document.title] || "Local Content Follow-up") : (document.title === "Local Content Follow-up" ? "متابعة المحتوى المحلي" : document.title);
  }
  function mount() {
    if (!document.body || document.getElementById("icvLanguageToggle")) return;
    const btn = document.createElement("button");
    btn.id = "icvLanguageToggle"; btn.type = "button"; btn.className = "btn";
    btn.style.cssText = "position:fixed;top:12px;left:14px;z-index:100001;min-width:92px;background:#fff;border:1px solid #dbe3ec;box-shadow:0 4px 14px #0001";
    btn.onclick = () => { lang = lang === "ar" ? "en" : "ar"; localStorage.setItem(KEY,lang); location.reload(); };
    document.body.appendChild(btn);
    const style = document.createElement("style");
    style.textContent = "html[dir=ltr] body{font-family:Arial,sans-serif}html[dir=ltr] .side{right:auto;left:0}html[dir=ltr] .main{margin-right:0;margin-left:250px}html[dir=ltr] .nav button{text-align:left}html[dir=ltr] .side .logout{right:14px;left:14px}html[dir=ltr] .is-nav button{text-align:left}html[dir=ltr] .icv-message{direction:ltr}";
    document.head.appendChild(style);
    apply();
    const observer = new MutationObserver(mutations => { if(lang === "en") mutations.forEach(m => m.addedNodes.forEach(n => { if(n.nodeType===Node.ELEMENT_NODE) walk(n); else if(n.nodeType===Node.TEXT_NODE && dict[n.nodeValue.trim()]) n.nodeValue=dict[n.nodeValue.trim()]; })); });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",mount); else mount();
  window.ICVLanguage = { get:()=>lang, set:(v)=>{lang=v==="en"?"en":"ar";localStorage.setItem(KEY,lang);location.reload();}, translate };
})();