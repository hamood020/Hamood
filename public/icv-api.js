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
  window.ICVApi = Object.freeze({
    auth: {
      login: (username, password) => request("/auth/login", { method: "POST", body: { username, password } }),
      me: () => request("/auth/me"),
      logout: () => request("/auth/logout", { method: "POST" }),
      changePassword: (currentPassword, newPassword) => request("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } })
    },
    projects: {
      list: params => request("/projects" + (params ? "?" + new URLSearchParams(params) : "")),
      get: projectId => request("/projects/" + id(projectId)),
      create: data => request("/projects", { method: "POST", body: data }),
      update: (projectId, data) => request("/projects/" + id(projectId), { method: "PUT", body: data }),
      reports: projectId => request("/projects/" + id(projectId) + "/reports"),
      createReport: (projectId, data) => request("/projects/" + id(projectId) + "/reports", { method: "POST", body: data })
    },
    reports: {
      submit: reportId => request("/reports/" + id(reportId) + "/submit", { method: "POST" }),
      approve: reportId => request("/reports/" + id(reportId) + "/approve", { method: "POST" })
    }
  });
})();
