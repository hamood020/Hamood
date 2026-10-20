/* Shared helpers used by every page: roles, account validity, escaping, user messages. */
(function () {
  "use strict";

  // Display names come from Settings > Users (settings.users.roleLabels); these are the defaults.
  const DEFAULT_ROLE_LABELS = {
    admin: "مدير النظام",
    section_head: "رئيس قسم",
    editor: "أخصائي دعم ومتابعة",
    viewer: "مشاهد",
    temporary_viewer: "مشاهد مؤقت",
  };
  const ROLE_ORDER = ["admin", "section_head", "editor", "viewer", "temporary_viewer"];
  // Roles that may add and edit projects, reports and plans.
  const STAFF_ROLES = ["admin", "section_head", "editor"];

  let roleLabels = { ...DEFAULT_ROLE_LABELS };

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  }

  function roleLabel(role) {
    return roleLabels[role] || DEFAULT_ROLE_LABELS[role] || roleLabels.viewer;
  }

  function setRoleLabels(labels) {
    roleLabels = { ...DEFAULT_ROLE_LABELS };
    Object.keys(labels || {}).forEach((k) => {
      const v = String(labels[k] || "").trim();
      if (DEFAULT_ROLE_LABELS[k] && v) roleLabels[k] = v;
    });
  }

  function canEdit(profile) {
    return STAFF_ROLES.includes(profile?.role);
  }

  // Formats a date the way Omani users read it (day/month/year).
  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("en-GB");
  }

  // Returns null when the account may use the platform, otherwise a message explaining why not.
  function accessProblem(profile) {
    if (!profile) return "تعذر تحميل صلاحيات الحساب.";
    const now = Date.now();
    if (profile.is_active !== true) return "الحساب معطّل. تواصل مع مدير النظام.";
    if (profile.access_starts_at && new Date(profile.access_starts_at).getTime() > now)
      return "تبدأ صلاحية حسابك في " + formatDate(profile.access_starts_at) + ".";
    if (profile.access_expires_at && new Date(profile.access_expires_at).getTime() < now)
      return (
        "انتهت صلاحية حسابك في " +
        formatDate(profile.access_expires_at) +
        ". يعود الحساب للعمل فور تمديد الصلاحية من مدير النظام."
      );
    return null;
  }

  // datetime-local inputs work in local time; the database stores UTC.
  function toLocalInput(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }
  function fromLocalInput(value) {
    return value ? new Date(value).toISOString() : null;
  }

  function showMessage(text, kind) {
    let el = document.getElementById("icvMessage");
    if (!el) {
      el = document.createElement("div");
      el.id = "icvMessage";
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      document.body.appendChild(el);
    }
    el.className = "icv-message " + (kind === "error" ? "is-error" : "is-success");
    el.textContent = (kind === "error" ? "" : "✓ ") + text;
    el.hidden = false;
    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => (el.hidden = true), kind === "error" ? 6000 : 3000);
  }

  // Turns database errors into messages a user can act on.
  function friendlyError(e) {
    const msg = String(e?.message || e || "");
    if (e?.code === "23505" || /duplicate key/i.test(msg)) return "هذا السجل موجود مسبقًا.";
    if (/REPORT_LOCKED/.test(msg)) return "هذا التقرير معتمد ومقفل. يعيد مدير النظام فتحه عند الحاجة.";
    if (/EXPIRY_REQUIRED/.test(msg)) return "حدد تاريخ نهاية الصلاحية للمشاهد المؤقت.";
    if (/row-level security|permission denied|ACCESS_DENIED|غير مصرح/i.test(msg))
      return "لا تملك صلاحية تنفيذ هذا الإجراء.";
    if (/Invalid login credentials/i.test(msg)) return "اسم المستخدم أو كلمة المرور غير صحيحة.";
    if (/Failed to fetch|NetworkError/i.test(msg))
      return "تعذر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى.";
    return msg || "حدث خطأ غير متوقع.";
  }

  const style = document.createElement("style");
  style.textContent =
    ".icv-message{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:100000;max-width:min(560px,calc(100vw - 32px));padding:12px 18px;border-radius:12px;font-weight:700;font-size:14px;box-shadow:0 10px 30px rgba(0,0,0,.15);direction:rtl}" +
    ".icv-message.is-success{background:#eaf8ef;color:#087443;border:1px solid #b7e4c7}" +
    ".icv-message.is-error{background:#fff1f1;color:#b42318;border:1px solid #f5c2c0}";
  document.head.appendChild(style);

  window.ICV = {
    ROLE_ORDER,
    STAFF_ROLES,
    DEFAULT_ROLE_LABELS,
    escapeHtml,
    roleLabel,
    setRoleLabels,
    canEdit,
    formatDate,
    accessProblem,
    toLocalInput,
    fromLocalInput,
    showMessage,
    friendlyError,
  };
  // Success messages used throughout the pages.
  window.icvSaveSuccess = (text) => showMessage(text || "تم الحفظ بنجاح.", "success");
  window.icvShowError = (e) => showMessage(friendlyError(e), "error");
})();
