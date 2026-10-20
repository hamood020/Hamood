/* ICV New Settings Page */
(function () {
  "use strict";
  const KEY = "icv-settings-v1";
  // Errors go through the shared message box; success messages use icvSaveSuccess.
  const toastA = (m) => window.ICV.showMessage(String(m), "error");
  const D = {
    general: {
      platformName: "ICV New",
      owner: "هيئة المشاريع والمناقصات والمحتوى المحلي",
      language: "ar",
      currency: "OMR",
      fiscalYear: "2026",
      timezone: "Asia/Muscat",
      dateFormat: "DD/MM/YYYY",
      logo: "",
      compact: false,
    },
    local: {
      omanization: 30,
      sme: 10,
      goodsMin: 40,
      servicesMin: 10,
      omaniSalary: 80,
      foreignSalary: 20,
      madeInOman: 70,
      localSupplier: 18,
      directImport: 6,
      smePurchase: 18,
      localService: 100,
      foreignService: 10,
      smeService: 70,
      smeSubcontract: 70,
      subcontractLocal: 70,
      subcontractForeign: 10,
    },
    reports: {
      years: "2026,2027,2028,2029,2030,2031,2032,2033,2034,2035",
      quarters: ["Q1", "Q2", "Q3", "Q4"],
      type: "تراكمي",
      statuses: ["مسودة", "مستلم", "قيد المراجعة", "معتمد", "مرفوض"],
      lockApproved: false,
      multiReport: false,
      dueDays: 30,
      lateAfter: 7,
    },
    projects: {
      statuses: ["مسند", "قيد التنفيذ", "منتهي", "متعثر"],
      extensionTypes: ["تمديد مدة", "تغيير تاريخ الانتهاء", "تمديد معتمد", "تمديد قيد الدراسة"],
      requiredValue: true,
      requiredDates: true,
      requiredEntity: true,
      requiredCompany: false,
    },
    users: {
      roleLabels: {},
      entityAccess: true,
    },
    notifications: {
      reportDue: true,
      projectExpiry: true,
      approval: true,
      delay: true,
      planUpdate: true,
      daysBefore: 10,
    },
    audit: { retention: 365 },
    refs: {
      supplyTypes: ["صنع في عمان", "مورد محلي", "استيراد مباشر", "SME"],
      supplierTypes: ["محلي", "أجنبي", "SME"],
    },
  };
  function merge(a, b) {
    return Object.assign({}, a, b || {});
  }
  function normalize(x) {
    x = x && typeof x === "object" ? x : {};
    const out = {};
    Object.keys(D).forEach((k) => (out[k] = merge(D[k], x[k])));
    out.reports.statuses = Array.isArray(out.reports.statuses) && out.reports.statuses.length
      ? [...new Set([...out.reports.statuses.map(String).filter(Boolean), "معتمد"])]
      : [...D.reports.statuses];
    out.reports.quarters = Array.isArray(out.reports.quarters) && out.reports.quarters.length
      ? out.reports.quarters.map(String)
      : [...D.reports.quarters];
    out.reports.years = String(out.reports.years || D.reports.years);
    out.projects.statuses = Array.isArray(out.projects.statuses) && out.projects.statuses.length
      ? out.projects.statuses.map(String).filter(Boolean)
      : [...D.projects.statuses];
    out.projects.extensionTypes = Array.isArray(out.projects.extensionTypes) && out.projects.extensionTypes.length
      ? out.projects.extensionTypes.map(String).filter(Boolean)
      : [...D.projects.extensionTypes];
    delete out.audit.enabled; // the audit log is always on
    delete out.users.roles; // replaced by roleLabels
    return out;
  }
  function load() {
    try {
      return normalize(JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch (e) {
      return normalize({});
    }
  }
  let S = load();
  function publishCalcSettings() {
    const L = S.local || D.local,
      G = S.general || D.general;
    window.__icvCalculationSettings = {
      thresholds: {
        omanization: Number(L.omanization ?? 30),
        sme: Number(L.sme ?? 10),
        goods: Number(L.goodsMin ?? 40),
        services: Number(L.servicesMin ?? 10),
      },
      coefficients: {
        omaniSalary: Number(L.omaniSalary ?? 80) / 100,
        foreignSalary: Number(L.foreignSalary ?? 20) / 100,
        madeInOman: Number(L.madeInOman ?? 70) / 100,
        localSupplier: Number(L.localSupplier ?? 18) / 100,
        directImport: Number(L.directImport ?? 6) / 100,
        smePurchase: Number(L.smePurchase ?? 18) / 100,
        localService: Number(L.localService ?? 100) / 100,
        foreignService: Number(L.foreignService ?? 10) / 100,
        smeService: Number(L.smeService ?? 70) / 100,
        smeSubcontract: Number(L.smeSubcontract ?? 70) / 100,
        subcontractLocal: Number(L.subcontractLocal ?? L.smeSubcontract ?? 70) / 100,
        subcontractForeign: Number(L.subcontractForeign ?? 10) / 100,
      },
    };
    window.ICV?.setRoleLabels(S.users?.roleLabels);
    window.__icvSettings = S;
    if (G.platformName) {
      document.title = G.platformName;
      document.querySelectorAll(".brand b").forEach((x) => (x.textContent = G.platformName));
      const h = document.querySelector("#login h1");
      if (h) h.textContent = G.platformName;
    }
    if (G.owner) document.querySelectorAll(".brand small").forEach((x) => (x.textContent = G.owner));
    document.body.classList.toggle("icv-compact-mode", !!G.compact);
  }
  async function syncFromDatabase() {
    const client = window.__icvAccessClient;
    if (!client) return S;
    try {
      const sr = await client.auth.getSession();
      if (!sr.data?.session) return S;
      const { data, error } = await client
        .from("platform_settings")
        .select("settings")
        .eq("id", "global")
        .maybeSingle();
      if (error) throw error;
      if (data?.settings) {
        S = normalize(data.settings);
        localStorage.setItem(KEY, JSON.stringify(S));
        publishCalcSettings();
      }
    } catch (e) {
      console.warn("تعذر تحميل إعدادات المنصة من قاعدة البيانات", e.message);
    }
    return S;
  }
  async function persistSettings() {
    publishCalcSettings();
    localStorage.setItem(KEY, JSON.stringify(S));
    const client = window.__icvAccessClient;
    if (!client) throw new Error("تعذر الاتصال بقاعدة البيانات");
    const sr = await client.auth.getSession();
    const session = sr.data?.session;
    if (!session) throw new Error("انتهت الجلسة، يرجى تسجيل الدخول من جديد");
    const { error } = await client
      .from("platform_settings")
      .upsert(
        { id: "global", settings: S, updated_by: session.user.id, updated_at: new Date().toISOString() },
        { onConflict: "id" },
      );
    if (error) throw error;
    window.__icvSettingsReady = Promise.resolve(S);
    return S;
  }
  publishCalcSettings();
  window.__icvSettingsReady = (async () => {
    const client = window.__icvAccessClient;
    if (client) {
      const sr = await client.auth.getSession();
      if (sr.data?.session) return syncFromDatabase();
      client.auth.onAuthStateChange((event, session) => {
        if (session) window.__icvSettingsReady = syncFromDatabase();
      });
    }
    return S;
  })();
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[m]);
  const field = (l, id, v, t = "text", h = "") =>
    '<div class="isf"><label>' +
    esc(l) +
    '</label><input id="' +
    id +
    '" type="' +
    t +
    '" value="' +
    esc(v) +
    '">' +
    (h ? "<small>" + esc(h) + "</small>" : "") +
    "</div>";
  const select = (l, id, v, o) =>
    '<div class="isf"><label>' +
    esc(l) +
    '</label><select id="' +
    id +
    '">' +
    o
      .map(
        (x) =>
          '<option value="' +
          esc(x[0]) +
          '" ' +
          (String(x[0]) === String(v) ? "selected" : "") +
          ">" +
          esc(x[1]) +
          "</option>",
      )
      .join("") +
    "</select></div>";
  const toggle = (l, id, on, d = "") =>
    '<label class="iswitch"><span><b>' +
    esc(l) +
    "</b>" +
    (d ? "<small>" + esc(d) + "</small>" : "") +
    '</span><input id="' +
    id +
    '" type="checkbox" ' +
    (on ? "checked" : "") +
    "><i></i></label>";
  const chips = (l, id, a) =>
    '<div class="isf full"><label>' +
    esc(l) +
    '</label><div class="ichips" id="' +
    id +
    '">' +
    (a || [])
      .map((x) => '<span class="ichip">' + esc(x) + ' <button type="button" data-r>×</button></span>')
      .join("") +
    '<input placeholder="اكتب ثم اضغط Enter"></div></div>';
  function style() {
    if (document.getElementById("is-style")) return;
    const s = document.createElement("style");
    s.id = "is-style";
    s.textContent =
      '.is-wrap{display:grid;grid-template-columns:225px 1fr;gap:18px;align-items:start}.is-nav{position:sticky;top:18px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:10px;box-shadow:var(--shadow)}.is-nav small{display:block;color:var(--muted);font-size:10px;padding:3px 10px 8px}.is-nav button{width:100%;border:0;background:transparent;text-align:right;padding:11px 12px;border-radius:10px;font-family:inherit;font-weight:700;font-size:12px;color:var(--ink);cursor:pointer}.is-nav button:hover,.is-nav button.active{background:var(--soft);color:var(--primary2)}.is-content{min-width:0}.is-sec{display:none}.is-sec.active{display:block}.is-hero{background:linear-gradient(135deg,var(--primary2),var(--primary));color:#fff;border-radius:20px;padding:22px;margin-bottom:16px;box-shadow:var(--shadow)}.is-hero h2{margin:0 0 5px;font-size:20px}.is-hero p{margin:0;opacity:.82;font-size:12px}.is-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px;box-shadow:var(--shadow);margin-bottom:16px}.is-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px}.is-head h3{margin:0;font-size:16px}.is-head p{margin:3px 0 0;color:var(--muted);font-size:11px}.is-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.is-grid.two{grid-template-columns:repeat(2,1fr)}.isf{min-width:0}.isf.full{grid-column:1/-1}.isf label{display:block;font-size:11px;font-weight:800;margin-bottom:6px}.isf input,.isf select{width:100%;height:42px;border:1px solid var(--line);border-radius:10px;background:#fff;padding:0 11px;font-family:inherit;font-size:12px;outline:none}.isf small{display:block;color:var(--muted);font-size:9px;margin-top:5px}.ith{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:15px}.ith div{border:1px solid var(--line);border-radius:14px;padding:14px;background:#fbfdfd}.ith b{display:block;font-size:23px;color:var(--primary2)}.ith span{font-size:10px;color:var(--muted)}.iswitches{display:grid;grid-template-columns:1fr 1fr;gap:8px}.iswitch{min-height:58px;border:1px solid var(--line);border-radius:12px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;background:#fff}.iswitch b{display:block;font-size:11px}.iswitch small{display:block;color:var(--muted);font-size:9px;margin-top:2px}.iswitch input{display:none}.iswitch i{width:40px;height:22px;border-radius:99px;background:#d9dee6;position:relative;flex:none}.iswitch i:after{content:"";position:absolute;width:18px;height:18px;top:2px;right:2px;background:#fff;border-radius:50%;box-shadow:0 1px 4px #0002;transition:.18s}.iswitch input:checked+i{background:var(--primary)}.iswitch input:checked+i:after{right:20px}.ichips{min-height:44px;border:1px solid var(--line);border-radius:10px;padding:6px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}.ichip{background:var(--soft);color:var(--primary2);padding:5px 8px;border-radius:999px;font-size:10px;font-weight:700}.ichip button{border:0;background:transparent;color:inherit;padding:0 2px;cursor:pointer}.ichips input{border:0!important;outline:0!important;flex:1;min-width:130px;height:30px!important}.is-info{padding:11px 13px;background:#f7fafc;border:1px solid var(--line);border-radius:10px;color:var(--muted);font-size:10px;line-height:1.8}.is-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;padding-top:5px}.is-actions .muted{font-size:10px}.is-danger{border-color:#f2caca;background:#fffafa}.is-danger h3{color:#b91c1c}@media(max-width:1000px){.is-wrap{grid-template-columns:1fr}.is-nav{position:static;display:flex;overflow:auto;gap:5px}.is-nav button{white-space:nowrap;width:auto}.is-nav small{display:none}.is-grid{grid-template-columns:1fr 1fr}}@media(max-width:700px){.is-grid,.is-grid.two,.iswitches,.ith{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }
  async function renderAdmin() {
    const b = document.getElementById("page-settings");
    if (!b) return;
    style();
    editorSettingsStyle();
    await syncFromDatabase();
    b.innerHTML =
      '<div class="is-hero"><h2>إعدادات المنصة</h2><p>مركز التحكم في إعدادات ICV New، قواعد المحتوى المحلي، التقارير، المشاريع، الصلاحيات والتنبيهات.</p></div><div class="is-wrap"><aside class="is-nav"><small>الإعدادات</small>' +
      [
        ["general", "عام", "⚙"],
        ["local", "المحتوى المحلي", "◈"],
        ["reports", "التقارير", "▤"],
        ["projects", "المشاريع", "▦"],
        ["users", "المستخدمون والصلاحيات", "♙"],
        ["notifications", "الإشعارات", "◔"],
        ["audit", "النسخ الاحتياطي والسجل", "◫"],
        ["refs", "البيانات المرجعية", "◆"],
        ["manage-projects", "إدارة المشاريع", "▦"],
      ]
        .map(
          (x, i) =>
            '<button data-tab="' +
            x[0] +
            '" class="' +
            (!i ? "active" : "") +
            '"><span style="display:inline-block;width:24px">' +
            x[2] +
            "</span>" +
            x[1] +
            "</button>",
        )
        .join("") +
      '</aside><div class="is-content">' +
      '<section class="is-sec active" data-sec="general"><div class="is-card"><div class="is-head"><div><h3>إعدادات المنصة</h3><p>المعلومات العامة التي تظهر في المنصة والتقارير.</p></div><span class="pill">عام</span></div><div class="is-grid">' +
      field("اسم المنصة", "platformName", S.general.platformName) +
      field("الجهة المالكة / المشغلة", "owner", S.general.owner) +
      select("اللغة", "language", S.general.language, [
        ["ar", "العربية"],
        ["en", "English"],
      ]) +
      select("العملة", "currency", S.general.currency, [
        ["OMR", "ريال عماني (OMR)"],
        ["USD", "دولار أمريكي (USD)"],
      ]) +
      field("السنة المالية", "fiscalYear", S.general.fiscalYear, "number") +
      select("المنطقة الزمنية", "timezone", S.general.timezone, [
        ["Asia/Muscat", "مسقط — UTC+4"],
        ["UTC", "UTC"],
      ]) +
      select("تنسيق التاريخ", "dateFormat", S.general.dateFormat, [
        ["DD/MM/YYYY", "DD/MM/YYYY"],
        ["YYYY-MM-DD", "YYYY-MM-DD"],
      ]) +
      field("رابط الشعار", "logo", S.general.logo) +
      '</div><div style="margin-top:14px" class="iswitches">' +
      toggle("وضع العرض المختصر", "compact", S.general.compact, "تقليل المساحات في بعض الجداول والبطاقات.") +
      '</div></div><div class="is-card"><div class="is-head"><div><h3>مظهر المنصة</h3><p>الثيم والخط وحجم النص موجودة في زر «المظهر» في الشريط الجانبي.</p></div></div><div class="is-info">لا نكرر إعدادات المظهر هنا حتى لا تصبح الإعدادات مزدوجة.</div></div></section>' +
      '<section class="is-sec" data-sec="local"><div class="is-card"><div class="is-head"><div><h3>قواعد المحتوى المحلي</h3><p>حدود الاستيفاء التي تعتمد عليها مؤشرات المنصة.</p></div><span class="pill">أساسي</span></div><div class="ith"><div><b>' +
      S.local.omanization +
      "%</b><span>الحد الأدنى للتعمين</span></div><div><b>" +
      S.local.sme +
      "%</b><span>الحد الأدنى لـ SME</span></div><div><b>" +
      S.local.goodsMin +
      "%</b><span>الحد الأدنى للسلع</span></div><div><b>" +
      S.local.servicesMin +
      '%</b><span>الحد الأدنى للخدمات</span></div></div><div class="is-grid">' +
      field("الحد الأدنى للتعمين %", "omanization", S.local.omanization, "number") +
      field("الحد الأدنى لـ SME %", "sme", S.local.sme, "number") +
      field("الحد الأدنى للسلع %", "goodsMin", S.local.goodsMin, "number") +
      field("الحد الأدنى للخدمات %", "servicesMin", S.local.servicesMin, "number") +
      '</div></div><div class="is-card"><div class="is-head"><div><h3>معاملات الحساب</h3><p>مصدر مركزي بدل تثبيت المعاملات داخل JavaScript.</p></div></div><div class="is-grid">' +
      field("الرواتب العمانية %", "omaniSalary", S.local.omaniSalary, "number") +
      field("الرواتب غير العمانية %", "foreignSalary", S.local.foreignSalary, "number") +
      field("صنع في عمان %", "madeInOman", S.local.madeInOman, "number") +
      field("المورد المحلي %", "localSupplier", S.local.localSupplier, "number") +
      field("الاستيراد المباشر %", "directImport", S.local.directImport, "number") +
      field("SME — المشتريات %", "smePurchase", S.local.smePurchase, "number") +
      field("الخدمات المحلية %", "localService", S.local.localService, "number") +
      field("الخدمات الأجنبية %", "foreignService", S.local.foreignService, "number") +
      field("SME — الخدمات %", "smeService", S.local.smeService, "number") +
      field("عقود الباطن — مزود محلي %", "subcontractLocal", S.local.subcontractLocal, "number") +
      field("عقود الباطن — مزود أجنبي %", "subcontractForeign", S.local.subcontractForeign, "number") +
      field("عقود الباطن — SME %", "smeSubcontract", S.local.smeSubcontract, "number") +
      '</div><div class="is-info" style="margin-top:14px">تحسب قاعدة البيانات مؤشرات كل مشروع من التقارير المعتمدة فقط بهذه المعاملات والحدود، ويُعاد الحساب لجميع المشاريع فور حفظ أي تغيير هنا. يكون المشروع «مستوفيًا» عندما يحقق جميع المعايير المنطبقة عليه (التعمين، SME، السلع، الخدمات).</div></div></section>' +
      '<section class="is-sec" data-sec="reports"><div class="is-card"><div class="is-head"><div><h3>إعدادات التقارير</h3><p>السنوات، الأرباع، نوع التقرير، حالات الاعتماد ومواعيد التسليم.</p></div></div><div class="is-grid">' +
      field("سنوات التقارير", "reportYears", S.reports.years) +
      select("نوع التقرير الافتراضي", "reportType", S.reports.type, [
        ["ربعي منفصل", "ربعي منفصل"],
        ["تراكمي", "تراكمي"],
      ]) +
      field("مدة التسليم الافتراضية بالأيام", "dueDays", S.reports.dueDays, "number") +
      field("يُعتبر متأخرًا بعد (أيام)", "lateAfter", S.reports.lateAfter, "number") +
      '</div><div style="margin-top:14px" class="iswitches">' +
      toggle(
        "قفل التقرير بعد الاعتماد",
        "lockApproved",
        S.reports.lockApproved,
        "عند التفعيل لا يعدّل التقرير المعتمد إلا مدير النظام.",
      ) +
      toggle("السماح بأكثر من تقرير للربع", "multiReport", S.reports.multiReport) +
      "</div>" +
      chips("حالات التقرير", "reportStatuses", S.reports.statuses) +
      '</div><div class="is-card"><div class="is-head"><div><h3>الأرباع المعتمدة</h3><p>الأرباع المستخدمة في النظام.</p></div></div>' +
      chips("الأرباع", "quarters", S.reports.quarters) +
      "</div></section>" +
      '<section class="is-sec" data-sec="projects"><div class="is-card"><div class="is-head"><div><h3>إعدادات المشاريع</h3><p>الحالات الرسمية وأنواع تمديد المدة والحقول المطلوبة.</p></div></div>' +
      chips("حالات المشروع", "projectStatuses", S.projects.statuses) +
      chips("أنواع التمديد", "extensionTypes", S.projects.extensionTypes) +
      '<div style="margin-top:14px" class="iswitches">' +
      toggle("قيمة المشروع إلزامية", "requiredValue", S.projects.requiredValue) +
      toggle("تاريخ البداية والنهاية إلزامي", "requiredDates", S.projects.requiredDates) +
      toggle("الجهة الحكومية إلزامية", "requiredEntity", S.projects.requiredEntity) +
      toggle("الشركة المنفذة إلزامية", "requiredCompany", S.projects.requiredCompany) +
      "</div></div></section>" +
      '<section class="is-sec" data-sec="users"><div class="is-card"><div class="is-head"><div><h3>المستخدمون والصلاحيات</h3><p>الأدوار الأساسية وربط المستخدم بالجهات الحكومية.</p></div></div>' +
      '<div class="is-grid">' +
      window.ICV.ROLE_ORDER.map((r) =>
        field(
          "اسم الدور: " + window.ICV.DEFAULT_ROLE_LABELS[r],
          "roleLabel_" + r,
          (S.users.roleLabels || {})[r] || window.ICV.DEFAULT_ROLE_LABELS[r],
        ),
      ).join("") +
      '</div><div class="is-info" style="margin-top:10px">تغيير الاسم يغيّر طريقة عرض الدور فقط، ولا يغيّر صلاحياته.</div><div style="margin-top:14px">' +
      toggle(
        "عرض الجهات المسندة افتراضيًا",
        "entityAccess",
        S.users.entityAccess,
        "تفتح القوائم مفلترة على جهات المستخدم، ويستطيع إلغاء الفلتر لرؤية بقية الجهات.",
      ) +
      '</div><div class="is-info" style="margin-top:12px">إدارة المستخدمين الفعلية تبقى في صفحة «إدارة المستخدمين».</div></div></section>' +
      '<section class="is-sec" data-sec="notifications"><div class="is-card"><div class="is-head"><div><h3>الإشعارات والتنبيهات</h3><p>تنبيهات الاستحقاقات والمشاريع والتقارير.</p></div></div><div class="iswitches">' +
      toggle("اقتراب موعد التقرير", "reportDue", S.notifications.reportDue) +
      toggle("اقتراب انتهاء المشروع", "projectExpiry", S.notifications.projectExpiry) +
      toggle("اعتماد / رفض التقرير", "approval", S.notifications.approval) +
      toggle("تأخر المشروع", "delay", S.notifications.delay) +
      toggle("الخطة تحتاج تحديث", "planUpdate", S.notifications.planUpdate) +
      '</div><div class="is-grid two" style="margin-top:14px">' +
      field("التنبيه قبل الموعد بـ (أيام)", "daysBefore", S.notifications.daysBefore, "number") +
      "</div></div></section>" +
      '<section class="is-sec" data-sec="audit"><div class="is-card"><div class="is-head"><div><h3>النسخ الاحتياطي وسجل التدقيق</h3><p>توثيق العمليات ومتابعة النسخ الاحتياطية.</p></div></div>' +
      '<div class="is-info">سجل التدقيق مفعّل دائمًا: يسجّل المستخدم والعملية والتاريخ والقيم القديمة والجديدة لكل تعديل.</div>' +
      '<div class="is-grid two" style="margin-top:12px">' +
      field(
        "مدة الاحتفاظ بالسجل (يوم)",
        "auditRetention",
        S.audit.retention,
        "number",
        "تُحذف الأحداث الأقدم من هذه المدة تلقائيًا كل يوم.",
      ) +
      '</div><div class="is-actions" style="margin-top:14px"><span class="muted">النسخ الاحتياطية الكاملة لقاعدة البيانات تنفذ من Supabase.</span><div class="actions"><button class="btn" type="button" onclick="icvSettingsExport()">تصدير الإعدادات</button><button class="btn" type="button" onclick="icvSettingsImport()">استيراد الإعدادات</button></div></div></div><div class="is-card is-danger"><div class="is-head"><div><h3>منطقة حساسة</h3><p>إعادة الإعدادات للقيم الافتراضية.</p></div></div><button class="btn danger" type="button" onclick="icvSettingsReset()">إعادة الإعدادات الافتراضية</button></div></section>' +
      '<section class="is-sec" data-sec="refs"><div class="is-card"><div class="is-head"><div><h3>البيانات المرجعية</h3><p>القوائم المستخدمة في المشتريات والخدمات والمقاولات.</p></div></div>' +
      chips("أنواع التوريد / المشتريات", "supplyTypes", S.refs.supplyTypes) +
      chips("أنواع الموردين للخدمات والمقاولات", "supplierTypes", S.refs.supplierTypes) +
      '<div class="is-info" style="margin-top:14px">الجهات الحكومية والشركات لها صفحات مستقلة.</div></div></section>' +
      '<section class="is-sec" data-sec="manage-projects"><div class="is-card"><div class="is-head"><div><h3>إدارة المشاريع</h3><p>عرض جميع المشاريع وإدارة حذفها. الحذف يزيل التقارير والخطط والسجلات المرتبطة بالمشروع ولا يمكن التراجع عنه من داخل المنصة.</p></div><span class="pill">مدير النظام فقط</span></div><div class="is-grid two">' +
      field("البحث في المشاريع", "adminProjectsSearch", "", "search") +
      '<div class="isf"><label for="adminProjectsStatus">حالة المشروع</label><select id="adminProjectsStatus"><option value="">جميع الحالات</option><option value="مسند">مسند</option><option value="قيد التنفيذ">قيد التنفيذ</option><option value="منتهي">منتهي</option><option value="متعثر">متعثر</option></select></div></div><div class="is-actions" style="margin:12px 0"><span class="muted" id="adminProjectsNotice" aria-live="polite">سيتم تحميل المشاريع عند فتح هذا القسم.</span><button class="btn" type="button" id="adminProjectsRefresh">تحديث القائمة</button></div><div class="table-wrap"><table class="is-projects-table"><thead><tr><th>م</th><th>اسم المشروع</th><th>رقم المناقصة</th><th>الجهة الحكومية</th><th>الشركة المنفذة</th><th>القيمة (ر.ع)</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody id="adminProjectsRows"><tr><td colspan="8" class="empty">افتح القسم لتحميل المشاريع.</td></tr></tbody></table></div></div></section>' +
      '<div class="is-actions"><span class="muted">آخر حفظ: <span id="settingsSaved">لم يتم الحفظ بعد</span></span><button class="btn primary" type="button" id="settingsSave">حفظ جميع الإعدادات</button></div></div></div>';
    bind();
  }
  function editorSettingsStyle() {
    if (document.getElementById("is-editor-style")) return;
    const s = document.createElement("style");
    s.id = "is-editor-style";
    s.textContent =
      ".is-entity-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.is-entity-choice{display:flex;align-items:center;gap:10px;border:1px solid var(--line);border-radius:12px;padding:12px;cursor:pointer;background:#fff}.is-entity-choice:has(input:checked){border-color:var(--primary);background:var(--soft)}.is-entity-choice input{width:18px;height:18px}.is-entity-choice b{display:block;font-size:11px}.is-entity-choice small{display:block;color:var(--muted);font-size:9px;margin-top:3px}@media(max-width:1100px){.is-entity-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.is-entity-grid{grid-template-columns:1fr}}";
    document.head.appendChild(s);
  }
  async function renderEditor() {
    const b = document.getElementById("page-settings");
    if (!b) return;
    style();
    editorSettingsStyle();
    const db = window.__icvAccessClient;
    if (!db) {
      b.innerHTML = '<div class="is-card"><div class="is-info">تعذر الاتصال بقاعدة البيانات.</div></div>';
      return;
    }
    const uid = window.__icvProfile?.id;
    if (!uid) {
      b.innerHTML = '<div class="is-card"><div class="is-info">تعذر تحديد حساب المستخدم.</div></div>';
      return;
    }
    const [pr, er, ar] = await Promise.all([
      db.from("user_notification_settings").select("*").eq("user_id", uid).maybeSingle(),
      db.from("government_entities").select("id,name").order("name"),
      db.from("user_entity_assignments").select("government_entity_id").eq("user_id", uid),
    ]);
    const N = Object.assign(
      {
        report_due: true,
        project_expiry: true,
        approval: true,
        delay: true,
        plan_update: true,
        days_before: 10,
      },
      pr.data || {},
    );
    const selected = new Set((ar.data || []).map((x) => x.government_entity_id));
    const entities = er.data || [];
    b.innerHTML =
      '<div class="is-hero"><h2>إعداداتي</h2><p>إعدادات حسابك الشخصية: الإشعارات والجهات الحكومية التي تتابعها.</p></div><div class="is-wrap"><aside class="is-nav"><small>إعدادات حسابي</small><button class="active" data-editor-tab="notifications"><span style="display:inline-block;width:24px">◔</span>الإشعارات</button><button data-editor-tab="entities"><span style="display:inline-block;width:24px">🏛</span>جهاتي الحكومية</button></aside><div class="is-content"><section class="is-sec active" data-editor-sec="notifications"><div class="is-card"><div class="is-head"><div><h3>الإشعارات والتنبيهات</h3><p>هذه الإعدادات تخص حسابك فقط ولا تؤثر على بقية المستخدمين.</p></div><span class="pill">حسابي</span></div><div class="iswitches">' +
      toggle("اقتراب موعد التقرير", "enReportDue", N.report_due) +
      toggle("اقتراب انتهاء المشروع", "enProjectExpiry", N.project_expiry) +
      toggle("اعتماد / رفض التقرير", "enApproval", N.approval) +
      toggle("تأخر المشروع", "enDelay", N.delay) +
      toggle("الخطة تحتاج تحديث", "enPlanUpdate", N.plan_update) +
      '</div><div class="is-grid two" style="margin-top:14px">' +
      field("التنبيه قبل الموعد بـ (أيام)", "enDaysBefore", N.days_before, "number") +
      '</div><div class="is-actions" style="margin-top:14px"><span class="muted">آخر حفظ: <span id="editorSettingsSaved">—</span></span><button class="btn primary" id="editorSettingsSave">حفظ إعدادات الإشعارات</button></div></div></section><section class="is-sec" data-editor-sec="entities"><div class="is-card"><div class="is-head"><div><h3>الجهات الحكومية المرتبطة بحسابي</h3><p>اختر الجهات التي تتابعها. هذا الاختيار لا يمنح صلاحيات وصول إضافية ولا يمنعك من البحث عن بقية المشاريع.</p></div><span class="pill">حسابي</span></div><div class="is-entity-grid">' +
      entities
        .map(
          (e) =>
            '<label class="is-entity-choice"><input type="checkbox" data-entity-id="' +
            esc(e.id) +
            '" ' +
            (selected.has(e.id) ? "checked" : "") +
            "><span><b>" +
            esc(e.name) +
            "</b><small>جهة للمتابعة</small></span></label>",
        )
        .join("") +
      '</div><div class="is-actions" style="margin-top:16px"><span class="muted">الجهات المحددة: <b id="editorEntityCount">' +
      selected.size +
      '</b></span><button class="btn primary" id="editorEntitiesSave">حفظ الجهات المرتبطة</button></div></div></section></div></div>';
    b.querySelectorAll("[data-editor-tab]").forEach(
      (x) =>
        (x.onclick = () => {
          b.querySelectorAll("[data-editor-tab]").forEach((y) => y.classList.remove("active"));
          b.querySelectorAll("[data-editor-sec]").forEach((y) => y.classList.remove("active"));
          x.classList.add("active");
          b.querySelector('[data-editor-sec="' + x.dataset.editorTab + '"]')?.classList.add("active");
        }),
    );
    const count = () => {
      const n = b.querySelectorAll("[data-entity-id]:checked").length;
      const el = document.getElementById("editorEntityCount");
      if (el) el.textContent = n;
    };
    b.querySelectorAll("[data-entity-id]").forEach((x) => (x.onchange = count));
    document.getElementById("editorSettingsSave").onclick = async () => {
      const payload = {
        user_id: uid,
        report_due: !!document.getElementById("enReportDue")?.checked,
        project_expiry: !!document.getElementById("enProjectExpiry")?.checked,
        approval: !!document.getElementById("enApproval")?.checked,
        delay: !!document.getElementById("enDelay")?.checked,
        plan_update: !!document.getElementById("enPlanUpdate")?.checked,
        days_before: Math.max(0, Number(document.getElementById("enDaysBefore")?.value || 10)),
      };
      const { error } = await db
        .from("user_notification_settings")
        .upsert(payload, { onConflict: "user_id" });
      if (error) {
        toastA(window.ICV.friendlyError(error));
        return;
      }
      document.getElementById("editorSettingsSaved").textContent = new Date().toLocaleString("ar-OM");
      window.icvSaveSuccess?.("تم حفظ إعدادات الإشعارات لحسابك");
    };
    document.getElementById("editorEntitiesSave").onclick = async () => {
      const ids = [...b.querySelectorAll("[data-entity-id]:checked")].map((x) =>
        x.getAttribute("data-entity-id"),
      );
      // One server call replaces the list atomically and only for the signed-in user.
      const { error } = await db.rpc("set_my_entity_assignments", { p_entity_ids: ids });
      if (error) {
        toastA(window.ICV.friendlyError(error));
        return;
      }
      window.icvSaveSuccess?.("تم حفظ الجهات الحكومية المرتبطة بحسابك");
    };
  }
  function render() {
    const role = window.__icvProfile?.role;
    if (role === "editor" || role === "section_head") {
      renderEditor();
      return;
    }
    if (role === "admin") {
      renderAdmin();
      return;
    }
    const b = document.getElementById("page-settings");
    if (b)
      b.innerHTML =
        '<div class="is-card"><div class="is-info">لا تملك صلاحية الوصول إلى إعدادات المنصة.</div></div>';
  }

  let adminManagedProjects = [];
  async function loadAdminProjectManagement() {
    const notice = document.getElementById("adminProjectsNotice"),
      body = document.getElementById("adminProjectsRows");
    if (window.__icvProfile?.role !== "admin") {
      if (notice) notice.textContent = "هذا القسم متاح لمدير النظام فقط.";
      if (body) body.replaceChildren();
      return;
    }
    const client = window.__icvAccessClient;
    if (!client) {
      if (notice) notice.textContent = "تعذر الاتصال بقاعدة البيانات.";
      return;
    }
    if (notice) notice.textContent = "جارٍ تحميل جميع المشاريع...";
    if (body) body.innerHTML = '<tr><td colspan="8" class="empty">جارٍ التحميل...</td></tr>';
    try {
      const all = [];
      const pageSize = 500;
      let start = 0;
      while (true) {
        const { data, error } = await client
          .from("projects")
          .select(
            "id,project_name,serial_no,tender_type,project_status,total_project_value,created_at,government_entities(name),companies(name)",
          )
          .order("created_at", { ascending: false })
          .range(start, start + pageSize - 1);
        if (error) throw error;
        const page = data || [];
        all.push(...page);
        if (page.length < pageSize) break;
        start += pageSize;
      }
      adminManagedProjects = all;
      const search = document.getElementById("adminProjectsSearch"),
        status = document.getElementById("adminProjectsStatus"),
        refresh = document.getElementById("adminProjectsRefresh");
      if (search) search.oninput = renderAdminManagedProjects;
      if (status) status.onchange = renderAdminManagedProjects;
      if (refresh) refresh.onclick = () => void loadAdminProjectManagement();
      renderAdminManagedProjects();
    } catch (error) {
      if (notice) notice.textContent = "تعذر تحميل المشاريع: " + String(error?.message || error);
      if (body)
        body.innerHTML =
          '<tr><td colspan="8" class="empty">فشل تحميل المشاريع. استخدم زر التحديث للمحاولة مجددًا.</td></tr>';
    }
  }
  function renderAdminManagedProjects() {
    const body = document.getElementById("adminProjectsRows"),
      notice = document.getElementById("adminProjectsNotice");
    if (!body) return;
    if (window.__icvProfile?.role !== "admin") {
      body.replaceChildren();
      if (notice) notice.textContent = "هذا القسم متاح لمدير النظام فقط.";
      return;
    }
    const query = (document.getElementById("adminProjectsSearch")?.value || "")
      .trim()
      .toLocaleLowerCase("ar");
    const status = document.getElementById("adminProjectsStatus")?.value || "";
    const filtered = adminManagedProjects.filter((p) => {
      const text = [
        p.project_name,
        p.serial_no,
        p.tender_type,
        p.government_entities?.name,
        p.companies?.name,
      ]
        .map((v) => String(v || "").toLocaleLowerCase("ar"))
        .join(" ");
      return (!query || text.includes(query)) && (!status || p.project_status === status);
    });
    if (notice)
      notice.textContent =
        "عرض " +
        filtered.length.toLocaleString("ar-OM") +
        " من أصل " +
        adminManagedProjects.length.toLocaleString("ar-OM") +
        " مشروع.";
    if (!filtered.length) {
      body.innerHTML = '<tr><td colspan="8" class="empty">لا توجد مشاريع مطابقة للبحث.</td></tr>';
      return;
    }
    body.innerHTML = filtered
      .map(
        (p, i) =>
          "<tr><td>" +
          (i + 1) +
          "</td><td>" +
          esc(p.project_name || "—") +
          "</td><td>" +
          esc(p.serial_no || p.tender_type || "—") +
          "</td><td>" +
          esc(p.government_entities?.name || "—") +
          "</td><td>" +
          esc(p.companies?.name || "—") +
          "</td><td>" +
          Number(p.total_project_value || 0).toLocaleString("en-OM", { maximumFractionDigits: 2 }) +
          "</td><td>" +
          esc(p.project_status || "—") +
          '</td><td><button type="button" class="btn danger" data-admin-delete-project="' +
          esc(p.id) +
          '">حذف المشروع</button></td></tr>',
      )
      .join("");
    body
      .querySelectorAll("[data-admin-delete-project]")
      .forEach((button) =>
        button.addEventListener(
          "click",
          () => void deleteAdminManagedProject(button.dataset.adminDeleteProject, button),
        ),
      );
  }
  async function deleteAdminManagedProject(projectId, button) {
    if (window.__icvProfile?.role !== "admin") {
      toastA("الحذف متاح لمدير النظام فقط.");
      return;
    }
    const project = adminManagedProjects.find((p) => String(p.id) === String(projectId));
    if (!project) return;
    const projectName = String(project.project_name || "هذا المشروع");
    if (
      !confirm(
        "تأكيد حذف المشروع؟\n\n" +
          projectName +
          "\n\nسيتم حذف التقارير والخطط والملاحظات والسجلات التابعة له. لا يمكن التراجع عن الحذف من داخل المنصة.",
      )
    )
      return;
    const client = window.__icvAccessClient;
    if (!client) {
      toastA("تعذر الاتصال بقاعدة البيانات.");
      return;
    }
    if (button) {
      button.disabled = true;
      button.textContent = "جارٍ الحذف...";
    }
    try {
      const [planDocs, reports] = await Promise.all([
        client.from("project_plan_documents").select("storage_path").eq("project_id", projectId),
        client.from("quarterly_reports").select("report_data").eq("project_id", projectId),
      ]);
      if (planDocs.error) throw planDocs.error;
      if (reports.error) throw reports.error;
      const prefix = String(projectId) + "/";
      const planPaths = [
        ...new Set(
          (planDocs.data || []).map((x) => String(x.storage_path || "")).filter((x) => x.startsWith(prefix)),
        ),
      ];
      const reportPaths = [
        ...new Set(
          (reports.data || [])
            .map((x) => String(x.report_data?.attachment_path || ""))
            .filter((x) => x.startsWith(prefix)),
        ),
      ];
      const { data: deleted, error } = await client
        .from("projects")
        .delete()
        .eq("id", projectId)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!deleted?.id)
        throw new Error("لم يتم حذف المشروع. قد لا تملك الصلاحية أو ربما حُذف من مستخدم آخر.");
      adminManagedProjects = adminManagedProjects.filter((p) => String(p.id) !== String(projectId));
      renderAdminManagedProjects();
      const cleanupErrors = [];
      for (let start = 0; start < planPaths.length; start += 100) {
        const { error } = await client.storage
          .from("project-plan-documents")
          .remove(planPaths.slice(start, start + 100));
        if (error) cleanupErrors.push(error.message || "تعذر حذف بعض مرفقات الخطة.");
      }
      for (let start = 0; start < reportPaths.length; start += 100) {
        const { error } = await client.storage
          .from("project-report-documents")
          .remove(reportPaths.slice(start, start + 100));
        if (error) cleanupErrors.push(error.message || "تعذر حذف بعض مرفقات التقارير.");
      }
      if (cleanupErrors.length)
        toastA(
          "تم حذف المشروع وسجلاته، لكن تعذر حذف بعض الملفات المرفقة من التخزين. يرجى مراجعة التخزين. " +
            cleanupErrors.join("؛ "),
        );
      else window.icvSaveSuccess("تم حذف المشروع وجميع سجلاته ومرفقاته المرتبطة.");
    } catch (error) {
      toastA("تعذر حذف المشروع: " + window.ICV.friendlyError(error));
      await loadAdminProjectManagement();
    } finally {
      if (button && button.isConnected) {
        button.disabled = false;
        button.textContent = "حذف المشروع";
      }
    }
  }
  function bindChip(id) {
    const b = document.getElementById(id);
    if (!b) return;
    b.querySelectorAll("[data-r]").forEach((x) => (x.onclick = () => x.closest(".ichip").remove()));
    const i = b.querySelector("input");
    i?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const v = i.value.trim();
      if (!v) return;
      const s = document.createElement("span");
      s.className = "ichip";
      s.innerHTML = esc(v) + ' <button type="button" data-r>×</button>';
      s.querySelector("button").onclick = () => s.remove();
      b.insertBefore(s, i);
      i.value = "";
    });
  }
  function bind() {
    document.querySelectorAll("[data-tab]").forEach(
      (x) =>
        (x.onclick = () => {
          document.querySelectorAll("[data-tab]").forEach((y) => y.classList.remove("active"));
          document.querySelectorAll("[data-sec]").forEach((y) => y.classList.remove("active"));
          x.classList.add("active");
          document.querySelector('[data-sec="' + x.dataset.tab + '"]')?.classList.add("active");
          if (x.dataset.tab === "manage-projects") void loadAdminProjectManagement();
        }),
    );
    [
      "reportStatuses",
      "quarters",
      "projectStatuses",
      "extensionTypes",
      "supplyTypes",
      "supplierTypes",
    ].forEach(bindChip);
    const v = (id) => document.getElementById(id)?.value ?? "",
      c = (id) => !!document.getElementById(id)?.checked,
      arr = (id) =>
        [...document.querySelectorAll("#" + id + " .ichip")]
          .map((x) => x.firstChild?.textContent?.trim())
          .filter(Boolean);
    document.getElementById("settingsSave").onclick = async () => {
      const percentFields = ["omanization","sme","goodsMin","servicesMin","omaniSalary","foreignSalary","madeInOman","localSupplier","directImport","smePurchase","localService","foreignService","smeService","smeSubcontract","subcontractLocal","subcontractForeign"];
      for (const id of percentFields) {
        const n = Number(v(id));
        if (!Number.isFinite(n) || n < 0 || n > 100) return toastA("القيمة في " + id + " يجب أن تكون بين 0 و100.");
      }
      for (const id of ["dueDays","lateAfter","daysBefore"]) {
        const n = Number(v(id));
        if (!Number.isInteger(n) || n < 0 || n > 365) return toastA("يجب أن تكون مدة " + id + " عددًا صحيحًا بين 0 و365 يومًا.");
      }
      const years = v("reportYears").split(",").map((x) => x.trim()).filter(Boolean);
      if (!years.length || years.some((x) => !/^\d{4}$/.test(x)) || new Set(years).size !== years.length)
        return toastA("أدخل سنوات تقارير صحيحة من أربعة أرقام، من دون تكرار.");
      const quarters = arr("quarters");
      if (quarters.length !== 4 || ["Q1","Q2","Q3","Q4"].some((q) => !quarters.includes(q)))
        return toastA("يجب أن تكون الأرباع المعتمدة Q1 وQ2 وQ3 وQ4.");
      if (!arr("projectStatuses").length) return toastA("أضف حالة واحدة على الأقل للمشاريع.");
      if (!arr("reportStatuses").length) return toastA("أضف حالة واحدة على الأقل للتقارير.");
      S.general = {
        ...S.general,
        platformName: v("platformName"),
        owner: v("owner"),
        language: v("language"),
        currency: v("currency"),
        fiscalYear: v("fiscalYear"),
        timezone: v("timezone"),
        dateFormat: v("dateFormat"),
        logo: v("logo"),
        compact: c("compact"),
      };
      S.local = {
        ...S.local,
        omanization: +v("omanization"),
        sme: +v("sme"),
        goodsMin: +v("goodsMin"),
        servicesMin: +v("servicesMin"),
        omaniSalary: +v("omaniSalary"),
        foreignSalary: +v("foreignSalary"),
        madeInOman: +v("madeInOman"),
        localSupplier: +v("localSupplier"),
        directImport: +v("directImport"),
        smePurchase: +v("smePurchase"),
        localService: +v("localService"),
        foreignService: +v("foreignService"),
        smeService: +v("smeService"),
        smeSubcontract: +v("smeSubcontract"),
        subcontractLocal: +v("subcontractLocal"),
        subcontractForeign: +v("subcontractForeign"),
      };
      S.reports = {
        ...S.reports,
        years: v("reportYears"),
        type: v("reportType"),
        dueDays: +v("dueDays"),
        lateAfter: +v("lateAfter"),
        lockApproved: c("lockApproved"),
        multiReport: c("multiReport"),
        statuses: [...new Set([...arr("reportStatuses").map(String).filter(Boolean), "معتمد"])],
        quarters: arr("quarters"),
      };
      S.projects = {
        ...S.projects,
        statuses: arr("projectStatuses"),
        extensionTypes: arr("extensionTypes"),
        requiredValue: c("requiredValue"),
        requiredDates: c("requiredDates"),
        requiredEntity: c("requiredEntity"),
        requiredCompany: c("requiredCompany"),
      };
      const roleLabels = {};
      window.ICV.ROLE_ORDER.forEach((r) => {
        const x = v("roleLabel_" + r).trim();
        if (x && x !== window.ICV.DEFAULT_ROLE_LABELS[r]) roleLabels[r] = x;
      });
      S.users = { ...S.users, roleLabels, entityAccess: c("entityAccess") };
      S.notifications = {
        ...S.notifications,
        reportDue: c("reportDue"),
        projectExpiry: c("projectExpiry"),
        approval: c("approval"),
        delay: c("delay"),
        planUpdate: c("planUpdate"),
        daysBefore: +v("daysBefore"),
      };
      S.audit = { ...S.audit, retention: Math.max(30, +v("auditRetention") || 365) };
      S.refs = { ...S.refs, supplyTypes: arr("supplyTypes"), supplierTypes: arr("supplierTypes") };
      try {
        await persistSettings();
        document.getElementById("settingsSaved").textContent = new Date().toLocaleString("ar-OM");
        window.icvSaveSuccess?.("تم حفظ جميع إعدادات المنصة في قاعدة البيانات");
      } catch (e) {
        toastA("تعذر حفظ الإعدادات: " + window.ICV.friendlyError(e));
      }
    };
  }
  window.icvSettingsExport = function () {
    const a = document.createElement("a"),
      b = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
    a.href = URL.createObjectURL(b);
    a.download = "ICV-New-Settings.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  window.icvSettingsImport = function () {
    const i = document.createElement("input");
    i.type = "file";
    i.accept = ".json,application/json";
    i.onchange = async () => {
      try {
        S = normalize(JSON.parse(await i.files[0].text()));
        await persistSettings();
        render();
        window.icvSaveSuccess?.("تم استيراد الإعدادات وحفظها في قاعدة البيانات");
      } catch (e) {
        toastA("ملف الإعدادات غير صالح.");
      }
    };
    i.click();
  };
  window.icvSettingsReset = function () {
    if (!confirm("هل تريد إعادة جميع إعدادات المنصة للقيم الافتراضية؟")) return;
    S = normalize({});
    persistSettings()
      .then(() => {
        render();
        window.icvSaveSuccess("تمت إعادة الإعدادات الافتراضية وحفظها في قاعدة البيانات");
      })
      .catch((e) => toastA("تعذر الحفظ: " + e.message));
  };
  window.icvStructure = window.icvStructure || {};
  window.icvStructure.renderSettings = render;
  window.icvSettingsPage = render;
  window.icvPublishCalcSettings = publishCalcSettings;
  window.icvLoadPlatformSettings = syncFromDatabase;
  const oldShow = window.showPage;
  if (oldShow && !window.__settingsPatch) {
    window.__settingsPatch = true;
    window.showPage = function (n, b) {
      if (n === "settings") {
        document.querySelectorAll('[id^="page-"]').forEach((x) => x.classList.add("hidden"));
        document.getElementById("page-settings")?.classList.remove("hidden");
        document.querySelectorAll(".nav button").forEach((x) => x.classList.remove("active"));
        b?.classList.add("active");
        if (window.pageTitle) pageTitle.textContent = "الإعدادات";
        return render();
      }
      return oldShow.apply(this, arguments);
    };
  }
  render();
})();
