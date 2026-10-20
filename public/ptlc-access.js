(() => {
  const URL = "https://bmwtrnosqosbkezdswcx.supabase.co",
    KEY = "sb_publishable_Ge88ZuNnqW89l0SMfw_mvQ_nY2BzpPr";
  const client = window.supabase.createClient(URL, KEY);
  window.__icvAccessClient = client;
  const roleName = (r) => window.ICV.roleLabel(r || "viewer");
  const isStaff = (p) => window.ICV.canEdit(p);
  const escA = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[m],
    );
  const toastA = (m) => window.ICV.showMessage(m, "success");
  const errorA = (e) => window.ICV.showMessage(window.ICV.friendlyError(e), "error");
  const errorBox = (e) => '<div class="bad">' + escA(window.ICV.friendlyError(e)) + "</div>";

  // Quarter helpers. A quarterly report is due 30 days after its quarter ends.
  const REPORT_GRACE_DAYS = 30;
  const quarterNo = (q) => Number(String(q || "").replace(/\D/g, "")) || 0;
  const reportKey = (projectId, year, q) => projectId + "|" + Number(year) + "|" + Number(q);
  // Returns the reports each project still owes for the last finished quarter, plus how late or close they are.
  function reportAlerts(projects, reports, now = new Date()) {
    const have = new Set(reports.map((r) => reportKey(r.project_id, r.annual_period, quarterNo(r.quarter))));
    const curQ = Math.floor(now.getMonth() / 3) + 1;
    const prevQ = curQ === 1 ? 4 : curQ - 1,
      prevYear = curQ === 1 ? now.getFullYear() - 1 : now.getFullYear();
    const qStart = new Date(prevYear, (prevQ - 1) * 3, 1),
      qEnd = new Date(prevYear, prevQ * 3, 0);
    const deadline = new Date(qEnd);
    deadline.setDate(deadline.getDate() + REPORT_GRACE_DAYS);
    const days = Math.ceil((deadline - now) / 86400000);
    const missing = [],
      due = [];
    projects.forEach((p) => {
      const start = p.start_date ? new Date(p.start_date) : null,
        end = p.end_date ? new Date(p.end_date) : null;
      if (!start || start > qEnd || (end && end < qStart)) return;
      if (have.has(reportKey(p.id, prevYear, prevQ))) return;
      if (days < 0) missing.push({ p, days: -days });
      else due.push({ p, days });
    });
    return { missing, due, label: "Q" + prevQ + " " + prevYear };
  }
  // Compliance criteria stored on each project by the database (see recompute_project_metrics).
  const CRITERIA = [
    { key: "omanization_status", pct: "omanization_pct", label: "التعمين", icon: "عُ", th: "omanization" },
    { key: "sme_10_status", pct: "sme_pct", label: "المؤسسات الصغيرة والمتوسطة", icon: "SME", th: "sme" },
    { key: "made_in_oman_status", pct: "goods_pct", label: "السلع (صنع في عُمان)", icon: "سلع", th: "goods" },
    { key: "services_status", pct: "services_pct", label: "الخدمات", icon: "خدم", th: "services" },
  ];
  const thresholdOf = (k) => {
    const v = Number(window.__icvCalculationSettings?.thresholds?.[k]);
    const d = { omanization: 30, sme: 10, goods: 40, services: 10 }[k];
    if (!Number.isFinite(v)) return d;
    return v > 0 && v <= 1 ? v * 100 : v;
  };
  const PROJECT_FIELDS =
    "id,project_name,serial_no,government_entity_id,project_status,start_date,end_date,local_content_plan,total_project_value,notes,omanization_pct,sme_pct,goods_pct,services_pct,omanization_status,sme_10_status,made_in_oman_status,services_status,compliance_status";
  let profile = null,
    originalShowPage = window.showPage;

  async function getProfile() {
    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session) return null;
    const { data, error } = await client.from("user_profiles").select("*").eq("id", session.user.id).single();
    if (error || !data) return null;
    profile = data;
    window.__icvProfile = data;
    return data;
  }
  function valid(p) {
    return !window.ICV.accessProblem(p);
  }
  function applyRoleUI() {
    if (!profile) return;
    document.body.dataset.role = profile.role || "viewer";
    const admin = profile.role === "admin",
      editor = isStaff(profile);
    const nav = document.getElementById("userAdminNav");
    if (nav) nav.classList.toggle("hidden", !admin);
    document.querySelectorAll("button").forEach((b) => {
      const oc = b.getAttribute("onclick") || "";
      if (/openProject\(|saveProject\(|openReport\(|openPlan\(/.test(oc))
        b.classList.toggle("hidden", !editor);
    });
    const name = document.getElementById("userName"),
      role = document.getElementById("userRole");
    if (name) name.textContent = profile.full_name || profile.username || "المستخدم";
    if (role) role.textContent = roleName(profile.role);
  }
  async function loginWithUsername() {
    const field = document.getElementById("email"),
      pass = document.getElementById("password"),
      msg = document.getElementById("authMsg");
    const raw = (field?.value || "").trim().toLowerCase(),
      password = pass?.value || "";
    if (!raw || !password) {
      if (msg) msg.textContent = "أدخل اسم المستخدم أو البريد الإلكتروني وكلمة المرور.";
      return;
    }
    if (msg) msg.textContent = "جارٍ تسجيل الدخول...";
    const email = raw.includes("@") ? raw : raw + "@icv-new.local";
    const r = await client.auth.signInWithPassword({ email, password });
    if (r.error) {
      if (msg) msg.textContent = window.ICV.friendlyError(r.error);
      return;
    }
    const { data: p, error: pe } = await client
      .from("user_profiles")
      .select("*")
      .eq("id", r.data.user.id)
      .single();
    if (pe || !p) {
      await client.auth.signOut();
      if (msg) msg.textContent = "تعذر تحميل صلاحيات الحساب.";
      return;
    }
    const problem = window.ICV.accessProblem(p);
    if (problem) {
      await client.auth.signOut();
      if (msg) msg.textContent = problem;
      return;
    }
    profile = p;
    window.__icvProfile = p;
    if (typeof window.boot === "function") await window.boot(r.data.session);
    if (window.icvLoadPlatformSettings) await window.icvLoadPlatformSettings();
    ensurePageShell();
    applyRoleUI();
    if (window.icvStructure?.renderDashboard) {
      window.icvStructure.renderDashboard();
      window.icvStructure.renderProjects();
      window.icvStructure.renderLocalContent();
    }
  }
  window.login = loginWithUsername;

  function injectProfileStyle() {
    if (document.getElementById("icv-profile-style")) return;
    const s = document.createElement("style");
    s.id = "icv-profile-style";
    s.textContent =
      '*{box-sizing:border-box}.profile-page{padding:0 0 8px}.profile-page-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.profile-page-head h2{margin:0 0 6px;font-size:28px;color:var(--text,#17211b)}.profile-page-head p{margin:0;color:var(--muted,#6b7770);font-size:13px}.profile-user-card{background:#fff;border:1px solid #e2e8e4;border-radius:15px;box-shadow:0 4px 18px #142d2010;padding:22px;margin-bottom:18px}.profiletop{display:flex;gap:16px;align-items:center}.profile-avatar{width:64px;height:64px;border-radius:50%;background:#e4f2eb;color:#0f5132;display:grid;place-items:center;font-size:24px;font-weight:800;flex:none}.profile-user-card h3{margin:0 0 5px;font-size:20px}.profile-user-meta{color:#6b7770;font-size:13px;margin-top:2px}.profile-active-badge{display:inline-block;background:#eaf8ef;color:#087443;border-radius:20px;padding:5px 10px;font-size:12px;font-weight:800;margin-top:6px}.profile-entities{border-top:1px solid #e8eeea;margin-top:18px;padding-top:16px}.profile-entities-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.profile-entities-head b{font-size:13px}.profile-entity-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.profile-entity{background:#f7faf8;border:1px solid #dce8e1;border-radius:9px;padding:9px 13px;font-size:13px;font-weight:700}.profile-entity-card{background:#f7faf8;border:1px solid #dce8e1;border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%}.profile-entity-card-main{min-width:0;flex:1}.profile-entity-card-main b{display:block;font-size:13px}.profile-entity-card-main span{display:block;color:#6b7770;font-size:11px;margin-top:4px}.profile-entity-card-btn{border:1px solid #0f5132;background:#fff;color:#0f5132;border-radius:9px;padding:8px 12px;font-family:inherit;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}.profile-entity-card-btn:hover{background:#0f5132;color:#fff}.profile-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-bottom:18px}.profile-kpi{background:#fff;border:1px solid #e2e8e4;border-radius:13px;padding:18px;box-shadow:0 4px 18px #142d2010}.profile-kpi .num{font-size:28px;font-weight:850}.profile-kpi .label{color:#6b7770;font-size:13px}.profile-kpi .green{color:#087443}.profile-kpi .orange{color:#b76b00}.profile-kpi .red{color:#c62828}.profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.profile-card{background:#fff;border:1px solid #e2e8e4;border-radius:15px;box-shadow:0 4px 18px #142d2010;overflow:hidden}.profile-card.full{grid-column:1/-1}.profile-card-head{padding:16px 18px;border-bottom:1px solid #e8eeea;display:flex;justify-content:space-between;align-items:center;gap:10px}.profile-card-head h3{margin:0;font-size:16px}.profile-muted{color:#6b7770;font-size:13px}.profile-filter{padding:12px 18px;border-bottom:1px solid #e8eeea;display:flex;gap:8px;flex-wrap:wrap}.profile-filter button{border:1px solid #dfe7e2;background:#fff;padding:7px 13px;border-radius:9px;font-size:12px;font-weight:700}.profile-filter button.active{background:#0f5132;color:#fff;border-color:#0f5132}.profile-row{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid #eef2ef}.profile-row:last-child{border:0}.profile-icon{width:35px;height:35px;border-radius:9px;display:grid;place-items:center;background:#fff0f0;color:#c62828;font-size:11px;font-weight:800;flex:none}.profile-icon.orange{background:#fff6e8;color:#b76b00}.profile-row-main{flex:1;min-width:0}.profile-row-main strong{display:block;font-size:13px}.profile-row-main span{font-size:12px;color:#6b7770}.profile-open{color:#0f5132;font-size:12px;font-weight:800;border:0;background:none;cursor:pointer;font-family:inherit;white-space:nowrap}.profile-table{width:100%;border-collapse:collapse;font-size:12px}.profile-table th,.profile-table td{text-align:right;padding:13px 16px;border-bottom:1px solid #eef2ef}.profile-table th{background:#fafcfb;color:#5d6a63}.profile-status{padding:5px 9px;border-radius:15px;font-size:11px;font-weight:800}.profile-status.red{background:#fff0f0;color:#c62828}.profile-status.orange{background:#fff6e8;color:#b76b00}.profile-task-wrap,.profile-activity-wrap{padding:4px 18px}.profile-task,.profile-activity{padding:12px 0;border-bottom:1px solid #eef2ef;font-size:12px}.profile-task:last-child,.profile-activity:last-child{border:0}.profile-task{display:flex;gap:12px}.profile-check{width:18px;height:18px;border:1.5px solid #b9c7bf;border-radius:5px;flex:none;background:#fff;padding:0;cursor:pointer}.profile-task.done .profile-check{background:#0f5132;border-color:#0f5132;position:relative}.profile-task.done .profile-check:after{content:"✓";color:#fff;font-weight:900;position:absolute;inset:0;display:grid;place-items:center}.profile-task.done .profile-row-main{text-decoration:line-through;color:#7b8780}.profile-task small,.profile-activity small{display:block;color:#6b7770;margin-top:4px}.profile-security{margin-top:18px;background:#fff;border:1px solid #e2e8e4;border-radius:15px;box-shadow:0 4px 18px #142d2010;padding:18px 20px;display:flex;justify-content:space-between;align-items:center}.profile-security h3{margin:0 0 5px;font-size:15px}.profile-security p{margin:0;color:#6b7770;font-size:12px}.profile-empty{text-align:center;color:#6b7770;padding:20px;font-size:12px}.profile-show-all{border:1px solid #dfe7e2;background:#fff;padding:8px 13px;border-radius:9px;font-weight:700;color:#0f5132;margin:10px 18px 14px;cursor:pointer}@media(max-width:900px){.profile-kpis{grid-template-columns:1fr 1fr}.profile-grid{grid-template-columns:1fr}.profile-card.full{grid-column:auto}}@media(max-width:600px){.profile-page-head{align-items:flex-start;flex-direction:column}.profile-kpis{grid-template-columns:1fr}.profile-security{align-items:flex-start;flex-direction:column;gap:12px}.profiletop{align-items:flex-start}}';
    document.head.appendChild(s);
  }
  injectProfileStyle();
  function applyLimitedViewerProfile() {
    const role = window.__icvProfile?.role || profile?.role;
    const limited = ["viewer", "temporary_viewer"].includes(role);
    const root = document.getElementById("page-profile");
    if (!root) return;
    root.classList.toggle("profile-limited-viewer", limited);
    if (!limited) return;
    // Viewers see their account card and password change only: tasks and follow-up lists are staff work.
    ["#accessProfileSummary", "#accessProfileAlerts", ".profile-entities", ".profile-grid"].forEach((sel) =>
      root.querySelectorAll(sel).forEach((el) => el.style.setProperty("display", "none", "important")),
    );
    const security = root.querySelector(".profile-security");
    if (security) security.style.setProperty("display", "flex", "important");
  }
  function ensurePageShell() {
    injectProfileStyle();
    const main = document.querySelector(".main");
    if (!main) return;
    const p = document.getElementById("page-profile") || document.createElement("div");
    p.id = "page-profile";
    p.className = "hidden";
    if (!p.querySelector("#accessProfileSummary"))
      p.innerHTML =
        '<div class="profile-page"><div class="profile-page-head"><div><h2>ملفي الشخصي</h2><p>مساحة عملك لمتابعة المشاريع والتقارير والتنبيهات المرتبطة بك</p></div></div><section class="profile-user-card"><div class="profiletop"><div class="profile-avatar" id="profileHeadInitials">م</div><div><h3 id="profileHeadName">المستخدم</h3><div class="profile-user-meta">اسم المستخدم: <span id="profileHeadUsername">—</span></div><div class="profile-user-meta" id="profileHeadRole">—</div><span class="profile-active-badge">● الحساب نشط</span></div></div><div class="profile-entities"><div class="profile-entities-head"><b>الجهات الحكومية المسندة إليّ</b><button class="btn primary" style="width:auto" id="profileEntitiesBtn">تعديل الجهات</button></div><div id="accessProfileEntities" class="profile-entity-list"><span class="profile-empty">جاري التحميل...</span></div></div></section><div id="accessProfileSummary" class="profile-kpis"></div><div id="accessProfileAlerts"></div><div class="profile-grid"><section class="profile-card"><div class="profile-card-head"><h3>📝 مهامي</h3><button class="btn primary" style="width:auto" id="profileAddTaskBtn">+ إضافة مهمة</button></div><div id="accessProfileTasks" class="profile-task-wrap"><div class="profile-empty">جاري التحميل...</div></div></section><section class="profile-card"><div class="profile-card-head"><h3>🕐 آخر الأنشطة</h3><span class="profile-muted">آخر التحديثات</span></div><div id="accessProfileActivity" class="profile-activity-wrap"><div class="profile-empty">جاري التحميل...</div></div></section></div><section class="profile-security"><div><h3>🔐 أمان الحساب</h3><p>تغيير الرقم السري متاح في أي وقت. صلاحياتك والجهات المسندة إليك تُدار من قبل مدير النظام.</p></div><button class="btn primary" style="width:auto" id="profilePasswordBtn">تغيير الرقم السري</button></section></div>';
    const profileIntro = p.querySelector(".profile-page-head");
    if (profileIntro && !profileIntro.querySelector(".profile-scope-badge"))
      profileIntro.innerHTML =
        '<div><p>نظرة شاملة على المشاريع والتقارير ضمن الجهات الحكومية المسندة لحسابك.</p></div><span class="profile-scope-badge">◉ ضمن نطاق الجهات المسندة</span>';
    if (!p.parentElement) main.appendChild(p);
    const usersPage = document.getElementById("page-users") || document.createElement("div");
    usersPage.id = "page-users";
    usersPage.className = usersPage.className || "hidden";
    if (!usersPage.querySelector(".um-wrap")) {
      usersPage.innerHTML =
        '<div class="um-wrap"><div class="um-hero"><div><div class="um-crumb">إدارة النظام / المستخدمون</div><h2>إدارة المستخدمين</h2><p>إدارة حسابات الموظفين والأدوار وفترات الصلاحية والجهات المسندة إليهم.</p></div><button class="btn primary um-add" onclick="openUserForm()">＋ إضافة مستخدم</button></div><div class="um-filters panel"><div class="um-filter-grid"><div class="field"><label>اسم المستخدم</label><input id="usersSearch" placeholder="مثال: user01" oninput="filterAdminUsers()"></div><div class="field"><label>الاسم</label><input id="usersNameFilter" placeholder="ابحث بالاسم" oninput="filterAdminUsers()"></div><div class="field"><label>الدور</label><select id="usersRoleFilter" onchange="filterAdminUsers()"><option value="">الكل</option>' +
        window.ICV.ROLE_ORDER.map((r) => '<option value="' + r + '">' + escA(roleName(r)) + "</option>").join(
          "",
        ) +
        '</select></div><div class="field"><label>الحالة</label><select id="usersStatusFilter" onchange="filterAdminUsers()"><option value="">الكل</option><option value="active">فعال</option><option value="inactive">غير فعال</option></select></div><div class="field"><label>الجهة المسندة</label><select id="usersEntityFilter" onchange="filterAdminUsers()"><option value="">كل الجهات</option></select></div></div></div><div class="panel um-table-panel"><div class="um-table-head"><div><h3>قائمة المستخدمين</h3><div id="usersAdminCount" class="muted"></div></div><button class="btn" onclick="loadUsersAdmin()">تحديث</button></div><div id="usersAdminBox" class="empty">جاري التحميل...</div></div></div>';
      if (!usersPage.parentElement) main.appendChild(usersPage);
    }
    const nav = document.querySelector(".nav");
    if (nav && !document.getElementById("userProfileNav")) {
      const b = document.createElement("button");
      b.id = "userProfileNav";
      b.dataset.page = "profile";
      b.onclick = function () {
        window.showPage("profile", this);
      };
      b.innerHTML = '<span class="ico">◉</span><span>ملفي الشخصي</span>';
      nav.appendChild(b);
    }
    if (nav && !document.getElementById("userAdminNav")) {
      const b = document.createElement("button");
      b.id = "userAdminNav";
      b.dataset.page = "users";
      b.className = "hidden";
      b.onclick = function () {
        window.showPage("users", this);
      };
      b.innerHTML = '<span class="ico">⚙</span><span>إدارة المستخدمين</span>';
      nav.appendChild(b);
    }
    document.getElementById("profileEntitiesBtn")?.addEventListener("click", openMyEntitySelection);
    document.getElementById("profileAddTaskBtn")?.addEventListener("click", openMyTaskForm);
    document.getElementById("profilePasswordBtn")?.addEventListener("click", openChangePassword);
    applyLimitedViewerProfile();
  }

  const taskDone = (t) => ["closed", "مكتمل", "done"].includes(String(t.status || "").toLowerCase());
  function renderMyTasks(rows) {
    const el = document.getElementById("accessProfileTasks");
    if (!el) return;
    if (!rows?.length) {
      el.innerHTML = '<div class="profile-empty">لا توجد مهام مسجلة حاليًا.</div>';
      return;
    }
    el.innerHTML = rows
      .slice(0, 10)
      .map((t) => {
        const priority = t.priority || t.priority_level || "متوسطة";
        const cls = priority === "عالية" ? "red" : priority === "منخفضة" ? "green" : "orange";
        const title = t.task_name || t.action_required || t.title || "مهمة متابعة";
        const project = t.project_name || t.project?.project_name || "بدون مشروع";
        const due = t.due_date ? new Date(t.due_date).toLocaleDateString("ar-OM") : "بدون تاريخ";
        const done = taskDone(t);
        return (
          '<div class="profile-task ' +
          (done ? "done" : "") +
          '"><button class="profile-check" type="button" data-task-id="' +
          escA(t.id) +
          '" aria-label="إنجاز المهمة"></button><div class="profile-row-main"><strong>' +
          escA(title) +
          "</strong><small>" +
          escA(project) +
          " · " +
          escA(due) +
          ' · <b class="' +
          cls +
          '">أولوية ' +
          escA(priority) +
          "</b></small></div></div>"
        );
      })
      .join("");
    el.querySelectorAll("[data-task-id]").forEach(
      (btn) =>
        (btn.onclick = async () => {
          const row = rows.find((x) => String(x.id) === String(btn.dataset.taskId));
          if (!row) return;
          const closing = !taskDone(row);
          const change = closing
            ? { status: "closed", resolved_at: new Date().toISOString(), resolved_by: profile.id }
            : { status: "open", resolved_at: null, resolved_by: null };
          const { error } = await client
            .from("employee_followups")
            .update(change)
            .eq("id", row.id)
            .eq("assigned_to", profile.id);
          if (error) return errorA(error);
          Object.assign(row, change);
          btn.parentElement.classList.toggle("done", closing);
          window.icvSaveSuccess?.("تم تحديث حالة المهمة");
        }),
    );
  }
  function renderMyActivity(rows) {
    const el = document.getElementById("accessProfileActivity");
    if (!el) return;
    const items = (rows || []).slice(0, 6);
    el.innerHTML = items.length
      ? items
          .map(
            (t) =>
              '<div class="profile-activity"><b>' +
              escA(t.action_required || t.task_name || t.title || "تم تحديث مهمة متابعة") +
              "</b><small>" +
              escA(
                t.updated_at
                  ? new Date(t.updated_at).toLocaleString("ar-OM")
                  : t.created_at
                    ? new Date(t.created_at).toLocaleString("ar-OM")
                    : "آخر تحديث",
              ) +
              "</small></div>",
          )
          .join("")
      : '<div class="profile-empty">لا توجد أنشطة مسجلة حاليًا.</div>';
  }
  window.openMyTaskForm = function () {
    if (!isStaff(profile)) return toastA("المهام متاحة لموظفي القسم فقط.");
    document.getElementById("myTaskModal")?.remove();
    const d = document.createElement("div");
    d.id = "myTaskModal";
    d.className = "modal";
    d.innerHTML =
      '<div class="modal-card"><div class="modal-head"><div><h2>إضافة مهمة</h2><div class="muted">إضافة متابعة شخصية إلى ملفك.</div></div><button class="close" onclick="this.closest(\'.modal\').remove()">×</button></div><div class="form-grid"><div class="field full"><label>المهمة</label><input id="myTaskName" placeholder="اكتب المهمة"></div><div class="field"><label>المشروع</label><input id="myTaskProject" placeholder="اختياري"></div><div class="field"><label>تاريخ الاستحقاق</label><input id="myTaskDue" type="date"></div><div class="field"><label>الأولوية</label><select id="myTaskPriority"><option value="عاجلة">عاجلة</option><option value="عالية">عالية</option><option value="متوسطة" selected>متوسطة</option><option value="منخفضة">منخفضة</option></select></div><div class="field full"><label>ملاحظات</label><textarea id="myTaskNotes" rows="3" placeholder="اختياري"></textarea></div></div><div id="myTaskMsg"></div><div class="modal-foot"><button class="btn primary" onclick="saveMyTask()">إضافة المهمة</button><button class="btn" onclick="this.closest(\'.modal\').remove()">إلغاء</button></div></div>';
    document.body.appendChild(d);
  };
  window.saveMyTask = async function () {
    if (!isStaff(profile)) return;
    const name = document.getElementById("myTaskName")?.value.trim(),
      msg = document.getElementById("myTaskMsg");
    if (!name) {
      if (msg) msg.innerHTML = '<div class="bad">اكتب اسم المهمة أولاً.</div>';
      return;
    }
    const body = {
      assigned_to: profile.id,
      created_by: profile.id,
      employee_name: profile.full_name || profile.username || "المستخدم",
      category: "مهمة شخصية",
      action_required: name,
      priority: document.getElementById("myTaskPriority")?.value || "متوسطة",
      due_date: document.getElementById("myTaskDue")?.value || null,
      status: "open",
      notes: (
        (document.getElementById("myTaskProject")?.value || "") +
        " " +
        (document.getElementById("myTaskNotes")?.value || "")
      ).trim(),
    };
    const { error } = await client.from("employee_followups").insert(body);
    if (error) {
      if (msg) msg.innerHTML = errorBox(error);
      return;
    }
    document.getElementById("myTaskModal")?.remove();
    await loadProfilePage();
    window.icvSaveSuccess?.("تم إضافة المهمة");
  };
  window.openChangePassword = function () {
    document.getElementById("changePasswordModal")?.remove();
    const d = document.createElement("div");
    d.id = "changePasswordModal";
    d.className = "modal";
    d.innerHTML =
      '<div class="modal-card"><div class="modal-head"><div><h2>تغيير الرقم السري</h2><div class="muted">سيتم تحديث كلمة مرور حسابك فقط.</div></div><button class="close" onclick="this.closest(\'.modal\').remove()">×</button></div><div class="form-grid"><div class="field full"><label>كلمة المرور الجديدة</label><input id="newPassword" type="password" minlength="8"></div><div class="field full"><label>تأكيد كلمة المرور</label><input id="newPassword2" type="password" minlength="8"></div></div><div id="changePasswordMsg"></div><div class="modal-foot"><button class="btn primary" onclick="saveNewPassword()">حفظ</button><button class="btn" onclick="this.closest(\'.modal\').remove()">إلغاء</button></div></div>';
    document.body.appendChild(d);
  };
  window.saveNewPassword = async function () {
    const a = document.getElementById("newPassword")?.value || "",
      b = document.getElementById("newPassword2")?.value || "",
      msg = document.getElementById("changePasswordMsg");
    if (a.length < 8) {
      msg.innerHTML = '<div class="bad">كلمة المرور يجب أن تكون 8 أحرف على الأقل.</div>';
      return;
    }
    if (a !== b) {
      msg.innerHTML = '<div class="bad">تأكيد كلمة المرور غير مطابق.</div>';
      return;
    }
    const { error } = await client.auth.updateUser({ password: a });
    if (error) {
      msg.innerHTML = errorBox(error);
      return;
    }
    document.getElementById("changePasswordModal")?.remove();
    window.icvSaveSuccess?.("تم تغيير الرقم السري بنجاح");
  };
  async function loadProfilePage() {
    if (!profile) await getProfile();
    const uid = profile?.id;
    if (!uid) return;
    const a = await client
      .from("user_entity_assignments_view")
      .select("*")
      .eq("user_id", uid)
      .order("government_entity");
    const assigned = a.data || [],
      ids = new Set(assigned.map((x) => x.government_entity_id).filter(Boolean));
    let pr = { data: [] };
    if (ids.size) {
      const projectQuery = client
        .from("projects")
        .select(PROJECT_FIELDS)
        .in("government_entity_id", [...ids])
        .order("project_name");
      pr = await projectQuery;
    }
    const projects = pr.data || [],
      projectIds = [...new Set(projects.map((x) => x.id).filter(Boolean))];
    const [rr, pl, tasks] = await Promise.all([
      projectIds.length
        ? client
            .from("quarterly_reports")
            .select("id,project_id,quarter,annual_period,status,created_at")
            .in("project_id", projectIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      projectIds.length
        ? client
            .from("local_content_plans")
            .select("project_id,status,created_at")
            .in("project_id", projectIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      isStaff(profile)
        ? client
            .from("employee_followups")
            .select("*")
            .eq("assigned_to", uid)
            .order("due_date", { ascending: true })
        : Promise.resolve({ data: [] }),
    ]);
    const reports = rr.data || [],
      plans = pl.data || [],
      taskRows = tasks.data || [];
    window.__icvProfileAssignedIds = [...ids];
    const pids = new Set(projectIds),
      myReports = reports.filter((x) => pids.has(x.project_id)),
      planIds = new Set(plans.map((x) => x.project_id));
    const reviewReports = myReports.filter((r) => /مراجعة|review|pending/i.test(String(r.status || "")));
    const now = new Date();
    const { missing, due, label: alertPeriod } = reportAlerts(projects, myReports, now);
    const attention = [];
    projects.forEach((p) => {
      CRITERIA.forEach((c) => {
        if (p[c.key] === "غير مستوفي")
          attention.push({
            p,
            icon: c.icon,
            k: "red",
            t:
              c.label +
              " " +
              (p[c.pct] == null ? "" : Number(p[c.pct]).toFixed(1) + "% ") +
              "أقل من الحد (" +
              thresholdOf(c.th) +
              "%)",
          });
      });
      if (p.project_status === "متعثر") attention.push({ p, icon: "!", t: "المشروع متعثر", k: "orange" });
      if (!p.local_content_plan && !planIds.has(p.id))
        attention.push({ p, icon: "📄", t: "لا توجد خطة محتوى محلي", k: "orange" });
    });
    const exp = projects
        .filter((p) => p.end_date)
        .map((p) => ({ p, d: new Date(p.end_date) }))
        .filter((x) => x.d >= now && x.d <= new Date(now.getTime() + 90 * 86400000))
        .sort((a, b) => a.d - b.d),
      fmt = (d) => (d ? new Date(d).toLocaleDateString("ar-OM") : "—");
    document.getElementById("accessProfileSummary").innerHTML = [
      ["إجمالي المشاريع", projects.length, ""],
      ["قيد التنفيذ", projects.filter((p) => p.project_status === "قيد التنفيذ").length, "green"],
      ["تحتاج متابعة", attention.length, "orange"],
      ["تقارير تحتاج إجراء", missing.length + due.length + reviewReports.length, "red"],
    ]
      .map(
        (x) =>
          '<div class="card"><div class="label">' +
          escA(x[0]) +
          '</div><div class="value ' +
          x[2] +
          '">' +
          x[1] +
          "</div></div>",
      )
      .join("");
    document.getElementById("accessProfileEntities").innerHTML = assigned.length
      ? assigned
          .map(
            (x) =>
              '<button type="button" class="profile-entity profile-entity-name-link" onclick="window.openMyEntityCard(\'' +
              escA(x.government_entity_id) +
              '\')" aria-label="فتح بطاقة الجهة ' +
              escA(x.government_entity) +
              '">' +
              escA(x.government_entity) +
              ' <span class="profile-entity-dot" aria-hidden="true">●</span></button>',
          )
          .join("")
      : '<span class="profile-empty">لم تُحدَّد جهات لهذا الحساب بعد. اضغط «تعديل الجهات» لاختيار الجهات التي تتابعها.</span>';
    let h = '<div class="profile-grid">';
    h +=
      '<section class="profile-card full"><div class="profile-card-head"><h3>🔴 التقارير التي تحتاج إجراء</h3><span class="profile-muted">' +
      (missing.length + due.length) +
      ' تقارير</span></div><div class="profile-filter"><button class="active" data-alert-filter="all">الكل</button><button data-alert-filter="missing">غير مستلم</button><button data-alert-filter="due">مستحق قريبًا</button><button data-alert-filter="review">تحت المراجعة</button></div><div id="myReportAlerts">';
    missing.forEach(
      (x) =>
        (h +=
          '<div class="profile-row report-row" data-type="missing"><div class="profile-icon">!</div><div class="profile-row-main"><strong>' +
          escA(x.p.project_name) +
          "</strong><span>" +
          alertPeriod +
          " — التقرير غير مستلم · متأخر " +
          x.days +
          ' يوم</span></div><button class="profile-open" data-open-project="' +
          x.p.id +
          '">فتح المشروع ←</button></div>'),
    );
    due.forEach(
      (x) =>
        (h +=
          '<div class="profile-row report-row" data-type="due"><div class="profile-icon orange">!</div><div class="profile-row-main"><strong>' +
          escA(x.p.project_name) +
          "</strong><span>" +
          alertPeriod +
          " — مستحق خلال " +
          x.days +
          ' أيام</span></div><button class="profile-open" data-open-project="' +
          x.p.id +
          '">فتح المشروع ←</button></div>'),
    );
    reviewReports.forEach((r) => {
      const p = projects.find((x) => x.id === r.project_id);
      if (p)
        h +=
          '<div class="profile-row report-row" data-type="review"><div class="profile-icon orange">⌕</div><div class="profile-row-main"><strong>' +
          escA(p.project_name) +
          "</strong><span>" +
          escA((r.quarter || "") + " " + (r.annual_period || "")) +
          ' — بانتظار المراجعة</span></div><button class="profile-open" data-open-project="' +
          p.id +
          '">فتح المشروع ←</button></div>';
    });
    if (!missing.length && !due.length && !reviewReports.length)
      h += '<div class="profile-empty">لا توجد تقارير تحتاج إجراء حاليًا.</div>';
    h +=
      "</div>" +
      (missing.length + due.length + reviewReports.length > 3
        ? '<button class="profile-show-all" data-toggle-list="myReportAlerts">إظهار الكل</button>'
        : "") +
      "</section>";
    h +=
      '<section class="profile-card"><div class="profile-card-head"><h3>📅 مشاريع تنتهي خلال 3 أشهر</h3><span class="profile-muted">' +
      exp.length +
      ' مشاريع</span></div><div id="expiringProjects">';
    exp.forEach(
      (x) =>
        (h +=
          '<div class="profile-row"><div class="profile-icon orange">3M</div><div class="profile-row-main"><strong>' +
          escA(x.p.project_name) +
          "</strong><span>" +
          fmt(x.p.end_date) +
          " — متبقي " +
          Math.ceil((x.d - now) / 86400000) +
          ' يوم</span></div><button class="profile-open" data-open-project="' +
          x.p.id +
          '">فتح المشروع ←</button></div>'),
    );
    if (!exp.length) h += '<div class="profile-empty">لا توجد مشاريع تنتهي خلال 3 أشهر.</div>';
    h +=
      "</div>" +
      (exp.length > 3
        ? '<button class="profile-show-all" data-toggle-list="expiringProjects">إظهار الكل</button>'
        : "") +
      "</section>";
    h +=
      '<section class="profile-card"><div class="profile-card-head"><h3>⚠️ مشاريع تحتاج متابعة</h3><span class="profile-muted">' +
      attention.length +
      '</span></div><div id="attentionProjects">';
    attention.forEach(
      (x) =>
        (h +=
          '<div class="profile-row"><div class="profile-icon ' +
          (x.k === "red" ? "" : "orange") +
          '">' +
          escA(x.icon) +
          '</div><div class="profile-row-main"><strong>' +
          escA(x.p.project_name) +
          "</strong><span>" +
          escA(x.t) +
          '</span></div><button class="profile-open" data-open-project="' +
          x.p.id +
          '">فتح المشروع ←</button></div>'),
    );
    if (!attention.length) h += '<div class="profile-empty">لا توجد مشاريع تحتاج متابعة حاليًا.</div>';
    h +=
      "</div>" +
      (attention.length > 3
        ? '<button class="profile-show-all" data-toggle-list="attentionProjects">إظهار الكل</button>'
        : "") +
      "</section>";
    const plansOk = projects.filter((p) => !!p.local_content_plan || planIds.has(p.id)).length;
    // Counts only projects where the criterion applies (status is not «غير منطبق»).
    const criterionBar = (c) => {
      const known = projects.filter((p) => p[c.key] === "مستوفي" || p[c.key] === "غير مستوفي");
      return complianceBar(
        "مشاريع تحقق " + c.label + " (" + thresholdOf(c.th) + "%)",
        known.filter((p) => p[c.key] === "مستوفي").length,
        known.length,
      );
    };
    const complianceBar = (label, ok, total) => {
      const ratio = total ? Math.round((ok / total) * 100) : 0;
      return (
        '<div class="profile-compliance-item"><div class="profile-compliance-top"><span>' +
        escA(label) +
        "</span><b>" +
        (total ? ok + " من " + total : "لا توجد بيانات") +
        '</b></div><div class="profile-compliance-track"><i style="width:' +
        ratio +
        '%"></i></div><small>' +
        (total ? ratio + "% من المشاريع ذات البيانات تحقق المستهدف" : "لا تتوفر بيانات كافية للعرض") +
        "</small></div>"
      );
    };
    const fullyCompliant = projects.filter((p) => p.compliance_status === "مستوفي").length,
      withStatus = projects.filter((p) => p.compliance_status && p.compliance_status !== "غير منطبق").length;
    h +=
      '<section class="profile-card full"><div class="profile-card-head"><h3>📊 لمحة عن الالتزام</h3><span class="profile-muted">ضمن الجهات المسندة للحساب · من التقارير المعتمدة</span></div><div class="profile-compliance-grid">' +
      complianceBar("مشاريع مستوفية لجميع المعايير", fullyCompliant, withStatus) +
      CRITERIA.map(criterionBar).join("") +
      complianceBar("مشاريع لديها خطة محتوى محلي", plansOk, projects.length) +
      "</div></section>";
    h +=
      '<section class="profile-card full"><div class="profile-card-head"><h3>📋 سجل التقارير</h3><span class="profile-muted">آخر التقارير المستلمة</span></div><div class="profile-table-wrap"><table class="profile-table"><thead><tr><th>المشروع</th><th>الفترة</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>';
    myReports.forEach((r) => {
      const p = projects.find((x) => x.id === r.project_id);
      if (p)
        h +=
          "<tr><td>" +
          escA(p.project_name) +
          "</td><td>" +
          escA((r.quarter || "") + " " + (r.annual_period || "")) +
          '</td><td><span class="profile-status ' +
          (r.status === "معتمد" ? "green" : String(r.status || "").includes("غير") ? "red" : "orange") +
          '">' +
          escA(r.status || "—") +
          '</span></td><td><button class="profile-open" data-open-project="' +
          p.id +
          '">فتح المشروع ←</button></td></tr>';
    });
    if (!myReports.length) h += '<tr><td colspan="4" class="profile-empty">لا توجد تقارير مسجلة.</td></tr>';
    h += "</tbody></table></div></section>";
    h += "</div>";
    document.getElementById("accessProfileAlerts").innerHTML = h;
    document.getElementById("profileHeadName").textContent =
      profile.full_name || profile.username || "المستخدم";
    document.getElementById("profileHeadUsername").textContent = profile.username || "—";
    document.getElementById("profileHeadRole").textContent =
      roleName(profile.role) +
      (profile.access_expires_at
        ? " · الصلاحية حتى " + window.ICV.formatDate(profile.access_expires_at)
        : "");
    document.getElementById("profileHeadInitials").textContent = (
      profile.full_name ||
      profile.username ||
      "م"
    )
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0])
      .join("");
    removeDuplicateProfileSections();
    setupProfileInteractions();
    renderMyTasks(taskRows);
    renderMyActivity(taskRows);
    applyLimitedViewerProfile();
    ["myReportAlerts", "expiringProjects", "attentionProjects"].forEach((id) =>
      applyProfileListLimit(document.getElementById(id), 3),
    );
    const reportTable = document.querySelector("#accessProfileAlerts .profile-table tbody");
    if (reportTable) {
      reportTable.id = "myReportsTable";
      applyProfileListLimit(reportTable, 3);
    }
  }

  window.loadProfilePage = loadProfilePage;

  function removeDuplicateProfileSections() {
    const root = document.getElementById("page-profile");
    if (!root) return;
    ["accessProfileTasks", "accessProfileActivity", "profileAddTaskBtn", "profilePasswordBtn"].forEach(
      (id) => {
        const nodes = Array.from(root.querySelectorAll("#" + id));
        nodes.slice(1).forEach((node) => {
          const section = node.closest(".profile-card,.profile-security");
          if (section) section.remove();
          else node.remove();
        });
      },
    );
    const security = Array.from(root.querySelectorAll(".profile-security"));
    security.slice(1).forEach((node) => node.remove());
  }
  function setupProfileInteractions() {
    document
      .querySelectorAll("#accessProfileAlerts [data-open-project]")
      .forEach((b) => (b.onclick = () => openMyProject(b.dataset.openProject)));
    document.querySelectorAll("#accessProfileAlerts [data-toggle-list]").forEach(
      (b) =>
        (b.onclick = () => {
          const list = document.getElementById(b.dataset.toggleList);
          if (!list) return;
          list.classList.toggle("expanded");
          applyProfileListLimit(list, 3);
        }),
    );
    document.querySelectorAll("#accessProfileAlerts [data-alert-filter]").forEach(
      (b) =>
        (b.onclick = () => {
          document
            .querySelectorAll("#accessProfileAlerts [data-alert-filter]")
            .forEach((x) => x.classList.remove("active"));
          b.classList.add("active");
          const type = b.dataset.alertFilter,
            list = document.getElementById("myReportAlerts");
          Array.from(list.children).forEach(
            (x) => (x.style.display = type === "all" || x.dataset.type === type ? "flex" : "none"),
          );
          applyProfileListLimit(list, 3);
        }),
    );
    ["myReportAlerts", "expiringProjects", "attentionProjects"].forEach((id) => {
      const list = document.getElementById(id);
      if (list) applyProfileListLimit(list, 3);
    });
    const reportTable = document.querySelector("#page-profile .profile-table tbody");
    if (reportTable) {
      Array.from(reportTable.children).forEach((row, i) => {
        if (i >= 3) row.dataset.profileExtra = "1";
      });
      if (
        reportTable.children.length > 3 &&
        !reportTable.parentElement.parentElement.querySelector("[data-profile-table-toggle]")
      ) {
        const btn = document.createElement("button");
        btn.className = "profile-show-all";
        btn.dataset.profileTableToggle = "1";
        btn.textContent = "إظهار الكل";
        reportTable.parentElement.parentElement.appendChild(btn);
        btn.onclick = () => {
          const open = btn.dataset.open !== "1";
          btn.dataset.open = open ? "1" : "0";
          Array.from(reportTable.children).forEach((row) => {
            if (row.dataset.profileExtra) row.style.display = open ? "table-row" : "none";
          });
          btn.textContent = open ? "إخفاء" : "إظهار الكل";
        };
      }
    }
  }
  function applyProfileListLimit(list, limit) {
    if (!list) return;
    const items = Array.from(list.children).filter((x) => !x.classList.contains("profile-empty"));
    const expanded = list.classList.contains("expanded");
    const displayValue = list.tagName === "TBODY" ? "table-row" : "flex";
    items.forEach((x, i) => (x.style.display = expanded || i < limit ? displayValue : "none"));
    const btn = document.querySelector('#accessProfileAlerts [data-toggle-list="' + list.id + '"]');
    if (btn) {
      btn.style.display = items.length > limit ? "inline-block" : "none";
      btn.textContent = expanded ? "إخفاء" : "إظهار الكل";
    }
  }
  window.openMyProject = (id) => {
    if (typeof window.viewProject === "function") window.viewProject(id);
    else location.href = "index.html?project=" + encodeURIComponent(id);
  };
  window.openMyEntityCard = async function (id) {
    const [er, pr] = await Promise.all([
      client.from("government_entities").select(window.ICV.ENTITY_COLS).eq("id", id).maybeSingle(),
      client
        .from("projects")
        .select("id,project_name,project_status,end_date")
        .eq("government_entity_id", id)
        .order("project_name"),
    ]);
    const e = er.data;
    if (!e) return;
    await window.ICV.attachContacts(client, "government_entities", e);
    const projects = pr.data || [],
      contacts = Array.isArray(e.contact_points) ? e.contact_points : [];
    const old = document.getElementById("myEntityCardModal");
    if (old) old.remove();
    const d = document.createElement("div");
    d.id = "myEntityCardModal";
    d.className = "profile-entity-modal-backdrop";
    d.style.cssText =
      "position:fixed;inset:0;width:100vw;height:100vh;z-index:10050;background:rgba(15,23,42,.62);display:grid;place-items:center;padding:20px;overflow:auto;box-sizing:border-box";
    d.innerHTML =
      '<div class="profile-entity-dialog" style="display:block;position:relative;width:min(760px,100%);max-height:calc(100vh - 40px);overflow:auto;margin:auto;background:var(--card,#fff);color:var(--ink,#17211b);border:1px solid var(--line,#dfe7e2);border-radius:18px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.28);box-sizing:border-box"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:15px"><div><div class="muted">بطاقة الجهة الحكومية</div><h3 style="margin:4px 0 0;font-size:21px">' +
      escA(e.name || "—") +
      '</h3></div><button class="btn" onclick="this.closest(\'.profile-entity-modal-backdrop\').remove()">×</button></div><div class="profile-kpis" style="grid-template-columns:repeat(2,1fr);margin-top:18px"><div class="profile-kpi"><div class="num">' +
      projects.length +
      '</div><div class="label">إجمالي المشاريع</div></div><div class="profile-kpi"><div class="num green">' +
      projects.filter((p) => p.project_status === "قيد التنفيذ").length +
      '</div><div class="label">مشاريع قيد التنفيذ</div></div></div>' +
      (!window.ICV.canSeeContacts()
        ? ""
        : '<div style="border-top:1px solid #e8eeea;padding-top:16px;margin-top:4px"><b>نقاط التواصل</b>' +
          (contacts.length
            ? contacts
                .map(
                  (x) =>
                    '<div class="profile-row" style="padding-left:0;padding-right:0"><div class="profile-row-main"><strong>' +
                    escA(x.name || "—") +
                    "</strong><span>📞 " +
                    escA(x.phone || "—") +
                    " &nbsp; | &nbsp; ✉ " +
                    escA(x.email || "—") +
                    "</span></div></div>",
                )
                .join("")
            : '<div class="profile-empty">لا توجد نقاط تواصل مضافة.</div>') +
          "</div>") +
      '<div style="border-top:1px solid #e8eeea;padding-top:16px;margin-top:16px"><b>مشاريع الجهة</b>' +
      (projects.length
        ? projects
            .slice(0, 10)
            .map(
              (p) =>
                '<div class="profile-row" style="padding-left:0;padding-right:0"><div class="profile-row-main"><strong>' +
                escA(p.project_name) +
                "</strong><span>" +
                escA(p.project_status || "—") +
                " · تاريخ الانتهاء " +
                (p.end_date ? new Date(p.end_date).toLocaleDateString("ar-OM") : "—") +
                '</span></div><button class="profile-open" onclick="window.openMyProject(\'' +
                escA(p.id) +
                "');this.closest('.profile-entity-modal-backdrop').remove()\">فتح المشروع ←</button></div>",
            )
            .join("")
        : '<div class="profile-empty">لا توجد مشاريع مرتبطة بهذه الجهة.</div>') +
      (projects.length > 10 ? '<div class="profile-empty">يتم عرض أول 10 مشاريع.</div>' : "") +
      "</div></div>";
    d.addEventListener("click", function (ev) {
      if (ev.target === d) d.remove();
    });
    document.body.appendChild(d);
  };
  window.openMyEntitySelection = async function () {
    const uid = profile?.id;
    if (!uid) return;
    const [e, a] = await Promise.all([
      client.from("government_entities").select("id,name,code").order("name"),
      client.from("user_entity_assignments_view").select("government_entity_id").eq("user_id", uid),
    ]);
    const selected = new Set((a.data || []).map((x) => x.government_entity_id));
    const d = document.createElement("div");
    d.id = "myEntityAccessModal";
    d.className = "modal";
    d.innerHTML =
      '<div class="modal-card"><div class="modal-head"><div><h2>جهات المتابعة</h2><div class="muted">حدد الجهات التي تتابعها</div></div><button class="close" onclick="this.closest(\'.modal\').remove()">×</button></div><div class="actions" style="margin:14px 0"><button class="btn" onclick="document.querySelectorAll(\'#myEntityAccessChecklist input\').forEach(x=>x.checked=true)">تحديد الكل</button><button class="btn" onclick="document.querySelectorAll(\'#myEntityAccessChecklist input\').forEach(x=>x.checked=false)">إلغاء الكل</button><input id="myEntityAccessSearch" class="search" style="flex:1" placeholder="بحث..." oninput="filterMyEntities()"></div><div id="myEntityAccessChecklist" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:55vh;overflow:auto">' +
      (e.data || [])
        .map(
          (x) =>
            '<label class="card" style="padding:10px;cursor:pointer"><input type="checkbox" value="' +
            x.id +
            '" ' +
            (selected.has(x.id) ? "checked" : "") +
            "> " +
            escA(x.name) +
            (x.code ? ' <small class="muted">(' + escA(x.code) + ")</small>" : "") +
            "</label>",
        )
        .join("") +
      '</div><div id="myEntityAccessMsg"></div><button class="btn primary" style="margin-top:14px;width:auto" onclick="saveMyEntitySelection()">حفظ الجهات</button></div>';
    document.body.appendChild(d);
  };
  window.filterMyEntities = () => {
    const q = (document.getElementById("myEntityAccessSearch")?.value || "").toLowerCase();
    document
      .querySelectorAll("#myEntityAccessChecklist label")
      .forEach((x) => (x.style.display = x.textContent.toLowerCase().includes(q) ? "block" : "none"));
  };
  window.saveMyEntitySelection = async () => {
    const ids = [...document.querySelectorAll("#myEntityAccessChecklist input:checked")].map((x) => x.value);
    const r = await client.rpc("set_my_entity_assignments", { p_entity_ids: ids });
    const m = document.getElementById("myEntityAccessMsg");
    if (r.error) {
      m.innerHTML = errorBox(r.error);
      return;
    }
    document.getElementById("myEntityAccessModal")?.remove();
    await loadProfilePage();
    toastA("تم حفظ جهات المتابعة");
  };
  window.loadUsersAdmin = async function () {
    if (profile?.role !== "admin") return;
    const box = document.getElementById("usersAdminBox");
    if (!box) return;
    box.innerHTML = "جاري التحميل...";
    const [r, er] = await Promise.all([
      client.from("user_management").select("*").order("display_name"),
      client.from("government_entities").select("id,name").order("name"),
    ]);
    if (r.error) {
      box.innerHTML = errorBox(r.error);
      return;
    }
    const users = r.data || [];
    const ids = users.map((x) => x.user_id).filter(Boolean);
    let ar = { data: [] };
    if (ids.length)
      ar = await client
        .from("user_entity_assignments")
        .select("user_id,government_entity_id")
        .in("user_id", ids);
    const amap = {};
    (ar.data || []).forEach((x) => {
      (amap[x.user_id] || (amap[x.user_id] = [])).push(x.government_entity_id);
    });
    window.__icvAdminUsers = users.map((x) =>
      Object.assign({}, x, { assigned_entity_ids: (amap[x.user_id] || []).join(",") }),
    );
    const ef = document.getElementById("usersEntityFilter");
    if (ef)
      ef.innerHTML =
        '<option value="">كل الجهات</option>' +
        (er.data || [])
          .map((e) => '<option value="' + escA(e.id) + '">' + escA(e.name) + "</option>")
          .join("");
    const count = document.getElementById("usersAdminCount");
    if (count) count.textContent = "إجمالي المستخدمين: " + window.__icvAdminUsers.length;
    if (!users.length) {
      box.innerHTML = '<div class="empty">لا يوجد مستخدمون.</div>';
      return;
    }
    box.innerHTML =
      '<div class="table-wrap"><table class="um-table"><thead><tr><th>المستخدم</th><th>الاسم</th><th>الدور</th><th>الحالة</th><th>الصلاحية</th><th>الجهات المسندة</th><th>بداية الصلاحية</th><th>نهاية الصلاحية</th><th>إجراءات</th></tr></thead><tbody>' +
      window.__icvAdminUsers
        .map((u) => {
          const initials = (u.display_name || u.username || "?")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((x) => x[0])
            .join("");
          return (
            '<tr data-user-row data-role="' +
            escA(u.role || "") +
            '" data-active="' +
            (u.is_active ? "1" : "0") +
            '" data-name="' +
            escA(u.display_name || "") +
            '" data-entities="' +
            escA(u.assigned_entity_ids || "") +
            '"><td><div class="um-user"><span class="um-avatar">' +
            escA(initials) +
            "</span><div><b>" +
            escA(u.username || "—") +
            "</b><small>حساب مستخدم</small></div></div></td><td><b>" +
            escA(u.display_name || "—") +
            '</b></td><td><span class="um-badge role-' +
            escA(u.role || "viewer") +
            '">' +
            escA(roleName(u.role)) +
            '</span></td><td><span class="um-badge ' +
            (u.is_active ? "active" : "inactive") +
            '">' +
            (u.is_active ? "فعال" : "غير فعال") +
            "</span></td><td>" +
            escA(accessStatusText(u)) +
            '</td><td><span class="um-entity-count">' +
            Number(u.assigned_entities || 0) +
            "</span></td><td>" +
            escA(u.access_starts_at ? new Date(u.access_starts_at).toLocaleDateString("ar-OM") : "بدون حد") +
            "</td><td>" +
            escA(
              u.access_expires_at ? new Date(u.access_expires_at).toLocaleDateString("ar-OM") : "بدون نهاية",
            ) +
            '</td><td><div class="um-actions"><button class="icon-btn" title="الملف الشخصي" onclick="openUserProfile(\'' +
            u.user_id +
            '\')">👤</button><button class="icon-btn" title="تعديل" onclick="openUserFormById(\'' +
            u.user_id +
            '\')">✎</button><button class="icon-btn" title="الجهات" onclick="openEntityAssignment(\'' +
            u.user_id +
            "','" +
            escA(u.display_name || u.username) +
            "')\">🏛</button></div></td></tr>"
          );
        })
        .join("") +
      "</tbody></table></div>";
    filterAdminUsers();
  };
  function accessStatusText(u) {
    const problem = window.ICV.accessProblem(u);
    if (!problem)
      return u.access_expires_at ? "سارية حتى " + window.ICV.formatDate(u.access_expires_at) : "سارية";
    if (!u.is_active) return "معطّل";
    if (u.access_expires_at && new Date(u.access_expires_at) < new Date()) return "منتهية";
    return "لم تبدأ";
  }
  window.filterAdminUsers = () => {
    const q = (document.getElementById("usersSearch")?.value || "").trim().toLowerCase(),
      n = (document.getElementById("usersNameFilter")?.value || "").trim().toLowerCase(),
      role = document.getElementById("usersRoleFilter")?.value || "",
      status = document.getElementById("usersStatusFilter")?.value || "",
      entity = document.getElementById("usersEntityFilter")?.value || "";
    let shown = 0;
    document.querySelectorAll("#usersAdminBox [data-user-row]").forEach((row) => {
      const hit = !q || row.textContent.toLowerCase().includes(q),
        nhit = !n || row.dataset.name.toLowerCase().includes(n),
        rhit = !role || row.dataset.role === role,
        shit = !status || (status === "active" ? row.dataset.active === "1" : row.dataset.active !== "1"),
        ehit = !entity || row.dataset.entities.split(",").includes(entity);
      row.style.display = hit && nhit && rhit && shit && ehit ? "" : "none";
      if (hit && nhit && rhit && shit && ehit) shown++;
    });
    const cc = document.getElementById("usersAdminCount");
    if (cc)
      cc.textContent = "المستخدمون المعروضون: " + shown + " من " + (window.__icvAdminUsers || []).length;
  };
  window.openUserFormById = async (uid) => {
    const r = await client.from("user_management").select("*").eq("user_id", uid).maybeSingle();
    if (r.error || !r.data) return errorA(r.error || "تعذر تحميل المستخدم");
    openUserForm(r.data);
  };
  window.openUserForm = function (user) {
    const edit = !!user;
    document.getElementById("accessUserModal")?.remove();
    const d = document.createElement("div");
    d.id = "accessUserModal";
    d.className = "modal";
    d.innerHTML =
      '<div class="modal-card"><div class="modal-head"><div><h2>' +
      (edit ? "تعديل مستخدم" : "إضافة مستخدم") +
      '</h2><div class="muted">' +
      (edit ? "تعديل الدور وفترة الصلاحية" : "إنشاء حساب جديد بنفس آلية المنصة السابقة") +
      '</div></div><button class="close" onclick="this.closest(\'.modal\').remove()">×</button></div><div class="form-grid"><div class="field"><label>اسم المستخدم</label><input id="au_username" ' +
      (edit ? "disabled" : "") +
      ' value="' +
      escA(user?.username || "") +
      '"></div><div class="field"><label>اسم الموظف</label><input id="au_name" value="' +
      escA(user?.display_name || "") +
      '"></div>' +
      (edit
        ? ""
        : '<div class="field"><label>كلمة المرور</label><input id="au_password" type="password" minlength="8"></div>') +
      '<div class="field"><label>الدور</label><select id="au_role" onchange="window.icvSyncExpiryRequired()">' +
      window.ICV.ROLE_ORDER.map((r) => '<option value="' + r + '">' + escA(roleName(r)) + "</option>").join(
        "",
      ) +
      '</select></div><div class="field"><label>بداية الصلاحية</label><input id="au_start" type="datetime-local"></div><div class="field"><label id="au_end_label">نهاية الصلاحية</label><input id="au_end" type="datetime-local"></div>' +
      (edit
        ? '<div class="field full"><label><input id="au_active" type="checkbox"> الحساب نشط</label></div>'
        : "") +
      '</div><div id="accessUserMsg"></div><button class="btn primary" style="width:auto" onclick="saveAccessUser(\'' +
      (user?.user_id || "") +
      "')\">" +
      (edit ? "حفظ التعديلات" : "إنشاء المستخدم") +
      "</button></div>";
    document.body.appendChild(d);
    if (user) {
      document.getElementById("au_role").value = user.role || "viewer";
      document.getElementById("au_start").value = window.ICV.toLocalInput(user.access_starts_at);
      document.getElementById("au_end").value = window.ICV.toLocalInput(user.access_expires_at);
      document.getElementById("au_active").checked = user.is_active !== false;
    }
    window.icvSyncExpiryRequired();
  };
  // A temporary viewer must have an end date; the account stops at that date and reopens if it is extended.
  window.icvSyncExpiryRequired = () => {
    const temp = document.getElementById("au_role")?.value === "temporary_viewer",
      label = document.getElementById("au_end_label"),
      end = document.getElementById("au_end");
    if (label) label.textContent = temp ? "نهاية الصلاحية (إلزامية للمشاهد المؤقت)" : "نهاية الصلاحية";
    if (end) end.required = temp;
  };
  window.saveAccessUser = async (uid) => {
    const role = document.getElementById("au_role").value,
      start = document.getElementById("au_start").value || null,
      end = document.getElementById("au_end").value || null,
      msg = document.getElementById("accessUserMsg");
    if (role === "temporary_viewer" && !end) {
      msg.innerHTML = '<div class="bad">حدد تاريخ نهاية الصلاحية للمشاهد المؤقت.</div>';
      return;
    }
    if (start && end && new Date(end) <= new Date(start)) {
      msg.innerHTML = '<div class="bad">نهاية الصلاحية يجب أن تكون بعد البداية.</div>';
      return;
    }
    const body = uid
      ? {
          action: "update",
          user_id: uid,
          display_name: document.getElementById("au_name").value.trim(),
          role,
          is_active: document.getElementById("au_active").checked,
          access_starts_at: window.ICV.fromLocalInput(start),
          access_expires_at: window.ICV.fromLocalInput(end),
        }
      : {
          action: "create",
          username: document.getElementById("au_username").value.trim(),
          password: document.getElementById("au_password").value,
          display_name: document.getElementById("au_name").value.trim(),
          role,
          access_starts_at: window.ICV.fromLocalInput(start),
          access_expires_at: window.ICV.fromLocalInput(end),
        };
    msg.textContent = "جاري الحفظ...";
    const r = await client.functions.invoke("manage-platform-user", { body });
    if (r.error || r.data?.error) {
      // A non-2xx reply carries the server's Arabic message in its body.
      let text = r.data?.error;
      if (!text && r.error?.context?.json) text = (await r.error.context.json().catch(() => null))?.error;
      msg.innerHTML = errorBox(text || r.error);
      return;
    }
    msg.innerHTML = '<div class="ok">تم الحفظ بنجاح</div>';
    await window.loadUsersAdmin();
    setTimeout(() => document.getElementById("accessUserModal")?.remove(), 500);
  };
  window.openEntityAssignment = async (uid, name) => {
    const [e, a] = await Promise.all([
      client.from("government_entities").select("id,name,code").order("name"),
      client.from("user_entity_assignments_view").select("government_entity_id").eq("user_id", uid),
    ]);
    if (e.error || a.error) return errorA(e.error || a.error);
    const selected = new Set((a.data || []).map((x) => x.government_entity_id));
    const d = document.createElement("div");
    d.id = "accessEntityModal";
    d.className = "modal";
    d.innerHTML =
      '<div class="modal-card"><div class="modal-head"><div><h2>تحديد الجهات</h2><div class="muted">الموظف: ' +
      escA(name) +
      '</div></div><button class="close" onclick="this.closest(\'.modal\').remove()">×</button></div><div class="actions" style="margin:14px 0"><button class="btn" onclick="document.querySelectorAll(\'#accessEntityChecklist input\').forEach(x=>x.checked=true)">تحديد الكل</button><button class="btn" onclick="document.querySelectorAll(\'#accessEntityChecklist input\').forEach(x=>x.checked=false)">إلغاء الكل</button><input id="accessEntitySearch" class="search" style="flex:1" placeholder="بحث..." oninput="filterAccessEntities()"></div><div id="accessEntityChecklist" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;max-height:55vh;overflow:auto">' +
      (e.data || [])
        .map(
          (x) =>
            '<label class="card access-entity-item" style="padding:10px;cursor:pointer"><input type="checkbox" value="' +
            x.id +
            '" ' +
            (selected.has(x.id) ? "checked" : "") +
            "> " +
            escA(x.name) +
            (x.code ? ' <small class="muted">(' + escA(x.code) + ")</small>" : "") +
            "</label>",
        )
        .join("") +
      '</div><div id="accessEntityMsg"></div><button class="btn primary" style="width:auto;margin-top:14px" onclick="saveAccessEntityAssignment(\'' +
      uid +
      "')\">حفظ الجهات</button></div>";
    document.body.appendChild(d);
  };
  window.filterAccessEntities = () => {
    const q = (document.getElementById("accessEntitySearch")?.value || "").toLowerCase();
    document
      .querySelectorAll(".access-entity-item")
      .forEach((x) => (x.style.display = x.textContent.toLowerCase().includes(q) ? "block" : "none"));
  };
  window.saveAccessEntityAssignment = async (uid) => {
    const ids = [...document.querySelectorAll("#accessEntityChecklist input:checked")].map((x) => x.value),
      m = document.getElementById("accessEntityMsg");
    const r = await client.rpc("set_user_entity_assignments", { p_user_id: uid, p_entity_ids: ids });
    if (r.error) {
      m.innerHTML = errorBox(r.error);
      return;
    }
    document.getElementById("accessEntityModal")?.remove();
    await loadUsersAdmin();
    toastA("تم حفظ الجهات");
  };

  window.openUserProfile = async function (uid) {
    const [u, a] = await Promise.all([
      client.from("user_management").select("*").eq("user_id", uid).maybeSingle(),
      client.from("user_entity_assignments_view").select("*").eq("user_id", uid).order("government_entity"),
    ]);
    if (u.error || !u.data) return errorA(u.error || "تعذر تحميل ملف الموظف");
    const user = u.data,
      assigned = a.data || [],
      ids = [...new Set(assigned.map((x) => x.government_entity_id).filter(Boolean))];
    const p = ids.length
      ? await client.from("projects").select(PROJECT_FIELDS).in("government_entity_id", ids)
      : { data: [] };
    const projects = p.data || [];
    const rr = projects.length
      ? await client
          .from("quarterly_reports")
          .select("project_id,quarter,annual_period,status")
          .in(
            "project_id",
            projects.map((x) => x.id),
          )
      : { data: [] };
    const now = new Date(),
      three = new Date(now);
    three.setMonth(three.getMonth() + 3);
    const { missing, due, label: alertPeriod } = reportAlerts(projects, rr.data || [], now);
    const endingList = projects.filter(
        (x) => x.end_date && new Date(x.end_date) >= now && new Date(x.end_date) <= three,
      ),
      failing = projects.filter((x) => x.compliance_status === "غير مستوفي"),
      stalled = projects.filter((x) => x.project_status === "متعثر"),
      noPlan = projects.filter((x) => !x.local_content_plan);
    const initials = (user.display_name || user.username || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0])
      .join("");
    window.icvOpenUserProject = (id) => {
      document.getElementById("accessUserProfileModal")?.remove();
      window.openMyProject(id);
    };
    const alert = (x, danger, title, detail) =>
      '<div class="um-alert' +
      (danger ? " danger" : "") +
      '" onclick="window.icvOpenUserProject(\'' +
      escA(x.id) +
      "')\"><b>" +
      escA(title) +
      " — " +
      escA(x.project_name) +
      "</b><small>" +
      escA(detail) +
      "</small></div>";
    const failedCriteria = (x) =>
      CRITERIA.filter((c) => x[c.key] === "غير مستوفي")
        .map((c) => c.label)
        .join("، ");
    const alerts =
      missing
        .slice(0, 5)
        .map((x) => alert(x.p, true, "تقرير متأخر", alertPeriod + " · متأخر " + x.days + " يوم"))
        .join("") +
      due
        .slice(0, 5)
        .map((x) => alert(x.p, false, "تقرير مستحق", alertPeriod + " · متبقي " + x.days + " يوم"))
        .join("") +
      failing
        .slice(0, 5)
        .map((x) => alert(x, true, "غير مستوفي", "المعايير غير المستوفاة: " + failedCriteria(x)))
        .join("") +
      endingList
        .slice(0, 5)
        .map((x) =>
          alert(x, false, "ينتهي خلال 3 أشهر", "تاريخ الانتهاء: " + window.ICV.formatDate(x.end_date)),
        )
        .join("") +
      stalled
        .slice(0, 5)
        .map((x) => alert(x, true, "مشروع متعثر", "يحتاج متابعة مباشرة"))
        .join("") +
      noPlan
        .slice(0, 5)
        .map((x) => alert(x, false, "لا توجد خطة محتوى محلي", "اضغط لفتح صفحة المشروع"))
        .join("");
    document.getElementById("accessUserProfileModal")?.remove();
    const d = document.createElement("div");
    d.id = "accessUserProfileModal";
    d.className = "modal";
    d.innerHTML =
      '<div class="modal-card um-profile-modal"><div class="um-profile-head"><button class="close" onclick="this.closest(\'.modal\').remove()">×</button><div class="um-profile-main"><div class="um-profile-avatar">' +
      escA(initials) +
      "</div><div><h2>" +
      escA(user.display_name || user.username || "المستخدم") +
      "</h2><div>" +
      escA(user.username || "—") +
      " · " +
      escA(roleName(user.role)) +
      " · " +
      escA(accessStatusText(user)) +
      '</div></div></div></div><div class="um-profile-body"><div class="um-profile-grid"><div class="card"><h3>الجهات المسندة</h3><div class="um-entity-list">' +
      (assigned.length
        ? assigned.map((x) => "<span>" + escA(x.government_entity || "—") + "</span>").join("")
        : "<em>لا توجد جهات مسندة</em>") +
      '</div></div><div class="card"><h3>ملخص المتابعة</h3><div class="um-metrics"><div><b>' +
      projects.length +
      "</b><small>مشاريع الجهات المسندة</small></div><div><b>" +
      missing.length +
      "</b><small>تقارير متأخرة (" +
      escA(alertPeriod) +
      ")</small></div><div><b>" +
      due.length +
      "</b><small>تقارير مستحقة قريبًا</small></div><div><b>" +
      failing.length +
      "</b><small>مشاريع غير مستوفية</small></div><div><b>" +
      endingList.length +
      "</b><small>تنتهي خلال 3 أشهر</small></div><div><b>" +
      stalled.length +
      '</b><small>مشاريع متعثرة</small></div></div></div></div><div class="card"><h3>التنبيهات التي تحتاج متابعة</h3><div class="um-alerts">' +
      (alerts || '<div class="um-alert-empty">لا توجد تنبيهات حالية.</div>') +
      '</div></div></div><div class="modal-foot"><button class="btn" onclick="this.closest(\'.modal\').remove()">إغلاق</button></div></div>';
    document.body.appendChild(d);
  };
  function injectUserManagementStyle() {
    if (document.getElementById("um-style")) return;
    const s = document.createElement("style");
    s.id = "um-style";
    s.textContent =
      ".um-wrap{min-width:0}.um-hero{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;background:linear-gradient(135deg,var(--primary2),var(--primary));color:#fff;border-radius:18px;padding:22px;margin-bottom:16px}.um-crumb{font-size:10px;opacity:.7;margin-bottom:5px}.um-hero h2{margin:0 0 5px;font-size:22px}.um-hero p{margin:0;opacity:.82;font-size:11px}.um-add{background:#fff!important;color:var(--primary2)!important;border-color:#fff!important}.um-filter-grid{display:grid;grid-template-columns:1.3fr 1.3fr 1fr 1fr 1.3fr;gap:10px}.um-table-panel{padding:0;overflow:hidden}.um-table-head{padding:16px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line)}.um-table-head h3{margin:0;font-size:15px}.um-table{width:100%;border-collapse:collapse}.um-table th,.um-table td{padding:12px 13px;border-bottom:1px solid var(--line);text-align:right;font-size:11px;white-space:nowrap}.um-table th{font-size:10px;color:var(--muted);background:#fafbfc}.um-user{display:flex;align-items:center;gap:9px}.um-user small{display:block;color:var(--muted);font-size:9px;margin-top:2px}.um-avatar{width:34px;height:34px;border-radius:9px;background:var(--soft);color:var(--primary2);display:grid;place-items:center;font-weight:900}.um-badge{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:800}.um-badge.active{background:#eaf7ef;color:#087443}.um-badge.inactive{background:#f1f3f5;color:#667085}.um-badge.role-admin{background:#eaf2ff;color:#245ea8}.um-badge.role-editor{background:#eaf7ef;color:#087443}.um-badge.role-viewer{background:#f1f3f5;color:#667085}.um-badge.role-temporary_viewer{background:#fff4e5;color:#b54708}.um-entity-count{display:inline-grid;place-items:center;min-width:27px;height:27px;border-radius:8px;background:var(--soft);color:var(--primary2);font-weight:900}.um-actions{display:flex;gap:4px}.icon-btn{border:1px solid var(--line);background:#fff;border-radius:7px;padding:6px 8px;cursor:pointer}.icon-btn:hover{background:var(--soft)}.um-profile-modal{width:min(980px,100%);overflow:hidden}.um-profile-head{background:linear-gradient(135deg,var(--primary2),var(--primary));color:#fff;padding:22px}.um-profile-head .close{float:left;background:rgba(255,255,255,.14);color:#fff;border:0;border-radius:8px;width:32px;height:32px}.um-profile-main{display:flex;align-items:center;gap:13px}.um-profile-avatar{width:60px;height:60px;border-radius:16px;background:#fff;color:var(--primary2);display:grid;place-items:center;font-size:22px;font-weight:900}.um-profile-main h2{margin:0 0 4px}.um-profile-main div:last-child{font-size:11px;opacity:.8}.um-profile-body{padding:18px;background:#f7f9fb}.um-profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}.um-profile-body .card{padding:15px}.um-profile-body h3{margin:0 0 12px;font-size:13px}.um-entity-list{display:flex;flex-wrap:wrap;gap:7px}.um-entity-list span{padding:7px 9px;border-radius:8px;background:var(--soft);color:var(--primary2);font-size:10px;font-weight:700}.um-entity-list em{color:var(--muted);font-size:11px}.um-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.um-metrics div{background:#f8fafc;border-radius:9px;padding:10px}.um-metrics b{display:block;font-size:19px;color:var(--primary2)}.um-metrics small{font-size:9px;color:var(--muted)}.um-alerts{display:grid;gap:7px}.um-alert{padding:10px;border:1px solid var(--line);border-right:4px solid #b54708;border-radius:9px;background:#fff;cursor:pointer}.um-alert.danger{border-right-color:#b42318}.um-alert b{display:block;font-size:11px}.um-alert small{display:block;color:var(--muted);font-size:9px;margin-top:3px}.um-alert-empty{text-align:center;color:var(--muted);padding:15px;font-size:11px}@media(max-width:1050px){.um-filter-grid{grid-template-columns:1fr 1fr}}@media(max-width:700px){.um-hero{display:block}.um-add{margin-top:14px}.um-filter-grid{grid-template-columns:1fr}.um-profile-grid{grid-template-columns:1fr}.um-metrics{grid-template-columns:1fr 1fr}}";
    document.head.appendChild(s);
  }
  injectUserManagementStyle();

  window.showPage = async function (name, btn) {
    ensurePageShell();
    if (name === "profile") {
      document.querySelectorAll('[id^="page-"]').forEach((x) => x.classList.add("hidden"));
      document.getElementById("page-profile")?.classList.remove("hidden");
      document.querySelectorAll(".nav button").forEach((x) => x.classList.remove("active"));
      btn?.classList.add("active");
      const t = document.getElementById("pageTitle");
      if (t) t.textContent = "ملفي الشخصي";
      await loadProfilePage();
      return;
    }
    if (name === "users") {
      if (profile?.role !== "admin") return;
      document.querySelectorAll('[id^="page-"]').forEach((x) => x.classList.add("hidden"));
      document.getElementById("page-users")?.classList.remove("hidden");
      document.querySelectorAll(".nav button").forEach((x) => x.classList.remove("active"));
      btn?.classList.add("active");
      const t = document.getElementById("pageTitle");
      if (t) t.textContent = "إدارة المستخدمين";
      await loadUsersAdmin();
      return;
    }
    if (name === "project") {
      const id = new URLSearchParams(location.search).get("project");
      if (id && typeof window.viewProject === "function") return window.viewProject(id);
    }
    document.querySelectorAll('[id^="page-"]').forEach((x) => x.classList.add("hidden"));
    const target = document.getElementById("page-" + name);
    if (target) target.classList.remove("hidden");
    document.querySelectorAll(".nav button").forEach((x) => x.classList.remove("active"));
    btn?.classList.add("active");
    const titles = {
      dashboard: "الصفحة الرئيسية",
      projects: "المشاريع",
      entities: "الجهات الحكومية",
      companies: "الشركات",
      reports: "التقارير الربع سنوية",
      plans: "خطط المحتوى المحلي",
      followups: "متابعة الموظفين",
      audit: "سجل التدقيق",
      "local-content": "المحتوى المحلي",
      settings: "الإعدادات",
    };
    const t = document.getElementById("pageTitle");
    if (t) t.textContent = titles[name] || name;
    if (name === "dashboard" && window.icvStructure?.renderDashboard)
      return window.icvStructure.renderDashboard();
    if (name === "projects" && window.icvStructure?.renderProjects)
      return window.icvStructure.renderProjects();
    if (name === "local-content" && window.icvStructure?.renderLocalContent)
      return window.icvStructure.renderLocalContent();
    if (name === "settings" && window.icvStructure?.renderSettings)
      return window.icvStructure.renderSettings();
    if (name === "entities" && typeof window.icvEntitiesPage === "function") return window.icvEntitiesPage();
    if (name === "companies" && typeof window.icvCompaniesPage === "function")
      return window.icvCompaniesPage();
  };
  async function init() {
    ensurePageShell();
    profile = await getProfile();
    if (profile && !valid(profile)) {
      // index.html shows the reason on the login screen.
      await client.auth.signOut();
      return;
    }
    if (profile) window.__icvProfile = profile;
    applyRoleUI();
  }
  window.addEventListener("load", () => setTimeout(init, 200));
})();
if (!document.getElementById("icv-profile-isolated")) {
  const s = document.createElement("style");
  s.id = "icv-profile-isolated";
  s.textContent =
    "#page-profile .profile-alerts-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}#page-profile .profile-box{background:#fff;border:1px solid #e4ebe7;border-radius:14px;padding:20px;box-shadow:0 4px 18px rgba(20,45,32,.06)}#page-profile .profile-box.full-profile-box{grid-column:1/-1}#page-profile .profile-box-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #edf1ee}#page-profile .profile-filters{display:flex;gap:6px;flex-wrap:wrap}#page-profile .profile-filters .btn{width:auto;padding:6px 11px;font-size:11px}#page-profile .profile-filters .btn.active{background:var(--primary);color:#fff}#page-profile .icv-profile-list .profile-alert:nth-child(n+6),#page-profile .profile-projects tbody tr:nth-child(n+6){display:none}#page-profile .icv-profile-list.expanded .profile-alert:nth-child(n+6),#page-profile .profile-projects.expanded tbody tr:nth-child(n+6){display:flex}#page-profile .profile-projects.expanded tbody tr:nth-child(n+6){display:table-row}#page-profile .show-all-btn{display:inline-flex;margin:13px auto 0;border:1px solid #d8e4dd;background:#f8fbf9;color:var(--primary);border-radius:9px;padding:8px 18px;font-size:12px;font-weight:800;cursor:pointer}#page-profile .profile-alert{display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #eef2ef;min-height:58px}#page-profile .profile-alert>div{flex:1}#page-profile .alert-icon{width:34px;height:34px;border-radius:9px;display:grid;place-items:center;font-size:11px;font-weight:800;flex:none}#page-profile .alert-icon.red{background:#fff0f0;color:#c62828}#page-profile .alert-icon.orange{background:#fff6e8;color:#b76b00}#page-profile .link-btn{border:1px solid #dce7e0;border-radius:8px;padding:7px 10px;background:#fff;color:var(--primary);font-weight:800;cursor:pointer}#page-profile .profile-projects{border:1px solid #edf1ee;border-radius:10px;overflow:auto}#page-profile .profile-projects table{width:100%;border-collapse:collapse}#page-profile .profile-projects th,#page-profile .profile-projects td{padding:11px 9px;border-bottom:1px solid #eef2ef;text-align:right;white-space:nowrap;font-size:11px}#page-profile .table-link{border:0;background:none;color:var(--primary);font-weight:800;cursor:pointer;font:inherit}@media(max-width:900px){#page-profile .profile-alerts-grid{grid-template-columns:1fr}#page-profile .profile-box.full-profile-box{grid-column:auto}}";
  document.head.appendChild(s);
}

(() => {
  if (document.getElementById("icv-profile-v2-style")) return;
  const s = document.createElement("style");
  s.id = "icv-profile-v2-style";
  s.textContent = `
#page-profile .profile-page{padding:0 0 12px}

/* Profile readability: increase typography only within the profile page */
#page-profile .profile-page-head p{font-size:15px}
#page-profile .profile-scope-badge{font-size:13px}
#page-profile .profile-user-card h3{font-size:24px}
#page-profile .profile-user-meta{font-size:15px}
#page-profile .profile-active-badge{font-size:13px}
#page-profile .profile-entities-head b{font-size:16px}
#page-profile .profile-entity-name-link{display:inline-flex;align-items:center;gap:7px;appearance:none;border:1px solid rgba(255,255,255,.24);background:rgba(255,255,255,.11);color:#fff;border-radius:10px;padding:8px 11px;font:inherit;font-size:11px;font-weight:700;text-align:right;cursor:pointer;text-decoration:none;white-space:normal}#page-profile .profile-entity-name-link:hover{background:rgba(255,255,255,.2)}#page-profile .profile-entity-dot{font-size:10px;color:#9be4c2}#page-profile .profile-entity-name-link{appearance:none;border:0;background:transparent;padding:0;margin:0;color:inherit;font:inherit;font-weight:800;text-align:right;cursor:pointer;text-decoration:underline;text-decoration-color:transparent;text-underline-offset:4px}#page-profile .profile-entity-name-link:hover{text-decoration-color:currentColor}#page-profile .profile-entity{font-size:14px}
#page-profile .profile-kpis>.card .label{font-size:15px}
#page-profile .profile-kpis>.card .value{font-size:32px}
#page-profile .profile-card-head h3{font-size:17px}
#page-profile .profile-muted{font-size:13px}
#page-profile .profile-filter button{font-size:13px}
#page-profile .profile-row-main strong{font-size:15px;line-height:1.7}
#page-profile .profile-row-main span{font-size:14px;line-height:1.8}
#page-profile .profile-open{font-size:13px}
#page-profile .profile-icon{font-size:13px}
#page-profile .profile-table{font-size:14px}
#page-profile .profile-table th,#page-profile .profile-table td{font-size:14px;padding:14px 16px}
#page-profile .profile-table th{font-size:13px}
#page-profile .profile-status{font-size:13px}
#page-profile .profile-task,#page-profile .profile-activity{font-size:14px}
#page-profile .profile-task .profile-row-main strong{font-size:15px}
#page-profile .profile-task small,#page-profile .profile-activity small{font-size:13px;line-height:1.8}
#page-profile .profile-security h3{font-size:17px}
#page-profile .profile-security p{font-size:14px;line-height:1.9}
#page-profile .profile-show-all{font-size:13px;padding:9px 14px}
#page-profile .profile-empty{font-size:14px;line-height:1.9}
#page-profile .profile-compliance-top{font-size:14px}
#page-profile .profile-compliance-item small{font-size:13px;line-height:1.8}
@media(max-width:700px){
 #page-profile .profile-grid{grid-template-columns:minmax(0,1fr)}
 #page-profile .profile-compliance-grid{grid-template-columns:minmax(0,1fr)}
 #page-profile .profile-row{align-items:flex-start;flex-wrap:wrap}
 #page-profile .profile-open{white-space:nowrap}
}
#page-profile .profile-page-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px;padding:0 2px}
#page-profile .profile-page-head p{margin:0;color:var(--muted);font-size:12px}
#page-profile .profile-scope-badge{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;background:var(--soft);color:var(--primary2);border:1px solid var(--line);border-radius:999px;padding:7px 11px;font-size:10px;font-weight:800}
#page-profile .profile-user-card{position:relative;isolation:isolate;overflow:hidden;background:linear-gradient(115deg,var(--primary2),var(--primary));color:#fff;border:0;border-radius:20px;padding:23px 25px;box-shadow:0 12px 30px rgba(15,118,110,.16)}
#page-profile .profile-user-card:after{content:"";position:absolute;z-index:-1;width:270px;height:270px;left:-70px;top:-175px;border:1px solid rgba(255,255,255,.15);border-radius:50%;box-shadow:0 0 0 28px rgba(255,255,255,.05),0 0 0 58px rgba(255,255,255,.035)}
#page-profile .profiletop,#page-profile .profile-entities{position:relative;z-index:1}
#page-profile .profile-avatar{width:72px;height:72px;border-radius:19px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.32);color:#fff;font-size:26px}
#page-profile .profile-user-card h3{color:#fff;font-size:20px}
#page-profile .profile-user-meta{color:rgba(255,255,255,.78);font-size:11px}
#page-profile .profile-active-badge{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:10px}
#page-profile .profile-entities{border-top:1px solid rgba(255,255,255,.2);margin-top:20px;padding-top:16px}
#page-profile .profile-entities-head b{color:#fff;font-size:12px}
#page-profile #profileEntitiesBtn{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.32);color:#fff}
#page-profile .profile-entity-list{gap:8px}
#page-profile .profile-entity{background:rgba(255,255,255,.11);border-color:rgba(255,255,255,.24);color:#fff;border-radius:10px;padding:8px 11px;font-size:11px}
#page-profile .profile-kpis{gap:13px;margin:0 0 18px}
#page-profile .profile-kpis>.card{position:relative;overflow:hidden;border:1px solid var(--line);border-top:3px solid var(--primary);border-radius:15px;padding:16px 18px;box-shadow:0 6px 22px rgba(15,23,42,.045);min-width:0}
#page-profile .profile-kpis>.card:after{content:"";position:absolute;left:-17px;bottom:-23px;width:70px;height:70px;border-radius:50%;background:var(--soft);opacity:.7}
#page-profile .profile-kpis>.card .label{font-size:11px;color:var(--muted);position:relative;z-index:1}
#page-profile .profile-kpis>.card .value{font-size:29px;font-weight:800;margin:7px 0 2px;position:relative;z-index:1;color:var(--ink)}
#page-profile .profile-kpis>.card .value.green{color:#16a34a}
#page-profile .profile-kpis>.card .value.orange{color:#d97706}
#page-profile .profile-kpis>.card .value.red{color:#dc2626}
#page-profile #accessProfileAlerts{display:grid;gap:17px}
#page-profile .profile-grid{gap:17px;align-items:start}
#page-profile .profile-card{border-color:var(--line);border-radius:16px;box-shadow:0 7px 24px rgba(15,23,42,.045)}
#page-profile .profile-card-head{padding:16px 18px;border-bottom:1px solid var(--line);gap:10px}
#page-profile .profile-card-head h3{font-size:13px;font-weight:800}
#page-profile .profile-muted{font-size:10px}
#page-profile .profile-filter{padding:11px 16px;border-color:var(--line)}
#page-profile .profile-filter button{font-size:10px;border-color:var(--line);border-radius:9px;padding:7px 11px;color:var(--muted)}
#page-profile .profile-filter button.active{background:var(--primary);border-color:var(--primary);color:#fff}
#page-profile .profile-row{gap:10px;padding:13px 16px;border-color:#edf1f5;transition:background .15s}
#page-profile .profile-row:hover{background:#fbfdfc}
#page-profile .profile-icon{width:36px;height:36px;border-radius:11px;background:#fff0f0;color:#dc2626;font-size:11px}
#page-profile .profile-icon.orange{background:#fff5e4;color:#a96508}
#page-profile .profile-row-main strong{font-size:11px}
#page-profile .profile-row-main span{font-size:10px;color:var(--muted);line-height:1.7}
#page-profile .profile-open{color:var(--primary);font-size:10px}
#page-profile .profile-table-wrap{overflow:auto}
#page-profile .profile-table{min-width:540px;font-size:11px}
#page-profile .profile-table th,#page-profile .profile-table td{padding:12px 14px;border-color:#edf1f5}
#page-profile .profile-table th{background:#f8fafc;color:#667085;font-size:10px}
#page-profile .profile-status{font-size:10px;border-radius:8px}
#page-profile .profile-task-wrap,#page-profile .profile-activity-wrap{padding:4px 17px}
#page-profile .profile-task,#page-profile .profile-activity{padding:12px 0;border-color:#edf1f5;font-size:11px}
#page-profile .profile-check{border-radius:6px}
#page-profile .profile-task.done .profile-check{background:var(--primary);border-color:var(--primary)}
#page-profile .profile-task .profile-row-main strong{font-size:11px}
#page-profile .profile-task small,#page-profile .profile-activity small{font-size:10px;line-height:1.7}
#page-profile .profile-security{border-color:var(--line);border-radius:15px;box-shadow:0 7px 24px rgba(15,23,42,.045);padding:17px 19px}
#page-profile .profile-security h3{font-size:13px}
#page-profile .profile-security p{font-size:10px;line-height:1.8}
#page-profile .profile-show-all{color:var(--primary);border-color:var(--line);border-radius:9px;font-size:10px}
#page-profile .profile-empty{font-size:11px;color:var(--muted);line-height:1.8}
#page-profile .profile-compliance-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;padding:16px 18px 18px}
#page-profile .profile-compliance-item{min-width:0;border:1px solid var(--line);background:#fbfcfd;border-radius:12px;padding:13px}
#page-profile .profile-compliance-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;font-size:10px;line-height:1.7;margin-bottom:9px}
#page-profile .profile-compliance-top b{white-space:nowrap;color:var(--primary);font-size:10px}
#page-profile .profile-compliance-track{height:7px;background:#e9eef2;border-radius:99px;overflow:hidden}
#page-profile .profile-compliance-track i{display:block;height:100%;background:var(--primary);border-radius:99px}
#page-profile .profile-compliance-item small{display:block;color:var(--muted);font-size:9px;line-height:1.7;margin-top:8px}
@media(max-width:900px){#page-profile .profile-compliance-grid{grid-template-columns:1fr}#page-profile .profile-grid{grid-template-columns:1fr}#page-profile .profile-card.full{grid-column:auto}}
@media(max-width:600px){#page-profile .profile-page-head{align-items:flex-start;flex-direction:column}#page-profile .profile-user-card{padding:18px}#page-profile .profiletop{align-items:flex-start}#page-profile .profile-avatar{width:60px;height:60px}#page-profile .profile-kpis{grid-template-columns:1fr 1fr;gap:9px}#page-profile .profile-kpis>.card{padding:13px}#page-profile .profile-kpis>.card .value{font-size:24px}#page-profile .profile-entities-head{align-items:flex-start;flex-direction:column}#page-profile .profile-security{align-items:flex-start;flex-direction:column;gap:12px}#page-profile .profile-row{align-items:flex-start}#page-profile .profile-open{font-size:9px}}
`;
  document.head.appendChild(s);
})();
