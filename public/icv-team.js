/* Audit log page, section head team view and in-platform notifications. */
(function () {
  "use strict";
  const ICV = window.ICV;
  const esc = ICV.escapeHtml;
  const db = () => window.__icvAccessClient;
  const me = () => window.__icvProfile || {};
  const isAdmin = () => me().role === "admin";
  const isHead = () => me().role === "section_head";

  // ---------------------------------------------------------------------------
  // Readable audit events
  // ---------------------------------------------------------------------------
  const TABLES = {
    projects: "مشروع",
    quarterly_reports: "تقرير ربع سنوي",
    local_content_plans: "خطة محتوى محلي",
    companies: "شركة",
    government_entities: "جهة حكومية",
    employee_followups: "ملاحظة / مهمة",
    user_profiles: "حساب مستخدم",
    user_entity_assignments: "إسناد جهة",
    platform_settings: "إعدادات المنصة",
    project_plan_documents: "مستند خطة",
    project_end_date_history: "تمديد مشروع",
    project_baselines: "خط أساس مشروع",
  };
  const VERBS = { INSERT: "أضاف", UPDATE: "عدّل", DELETE: "حذف" };
  const FIELDS = {
    project_name: "اسم المشروع",
    government_entity_id: "الجهة الحكومية",
    implementing_company_id: "الشركة المنفذة",
    tender_type: "رقم المناقصة",
    project_status: "حالة المشروع",
    consultant: "الاستشاري",
    work_sector: "القطاع",
    total_project_value: "قيمة المشروع",
    start_date: "تاريخ البدء",
    end_date: "تاريخ الانتهاء",
    local_content_plan: "خطة المحتوى المحلي",
    progress_pct: "نسبة الإنجاز",
    notes: "الملاحظات",
    serial_no: "الرقم التسلسلي",
    quarter: "الربع",
    annual_period: "السنة",
    status: "الحالة",
    report_data: "بيانات التقرير",
    plan_data: "بيانات الخطة",
    name: "الاسم",
    company_type: "نوع الشركة",
    code: "الرمز",
    contact_points: "نقاط التواصل",
    full_name: "الاسم",
    username: "اسم المستخدم",
    role: "الدور",
    is_active: "الحساب نشط",
    access_starts_at: "بداية الصلاحية",
    access_expires_at: "نهاية الصلاحية",
    category: "العنوان",
    action_required: "التفاصيل",
    priority: "الأولوية",
    due_date: "تاريخ الاستحقاق",
    assigned_to: "مسندة إلى",
    resolution_note: "ملاحظة الإغلاق",
    settings: "الإعدادات",
    display_name: "اسم العرض",
    version: "الإصدار",
    source_file: "الملف المصدر",
    // report_data keys
    "report_data.report_type": "نوع التقرير",
    "report_data.omani_total": "عدد العمانيين",
    "report_data.foreign_total": "عدد الأجانب",
    "report_data.workforce_total": "إجمالي العمالة",
    "report_data.omani_salary": "رواتب العمانيين",
    "report_data.foreign_salary": "رواتب الأجانب",
    "report_data.purchases": "المشتريات",
    "report_data.services": "الخدمات",
    "report_data.subcontracts": "عقود الباطن",
    "report_data.attachment_name": "المرفق",
    "report_data.notes": "ملاحظات التقرير",
    "report_data.workforce_categories": "الفئات الوظيفية",
    "settings.local": "قواعد المحتوى المحلي",
    "settings.reports": "إعدادات التقارير",
    "settings.users": "إعدادات المستخدمين",
    "settings.general": "الإعدادات العامة",
    "settings.notifications": "إعدادات الإشعارات",
    "settings.audit": "إعدادات السجل",
    "settings.projects": "إعدادات المشاريع",
    "settings.refs": "البيانات المرجعية",
  };
  const IGNORE = new Set([
    "id",
    "created_at",
    "updated_at",
    "created_by",
    "metrics_updated_at",
    "report_data.last_modified_at",
    "report_data.total_local_content",
    "report_data.omanization_percent",
    "plan_data.last_updated_at",
  ]);
  const STATUS_WORDS = { open: "مفتوحة", closed: "مغلقة" };
  // Inner keys of settings sections and report groups.
  const LEAF_LABELS = {
    omanization: "حد التعمين %",
    "local.sme": "حد المؤسسات الصغيرة والمتوسطة %",
    "subcontracts.sme": "مؤسسة صغيرة ومتوسطة",
    goodsMin: "حد السلع %",
    servicesMin: "حد الخدمات %",
    omaniSalary: "معامل رواتب العمانيين",
    foreignSalary: "معامل رواتب الأجانب",
    madeInOman: "معامل صنع في عمان",
    localSupplier: "معامل المورد المحلي",
    directImport: "معامل الاستيراد المباشر",
    smePurchase: "معامل مشتريات SME",
    localService: "معامل الخدمات المحلية",
    foreignService: "معامل الخدمات الأجنبية",
    smeService: "معامل خدمات SME",
    smeSubcontract: "معامل عقود باطن SME",
    subcontractLocal: "معامل عقود الباطن المحلية",
    subcontractForeign: "معامل عقود الباطن الأجنبية",
    lockApproved: "قفل التقارير المعتمدة",
    dueDays: "مدة التسليم (أيام)",
    lateAfter: "متأخر بعد (أيام)",
    retention: "مدة الاحتفاظ بالسجل (يوم)",
    roleLabels: "أسماء الأدوار",
    entityAccess: "عرض الجهات المسندة افتراضيًا",
    daysBefore: "التنبيه قبل (أيام)",
    platformName: "اسم المنصة",
    owner: "الجهة المالكة",
    made_in_oman: "صنع في عمان",
    local_supplier: "مورد محلي",
    direct_import: "استيراد مباشر",
    sme_purchase: "مشتريات SME",
    local_service: "مزود محلي",
    foreign_service: "مزود أجنبي",
    sme_service: "مزود SME",
    local: "محلي",
    foreign: "أجنبي",
  };

  function fmtValue(v, key, ctx) {
    if (v === null || v === undefined || v === "") return "فارغ";
    if (typeof v === "boolean") return v ? "نعم" : "لا";
    if (key === "role") return ICV.roleLabel(v);
    if (key === "status" && STATUS_WORDS[v]) return STATUS_WORDS[v];
    if (key === "government_entity_id") return ctx.entities[v] || "جهة";
    if (key === "implementing_company_id") return ctx.companies[v] || "شركة";
    if (key === "assigned_to") return ctx.users[v]?.name || "مستخدم";
    if (typeof v === "number") return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return ICV.formatDate(v);
    if (Array.isArray(v)) return v.length + " عنصر";
    if (typeof v === "object") return "…";
    const s = String(v);
    return s.length > 60 ? s.slice(0, 60) + "…" : s;
  }

  // Lists changed fields, going one level into JSON columns (report data, settings).
  function changes(oldRow, newRow, table) {
    const out = [];
    const skip = (k) => IGNORE.has(k) || (table === "projects" && !FIELDS[k] && !k.includes("."));
    const keys = new Set([...Object.keys(oldRow || {}), ...Object.keys(newRow || {})]);
    keys.forEach((k) => {
      if (skip(k)) return;
      const a = oldRow?.[k],
        b = newRow?.[k];
      if (JSON.stringify(a) === JSON.stringify(b)) return;
      const nested = a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a);
      if (nested && ["report_data", "settings"].includes(k)) {
        new Set([...Object.keys(a), ...Object.keys(b)]).forEach((sub) => {
          const kk = k + "." + sub;
          if (IGNORE.has(kk) || JSON.stringify(a[sub]) === JSON.stringify(b[sub])) return;
          const x = a[sub],
            y = b[sub];
          // Settings sections and report groups (purchases, services…) go one level deeper.
          if (x && y && typeof x === "object" && typeof y === "object" && !Array.isArray(x)) {
            new Set([...Object.keys(x), ...Object.keys(y)]).forEach((leaf) => {
              if (JSON.stringify(x[leaf]) === JSON.stringify(y[leaf])) return;
              out.push({
                key: kk + "." + leaf,
                field: leaf,
                label:
                  (FIELDS[kk] || sub) + " › " + (LEAF_LABELS[sub + "." + leaf] || LEAF_LABELS[leaf] || leaf),
                from: x[leaf],
                to: y[leaf],
              });
            });
          } else out.push({ key: kk, field: sub, label: FIELDS[kk] || sub, from: x, to: y });
        });
      } else {
        out.push({ key: k, field: k, label: FIELDS[k] || k, from: a, to: b });
      }
    });
    return out;
  }

  function recordName(row, table, ctx) {
    const d = row || {};
    if (table === "quarterly_reports")
      return (
        (ctx.projects[d.project_id] || "مشروع") +
        " — " +
        [d.quarter, d.annual_period].filter(Boolean).join(" ")
      );
    if (
      table === "local_content_plans" ||
      table === "project_plan_documents" ||
      table === "project_end_date_history"
    )
      return ctx.projects[d.project_id] || d.display_name || "مشروع";
    if (table === "user_entity_assignments")
      return (
        (ctx.users[d.user_id]?.name || "مستخدم") + " ← " + (ctx.entities[d.government_entity_id] || "جهة")
      );
    if (table === "employee_followups") return d.category || d.action_required || "ملاحظة";
    if (table === "platform_settings") return "الإعدادات العامة";
    return d.project_name || d.name || d.full_name || d.username || "";
  }

  // One audit row -> { who, role, sentence, details[] }.
  function describe(row, ctx) {
    const u = ctx.users[row.actor_user_id];
    const who = u?.name || (row.actor_user_id ? "مستخدم" : "النظام");
    const subject = row.new_data || row.old_data || {};
    const verb = VERBS[row.operation] || row.operation;
    const what = TABLES[row.table_name] || row.table_name;
    const name = recordName(subject, row.table_name, ctx);
    const list = row.operation === "UPDATE" ? changes(row.old_data, row.new_data, row.table_name) : [];
    return {
      who,
      role: u ? ICV.roleLabel(u.role) : "",
      sentence: verb + " " + what + (name ? " «" + name + "»" : ""),
      details: list.map(
        (c) => c.label + ": " + fmtValue(c.from, c.field, ctx) + " ← " + fmtValue(c.to, c.field, ctx),
      ),
    };
  }

  async function auditContext() {
    const c = db();
    const [u, e, co, p] = await Promise.all([
      c.from("user_profiles").select("id,full_name,username,role"),
      c.from("government_entities").select("id,name"),
      c.from("companies").select("id,name"),
      c.from("projects").select("id,project_name"),
    ]);
    const ctx = { users: {}, entities: {}, companies: {}, projects: {} };
    (u.data || []).forEach(
      (x) => (ctx.users[x.id] = { name: x.full_name || x.username || "مستخدم", role: x.role }),
    );
    (e.data || []).forEach((x) => (ctx.entities[x.id] = x.name));
    (co.data || []).forEach((x) => (ctx.companies[x.id] = x.name));
    (p.data || []).forEach((x) => (ctx.projects[x.id] = x.project_name));
    return ctx;
  }

  function eventHtml(ev, row) {
    return (
      '<div class="icv-ev"><div class="icv-ev-main"><b>' +
      esc(ev.who) +
      "</b>" +
      (ev.role ? ' <span class="icv-ev-role">' + esc(ev.role) + "</span>" : "") +
      " " +
      esc(ev.sentence) +
      (ev.details.length
        ? '<ul class="icv-ev-changes">' +
          ev.details
            .slice(0, 8)
            .map((d) => "<li>" + esc(d) + "</li>")
            .join("") +
          (ev.details.length > 8 ? "<li>و " + (ev.details.length - 8) + " تغييرات أخرى</li>" : "") +
          "</ul>"
        : "") +
      '</div><time class="icv-ev-time">' +
      esc(new Date(row.changed_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })) +
      "</time></div>"
    );
  }

  // ---------------------------------------------------------------------------
  // Audit page
  // ---------------------------------------------------------------------------
  let auditRows = [],
    auditCtx = null;

  async function renderAuditPage() {
    const root = document.getElementById("page-audit");
    if (!root) return;
    if (!isAdmin() && !isHead()) {
      root.innerHTML =
        '<div class="panel"><p class="muted">سجل التدقيق متاح لمدير النظام ورئيس القسم.</p></div>';
      return;
    }
    const today = new Date(),
      from = new Date(today.getTime() - 30 * 86400000);
    const day = (d) => d.toISOString().slice(0, 10);
    root.innerHTML =
      '<div class="panel"><div class="toolbar"><div><h2>سجل التدقيق</h2><div class="muted">' +
      (isHead() ? "نشاط أخصائيي الدعم والمتابعة." : "كل العمليات على بيانات المنصة.") +
      ' السجل مفعّل دائمًا.</div></div><button class="btn" id="auditExcel">تصدير Excel</button></div>' +
      '<div class="icv-audit-filters"><div class="field"><label>من</label><input type="date" id="auditFrom" value="' +
      day(from) +
      '"></div><div class="field"><label>إلى</label><input type="date" id="auditTo" value="' +
      day(today) +
      '"></div><div class="field"><label>المستخدم</label><select id="auditUser"><option value="">الكل</option></select></div>' +
      '<div class="field"><label>نوع السجل</label><select id="auditTable"><option value="">الكل</option>' +
      Object.entries(TABLES)
        .map(([k, v]) => '<option value="' + k + '">' + esc(v) + "</option>")
        .join("") +
      '</select></div><div class="field"><label>العملية</label><select id="auditOp"><option value="">الكل</option><option value="INSERT">إضافة</option><option value="UPDATE">تعديل</option><option value="DELETE">حذف</option></select></div>' +
      '<div class="field"><label>بحث</label><input id="auditSearch" placeholder="اسم مشروع، جهة، حقل..."></div></div>' +
      '<div id="auditCount" class="muted" aria-live="polite">جاري التحميل...</div><div id="auditList" class="icv-ev-list"></div></div>';
    auditCtx = await auditContext();
    const userSel = document.getElementById("auditUser");
    Object.entries(auditCtx.users)
      .sort((a, b) => a[1].name.localeCompare(b[1].name, "ar"))
      .forEach(([id, u]) => {
        if (isHead() && u.role !== "editor") return;
        const o = document.createElement("option");
        o.value = id;
        o.textContent = u.name + " — " + ICV.roleLabel(u.role);
        userSel.appendChild(o);
      });
    ["auditFrom", "auditTo", "auditUser", "auditTable", "auditOp"].forEach(
      (id) => (document.getElementById(id).onchange = loadAudit),
    );
    document.getElementById("auditSearch").oninput = drawAudit;
    document.getElementById("auditExcel").onclick = exportAudit;
    await loadAudit();
  }

  async function loadAudit() {
    const v = (id) => document.getElementById(id)?.value || "";
    let q = db().from("audit_log").select("*").order("changed_at", { ascending: false }).limit(1000);
    if (v("auditFrom")) q = q.gte("changed_at", v("auditFrom") + "T00:00:00+04:00");
    if (v("auditTo")) q = q.lte("changed_at", v("auditTo") + "T23:59:59+04:00");
    if (v("auditUser")) q = q.eq("actor_user_id", v("auditUser"));
    if (v("auditTable")) q = q.eq("table_name", v("auditTable"));
    if (v("auditOp")) q = q.eq("operation", v("auditOp"));
    const r = await q;
    if (r.error) {
      document.getElementById("auditCount").textContent = ICV.friendlyError(r.error);
      return;
    }
    auditRows = (r.data || []).map((row) => ({ row, ev: describe(row, auditCtx) }));
    drawAudit();
  }

  function drawAudit() {
    const s = (document.getElementById("auditSearch")?.value || "").trim();
    const list = auditRows.filter(
      (x) => !s || (x.ev.who + " " + x.ev.sentence + " " + x.ev.details.join(" ")).includes(s),
    );
    document.getElementById("auditCount").textContent =
      list.length + " حدث" + (auditRows.length >= 1000 ? " (أحدث 1000 حدث؛ ضيّق الفترة لرؤية الأقدم)" : "");
    document.getElementById("auditList").innerHTML = list.length
      ? list.map((x) => eventHtml(x.ev, x.row)).join("")
      : '<div class="muted" style="padding:16px">لا توجد أحداث ضمن هذه الفلاتر.</div>';
  }

  function exportAudit() {
    if (typeof XLSX === "undefined") return ICV.showMessage("مكتبة Excel غير متاحة.", "error");
    const rows = [["التاريخ والوقت", "المستخدم", "الدور", "الحدث", "التغييرات"]].concat(
      auditRows.map((x) => [
        new Date(x.row.changed_at).toLocaleString("en-GB"),
        x.ev.who,
        x.ev.role,
        x.ev.sentence,
        x.ev.details.join("\n"),
      ]),
    );
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 20 }, { wch: 24 }, { wch: 20 }, { wch: 60 }, { wch: 80 }];
    ws["!sheetViews"] = [{ rightToLeft: true }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "سجل التدقيق");
    XLSX.writeFile(wb, "ICV - سجل التدقيق - " + new Date().toISOString().slice(0, 10) + ".xlsx");
  }

  // ---------------------------------------------------------------------------
  // Section head: team view inside «ملفي الشخصي»
  // ---------------------------------------------------------------------------
  const SECTION_NAME = "قسم الدعم والمتابعة";
  const quarterNo = (q) => Number(String(q || "").replace(/\D/g, "")) || 0;

  function lastFinishedQuarter(now = new Date()) {
    const cur = Math.floor(now.getMonth() / 3) + 1;
    return cur === 1 ? { y: now.getFullYear() - 1, q: 4 } : { y: now.getFullYear(), q: cur - 1 };
  }

  async function renderHeadPanel() {
    if (!isHead()) return;
    const page = document.getElementById("page-profile");
    const anchor = page?.querySelector("#accessProfileSummary");
    if (!page || !anchor) return;
    let box = document.getElementById("headTeamPanel");
    if (!box) {
      box = document.createElement("section");
      box.id = "headTeamPanel";
      box.className = "icv-head-panel";
      anchor.parentElement.insertBefore(box, anchor);
    }
    box.innerHTML = '<div class="profile-empty">جاري تحميل بيانات الفريق...</div>';
    const c = db();
    const [pr, asg, ent, prj, rep, fu, au] = await Promise.all([
      c
        .from("user_profiles")
        .select("id,full_name,username,role,is_active,access_starts_at,access_expires_at"),
      c.from("user_entity_assignments_view").select("user_id,government_entity_id,government_entity"),
      c.from("government_entities").select("id,name"),
      c
        .from("projects")
        .select(
          "id,project_name,government_entity_id,project_status,start_date,end_date,compliance_status,omanization_status,sme_10_status,made_in_oman_status,services_status",
        ),
      c.from("quarterly_reports").select("project_id,quarter,annual_period,status"),
      c
        .from("employee_followups")
        .select("id,project_id,category,action_required,assigned_to,created_at,status,priority"),
      c.from("audit_log").select("*").order("changed_at", { ascending: false }).limit(15),
    ]);
    const err = [pr, asg, ent, prj, rep, fu].find((x) => x.error);
    if (err) {
      box.innerHTML = '<div class="bad">' + esc(ICV.friendlyError(err.error)) + "</div>";
      return;
    }
    const team = (pr.data || []).filter((u) => u.role === "editor");
    const entName = {};
    (ent.data || []).forEach((e) => (entName[e.id] = e.name));
    const byUser = {},
      byEntity = {};
    (asg.data || []).forEach((a) => {
      (byUser[a.user_id] = byUser[a.user_id] || []).push(a.government_entity_id);
      (byEntity[a.government_entity_id] = byEntity[a.government_entity_id] || []).push(a.user_id);
    });
    const projects = prj.data || [];
    const teamIds = new Set(team.map((u) => u.id));
    const nameOf = (id) => {
      const u = (pr.data || []).find((x) => x.id === id);
      return u ? u.full_name || u.username : "—";
    };
    const specialistsFor = (entityId) =>
      (byEntity[entityId] || []).filter((id) => teamIds.has(id)).map(nameOf);
    const open = (fu.data || []).filter((f) => f.status !== "closed");

    // 2. Reports for the last finished quarter, with the responsible specialist
    const lq = lastFinishedQuarter();
    const got = new Set(
      (rep.data || []).map((r) => r.project_id + "|" + Number(r.annual_period) + "|" + quarterNo(r.quarter)),
    );
    const qStart = new Date(lq.y, (lq.q - 1) * 3, 1),
      qEnd = new Date(lq.y, lq.q * 3, 0);
    const due = projects.filter(
      (p) =>
        p.start_date && new Date(p.start_date) <= qEnd && (!p.end_date || new Date(p.end_date) >= qStart),
    );
    const missing = due.filter((p) => !got.has(p.id + "|" + lq.y + "|" + lq.q));

    // 3. Entities with projects but no specialist
    const entitiesWithProjects = [...new Set(projects.map((p) => p.government_entity_id).filter(Boolean))];
    const unfollowed = entitiesWithProjects.filter((id) => !specialistsFor(id).length);

    // 5. Section compliance
    const count = (s) => projects.filter((p) => (p.compliance_status || "غير منطبق") === s).length;

    const card = (title, sub, body) =>
      '<section class="profile-card full"><div class="profile-card-head"><h3>' +
      title +
      '</h3><span class="profile-muted">' +
      sub +
      "</span></div>" +
      body +
      "</section>";
    const daysAgo = (d) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000));

    const teamRows = team
      .map((u) => {
        const ents = byUser[u.id] || [];
        const pc = projects.filter((p) => ents.includes(p.government_entity_id)).length;
        const tasks = open.filter((f) => f.assigned_to === u.id).length;
        const problem = ICV.accessProblem(u);
        return (
          "<tr><td><b>" +
          esc(u.full_name || u.username) +
          "</b><small>" +
          esc(u.username || "") +
          "</small></td><td>" +
          ents.length +
          "</td><td>" +
          pc +
          "</td><td>" +
          tasks +
          '</td><td><span class="profile-status ' +
          (problem ? "red" : "green") +
          '">' +
          (problem ? "غير نشط" : "نشط") +
          '</span></td><td><div class="icv-head-actions"><button class="profile-open" data-head-entities="' +
          esc(u.id) +
          '" data-name="' +
          esc(u.full_name || u.username) +
          '">الجهات</button><button class="profile-open" data-head-task="' +
          esc(u.id) +
          '" data-name="' +
          esc(u.full_name || u.username) +
          '">مهمة</button><button class="profile-open" data-head-profile="' +
          esc(u.id) +
          '">الملف</button></div></td></tr>'
        );
      })
      .join("");

    let activity = "";
    if (!au.error) {
      const ctx = await auditContext();
      activity = (au.data || []).map((row) => eventHtml(describe(row, ctx), row)).join("");
    }

    box.innerHTML =
      '<div class="icv-head-title"><div><h2>' +
      SECTION_NAME +
      "</h2><p>لوحة رئيس القسم: الفريق، التقارير، الأحمال، الملاحظات المفتوحة، الالتزام، ونشاط الفريق.</p></div></div>" +
      '<div class="profile-grid">' +
      // 1 + 6. team (read-only profile from the «الملف» button)
      card(
        "👥 الفريق",
        team.length + " أخصائي",
        '<div class="profile-table-wrap"><table class="profile-table"><thead><tr><th>الأخصائي</th><th>الجهات</th><th>المشاريع</th><th>مهام مفتوحة</th><th>الحساب</th><th>إجراءات</th></tr></thead><tbody>' +
          (teamRows || '<tr><td colspan="6" class="profile-empty">لا يوجد أخصائيون.</td></tr>') +
          "</tbody></table></div>",
      ) +
      // 2. reports with responsible specialist
      card(
        "📋 تقارير Q" + lq.q + " " + lq.y,
        missing.length + " غير مستلم من " + due.length,
        missing.length
          ? missing
              .map(
                (p) =>
                  '<div class="profile-row"><div class="profile-icon">!</div><div class="profile-row-main"><strong>' +
                  esc(p.project_name) +
                  "</strong><span>" +
                  esc(entName[p.government_entity_id] || "—") +
                  " · المسؤول: " +
                  esc(specialistsFor(p.government_entity_id).join("، ") || "غير مُسند") +
                  '</span></div><button class="profile-open" data-open-project="' +
                  esc(p.id) +
                  '">فتح ←</button></div>',
              )
              .join("")
          : '<div class="profile-empty">كل التقارير المستحقة لهذا الربع مستلمة.</div>',
      ) +
      // 3. workload and unfollowed entities
      card(
        "⚖️ الأحمال والجهات غير المتابَعة",
        unfollowed.length + " جهة بلا أخصائي",
        '<div class="icv-head-bars">' +
          team
            .map((u) => {
              const n = (byUser[u.id] || []).length,
                max = Math.max(1, ...team.map((x) => (byUser[x.id] || []).length));
              return (
                "<div><span>" +
                esc(u.full_name || u.username) +
                '</span><i><b style="width:' +
                Math.round((n / max) * 100) +
                '%"></b></i><em>' +
                n +
                " جهة</em></div>"
              );
            })
            .join("") +
          "</div>" +
          (unfollowed.length
            ? '<div class="icv-head-chips">' +
              unfollowed.map((id) => "<span>" + esc(entName[id] || "—") + "</span>").join("") +
              "</div>"
            : '<div class="profile-empty">كل الجهات التي لديها مشاريع لها أخصائي.</div>'),
      ) +
      // 4. open notes and their age
      card(
        "📝 الملاحظات والمهام المفتوحة",
        open.length + " مفتوحة",
        open.length
          ? open
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
              .slice(0, 12)
              .map(
                (f) =>
                  '<div class="profile-row"><div class="profile-icon ' +
                  (daysAgo(f.created_at) > 30 ? "" : "orange") +
                  '">' +
                  daysAgo(f.created_at) +
                  'ي</div><div class="profile-row-main"><strong>' +
                  esc(f.category || f.action_required || "ملاحظة") +
                  "</strong><span>" +
                  esc(
                    (projects.find((p) => p.id === f.project_id)?.project_name || "مهمة") +
                      " · " +
                      (f.assigned_to ? nameOf(f.assigned_to) : "غير مُسندة") +
                      " · " +
                      (f.priority || ""),
                  ) +
                  "</span></div>" +
                  (f.project_id
                    ? '<button class="profile-open" data-open-project="' +
                      esc(f.project_id) +
                      '">فتح ←</button>'
                    : "") +
                  "</div>",
              )
              .join("")
          : '<div class="profile-empty">لا توجد ملاحظات مفتوحة.</div>',
      ) +
      // 5. section compliance
      card(
        "📊 التزام القسم",
        projects.length + " مشروع",
        '<div class="icv-head-kpis"><div class="ok"><b>' +
          count("مستوفي") +
          '</b><span>مستوفي</span></div><div class="bad"><b>' +
          count("غير مستوفي") +
          "</b><span>غير مستوفي</span></div><div><b>" +
          count("غير منطبق") +
          "</b><span>بلا تقارير معتمدة</span></div></div>",
      ) +
      // 7. team activity
      card(
        "🕐 نشاط الفريق",
        "آخر 15 حدثًا",
        '<div class="icv-ev-list">' +
          (activity || '<div class="profile-empty">لا يوجد نشاط مسجل.</div>') +
          "</div>",
      ) +
      "</div>";

    box
      .querySelectorAll("[data-open-project]")
      .forEach((b) => (b.onclick = () => window.openMyProject?.(b.dataset.openProject)));
    box
      .querySelectorAll("[data-head-profile]")
      .forEach((b) => (b.onclick = () => window.openUserProfile?.(b.dataset.headProfile)));
    box
      .querySelectorAll("[data-head-entities]")
      .forEach(
        (b) => (b.onclick = () => window.openEntityAssignment?.(b.dataset.headEntities, b.dataset.name)),
      );
    box
      .querySelectorAll("[data-head-task]")
      .forEach((b) => (b.onclick = () => openAssignTask(b.dataset.headTask, b.dataset.name, projects)));
  }

  function openAssignTask(userId, name, projects) {
    document.getElementById("headTaskModal")?.remove();
    const d = document.createElement("div");
    d.id = "headTaskModal";
    d.className = "modal";
    d.innerHTML =
      '<div class="modal-card"><div class="modal-head"><div><h2>إسناد مهمة</h2><div class="muted">إلى: ' +
      esc(name) +
      '</div></div><button class="close" data-close>×</button></div><div class="form-grid"><div class="field full"><label>المهمة</label><input id="htTitle" maxlength="160"></div><div class="field full"><label>التفاصيل</label><textarea id="htBody" rows="3"></textarea></div><div class="field"><label>المشروع (اختياري)</label><select id="htProject"><option value="">بدون مشروع</option>' +
      projects.map((p) => '<option value="' + esc(p.id) + '">' + esc(p.project_name) + "</option>").join("") +
      '</select></div><div class="field"><label>تاريخ الاستحقاق</label><input id="htDue" type="date"></div><div class="field"><label>الأولوية</label><select id="htPriority"><option>متوسطة</option><option>منخفضة</option><option>عالية</option><option>عاجلة</option></select></div></div><div id="htMsg"></div><div class="modal-foot"><button class="btn primary" id="htSave">إسناد المهمة</button><button class="btn" data-close>إلغاء</button></div></div>';
    document.body.appendChild(d);
    d.querySelectorAll("[data-close]").forEach((b) => (b.onclick = () => d.remove()));
    document.getElementById("htSave").onclick = async () => {
      const title = document.getElementById("htTitle").value.trim();
      if (!title)
        return (document.getElementById("htMsg").innerHTML = '<div class="bad">اكتب عنوان المهمة.</div>');
      const btn = document.getElementById("htSave");
      btn.disabled = true;
      const r = await db()
        .from("employee_followups")
        .insert({
          assigned_to: userId,
          created_by: me().id,
          employee_name: name,
          category: title,
          action_required: document.getElementById("htBody").value.trim() || title,
          project_id: document.getElementById("htProject").value || null,
          due_date: document.getElementById("htDue").value || null,
          priority: document.getElementById("htPriority").value,
          status: "open",
        });
      if (r.error) {
        btn.disabled = false;
        document.getElementById("htMsg").innerHTML =
          '<div class="bad">' + esc(ICV.friendlyError(r.error)) + "</div>";
        return;
      }
      d.remove();
      window.icvSaveSuccess("تم إسناد المهمة إلى " + name);
      renderHeadPanel();
    };
  }

  // ---------------------------------------------------------------------------
  // Notifications bell (filled daily by the database; works once the table exists)
  // ---------------------------------------------------------------------------
  async function setupBell() {
    if (!ICV.canEdit(me()) || document.getElementById("icvBell")) return;
    const r = await db()
      .from("notifications")
      .select("id,kind,title,body,project_id,created_at,read_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (r.error) return; // table not created yet
    const host = document.getElementById("userName")?.parentElement;
    if (!host) return;
    const wrap = document.createElement("span");
    wrap.className = "icv-bell-wrap";
    wrap.innerHTML =
      '<button type="button" id="icvBell" class="icv-bell" aria-label="الإشعارات" aria-expanded="false">🔔<b id="icvBellCount" hidden></b></button><div id="icvBellList" class="icv-bell-list" hidden></div>';
    host.prepend(wrap);
    let items = r.data || [];
    const draw = () => {
      const unread = items.filter((x) => !x.read_at).length;
      const cnt = document.getElementById("icvBellCount");
      cnt.hidden = !unread;
      cnt.textContent = unread > 9 ? "9+" : unread;
      document.getElementById("icvBellList").innerHTML =
        '<div class="icv-bell-head"><b>الإشعارات</b>' +
        (unread ? '<button type="button" id="icvBellAll">تحديد الكل كمقروء</button>' : "") +
        "</div>" +
        (items.length
          ? items
              .map(
                (n) =>
                  '<button type="button" class="icv-bell-item' +
                  (n.read_at ? "" : " unread") +
                  '" data-n="' +
                  esc(n.id) +
                  '"><b>' +
                  esc(n.title) +
                  "</b><span>" +
                  esc(n.body || "") +
                  "</span><small>" +
                  esc(ICV.formatDate(n.created_at)) +
                  "</small></button>",
              )
              .join("")
          : '<div class="icv-bell-empty">لا توجد إشعارات.</div>');
      document.querySelectorAll("#icvBellList [data-n]").forEach(
        (b) =>
          (b.onclick = async () => {
            const n = items.find((x) => x.id === b.dataset.n);
            if (n && !n.read_at) {
              n.read_at = new Date().toISOString();
              await db().from("notifications").update({ read_at: n.read_at }).eq("id", n.id);
            }
            document.getElementById("icvBellList").hidden = true;
            if (n?.project_id) window.openMyProject?.(n.project_id);
            draw();
          }),
      );
      const all = document.getElementById("icvBellAll");
      if (all)
        all.onclick = async () => {
          const ids = items.filter((x) => !x.read_at).map((x) => x.id);
          const now = new Date().toISOString();
          await db().from("notifications").update({ read_at: now }).in("id", ids);
          items.forEach((x) => (x.read_at = x.read_at || now));
          draw();
        };
    };
    draw();
    document.getElementById("icvBell").onclick = (e) => {
      e.stopPropagation();
      const list = document.getElementById("icvBellList");
      list.hidden = !list.hidden;
      e.currentTarget.setAttribute("aria-expanded", String(!list.hidden));
    };
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".icv-bell-wrap")) document.getElementById("icvBellList").hidden = true;
    });
  }

  // ---------------------------------------------------------------------------
  // Wiring
  // ---------------------------------------------------------------------------
  function ensureNav() {
    const nav = document.querySelector(".nav");
    if (!nav || document.getElementById("auditNav")) return;
    const b = document.createElement("button");
    b.id = "auditNav";
    b.dataset.page = "audit";
    b.className = "hidden";
    b.onclick = function () {
      window.showPage("audit", this);
    };
    b.innerHTML = '<span class="ico">☰</span><span>سجل التدقيق</span>';
    nav.appendChild(b);
  }
  function applyRole() {
    ensureNav();
    document.getElementById("auditNav")?.classList.toggle("hidden", !(isAdmin() || isHead()));
    setupBell().catch(() => {});
  }

  window.icvPages = window.icvPages || {};
  window.icvPages.audit = renderAuditPage;
  window.ICVAudit = { describe, auditContext };
  window.icvRenderHeadPanel = renderHeadPanel;

  // Runs after the profile page renders (loadProfilePage is defined in ptlc-access.js).
  const wrapProfile = () => {
    const orig = window.loadProfilePage;
    if (typeof orig !== "function" || orig.__headWrapped) return;
    const wrapped = async function () {
      const r = await orig.apply(this, arguments);
      await renderHeadPanel();
      return r;
    };
    wrapped.__headWrapped = true;
    window.loadProfilePage = wrapped;
  };
  wrapProfile();

  const style = document.createElement("style");
  style.textContent =
    ".icv-audit-filters{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin:14px 0}" +
    ".icv-ev-list{display:grid;gap:8px}.icv-ev{display:flex;justify-content:space-between;gap:12px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;background:#fff;font-size:13px;line-height:1.8}" +
    ".icv-ev-main{min-width:0}.icv-ev-role{display:inline-block;padding:1px 8px;border-radius:99px;background:var(--soft);color:var(--primary2);font-size:11px;font-weight:700}" +
    ".icv-ev-changes{margin:6px 0 0;padding:0 18px 0 0;color:var(--muted);font-size:12px}.icv-ev-time{color:var(--muted);font-size:11px;white-space:nowrap}" +
    ".icv-head-panel{margin:0 0 18px}.icv-head-title h2{margin:0 0 4px;font-size:18px}.icv-head-title p{margin:0 0 12px;color:var(--muted);font-size:12px}" +
    ".icv-head-panel .profile-table td small{display:block;color:var(--muted);font-size:11px}.icv-head-actions{display:flex;gap:8px;flex-wrap:wrap}" +
    ".icv-head-bars{display:grid;gap:8px;padding:14px 18px}.icv-head-bars>div{display:grid;grid-template-columns:150px 1fr 60px;gap:10px;align-items:center;font-size:12px}" +
    ".icv-head-bars i{height:8px;background:#edf1f5;border-radius:99px;overflow:hidden}.icv-head-bars b{display:block;height:100%;background:var(--primary)}" +
    ".icv-head-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 18px 16px}.icv-head-chips span{padding:5px 10px;border-radius:99px;background:#fff6e8;color:#a96508;font-size:12px}" +
    ".icv-head-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:16px 18px}.icv-head-kpis div{border:1px solid var(--line);border-radius:12px;padding:12px;text-align:center}" +
    ".icv-head-kpis b{display:block;font-size:24px}.icv-head-kpis .ok b{color:#16a34a}.icv-head-kpis .bad b{color:#dc2626}.icv-head-kpis span{font-size:12px;color:var(--muted)}" +
    ".icv-bell-wrap{position:relative;display:inline-block;margin-inline-end:6px}.icv-bell{border:1px solid var(--line);background:#fff;border-radius:999px;padding:5px 10px;cursor:pointer;position:relative}" +
    ".icv-bell b{position:absolute;top:-6px;left:-6px;min-width:18px;height:18px;border-radius:9px;background:#dc2626;color:#fff;font-size:10px;line-height:18px;text-align:center}" +
    ".icv-bell-list{position:absolute;top:calc(100% + 8px);left:0;z-index:1000;width:min(360px,90vw);max-height:60vh;overflow:auto;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 18px 40px rgba(0,0,0,.14)}" +
    ".icv-bell-head{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid var(--line)}.icv-bell-head button{border:0;background:none;color:var(--primary);font:inherit;font-size:12px;cursor:pointer}" +
    ".icv-bell-item{display:block;width:100%;text-align:right;border:0;border-bottom:1px solid #eef2f5;background:#fff;padding:10px 14px;font:inherit;cursor:pointer}.icv-bell-item.unread{background:#f0fdfa}" +
    ".icv-bell-item b{display:block;font-size:13px}.icv-bell-item span{display:block;font-size:12px;color:var(--muted)}.icv-bell-item small{font-size:11px;color:var(--muted)}.icv-bell-empty{padding:16px;text-align:center;color:var(--muted)}" +
    "@media(max-width:1100px){.icv-audit-filters{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:700px){.icv-audit-filters{grid-template-columns:1fr 1fr}.icv-ev{flex-direction:column}.icv-head-bars>div{grid-template-columns:100px 1fr 50px}}";
  document.head.appendChild(style);

  // Profile and role are known only after sign-in; poll briefly for them.
  let tries = 0;
  const wait = setInterval(() => {
    wrapProfile();
    if (window.__icvProfile && window.__icvAccessClient) {
      clearInterval(wait);
      applyRole();
    } else if (++tries > 120) clearInterval(wait);
  }, 500);
})();
