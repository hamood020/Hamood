/* Internal SQL Server API client. Opt-in for the isolated migration branch only.
 * This module does not contact Supabase and is not enabled on the published main branch.
 */
(() => {
  "use strict";
  if (window.ICVApi) return;
  const base = "/api";
  let csrf = null;
  async function token() {
    if (csrf) return csrf;
    const r = await fetch(base + "/security/csrf", { credentials: "same-origin", headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error("تعذر تهيئة حماية الطلبات");
    const data = await r.json();
    csrf = data.token;
    return csrf;
  }
  async function request(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
    if (options.body !== undefined) headers.set("Content-Type", "application/json");
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) headers.set("X-CSRF-TOKEN", await token());
    const response = await fetch(base + path, {
      ...options, method, headers, credentials: "same-origin",
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    if (response.status === 204) return null;
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401) window.dispatchEvent(new CustomEvent("icv:session-expired"));
      const error = new Error(payload?.error || payload?.title || "تعذر تنفيذ الطلب");
      error.status = response.status; error.details = payload;
      throw error;
    }
    return payload;
  }
  const id = value => encodeURIComponent(String(value));
  const projectRow = x => x && ({
    ...x, serial_no:x.serialNo, government_entity_id:x.governmentEntityId,
    project_name:x.projectName, tender_type:x.tenderType, project_status:x.projectStatus,
    consultant:x.consultant, implementing_company_id:x.implementingCompanyId,
    work_sector:x.workSector, total_project_value:x.totalProjectValue,
    start_date:x.startDate, end_date:x.endDate, original_end_date:x.originalEndDate,
    local_content_plan:x.localContentPlan, created_at:x.createdAt, updated_at:x.updatedAt,
    total_spend:x.totalSpend, total_local_content:x.totalLocalContent, sme_pct:x.smePct,
    goods_pct:x.goodsPct, services_pct:x.servicesPct, omanization_pct:x.omanizationPct,
    omanization_status:x.omanizationStatus, made_in_oman_status:x.madeInOmanStatus,
    services_status:x.servicesStatus, sme_10_status:x.sme10Status, compliance_status:x.complianceStatus
  });
  const reportRow = x => x && ({
    ...x, project_id:x.projectId, annual_period:x.annualPeriod, source_file:x.sourceFile,
    report_data:typeof x.reportData === "string" ? JSON.parse(x.reportData) : x.reportData,
    submitted_at:x.submittedAt, reviewed_at:x.reviewedAt, created_at:x.createdAt, created_by:x.createdBy
  });
  window.ICVApi = Object.freeze({
    auth: {
      login: (username, password) => request("/auth/login", { method: "POST", body: { username, password } }),
      me: () => request("/auth/me"),
      logout: () => request("/auth/logout", { method: "POST" }),
      changePassword: (currentPassword, newPassword) => request("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } })
    },
    projects: {
      list: async params => { const x=await request("/projects" + (params ? "?" + new URLSearchParams(params) : "")); return {...x,items:(x.items||[]).map(projectRow)}; },
      get: async projectId => projectRow(await request("/projects/" + id(projectId))),
      create: async data => projectRow(await request("/projects", { method: "POST", body: data })),
      update: async (projectId, data) => projectRow(await request("/projects/" + id(projectId), { method: "PUT", body: data })),
      reports: async projectId => (await request("/projects/" + id(projectId) + "/reports")).map(reportRow),
      createReport: async (projectId, data) => reportRow(await request("/projects/" + id(projectId) + "/reports", { method: "POST", body: data }))
    },
    reports: {
      submit: reportId => request("/reports/" + id(reportId) + "/submit", { method: "POST" }),
      approve: reportId => request("/reports/" + id(reportId) + "/approve", { method: "POST" })
    }
  });
})();
