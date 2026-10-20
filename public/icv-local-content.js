/* Local content analytics page («المحتوى المحلي»).
 * Every figure comes from the database: project metrics are computed there from approved reports
 * and the platform settings (see recompute_project_metrics); the quarterly trend replays the same
 * rules over the approved reports already loaded by the page and is checked against the stored totals.
 */
(function () {
  "use strict";

  const PAGE_ID = "page-local-content";
  const PAGE_SIZE = 10;
  const NEAR_POINTS = { om: 2, sme: 2, goods: 5, srv: 2 };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const isEn = () => window.ICVLanguage?.get?.() === "en";
  const T = (ar, en) => (isEn() ? en : ar);
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const money = (v) => Math.round(num(v)).toLocaleString("en-US");
  const pct = (v) => (v == null || !Number.isFinite(v) ? "—" : v.toFixed(1) + "%");
  const cur = () => T("ر.ع", "OMR");
  const compact = (v) => {
    const a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toFixed(1) + T("م", "M");
    if (a >= 1e3) return (v / 1e3).toFixed(0) + T("ألف", "K");
    return String(Math.round(v));
  };

  const OK = "مستوفي",
    BAD = "غير مستوفي",
    NA = "غير منطبق";
  const statusText = (s) =>
    s === OK ? T("مستوفي", "Compliant") : s === BAD ? T("غير مستوفي", "Non-compliant") : T("بلا تقارير معتمدة", "No approved reports");
  const statusChip = (s) =>
    '<span class="lc-chip ' + (s === OK ? "ok" : s === BAD ? "bad" : "na") + '">' + statusText(s) + "</span>";

  // Settings published by settings-page.js (same values the database uses).
  function settings() {
    const cfg = window.__icvCalculationSettings || {};
    const c = cfg.coefficients || {},
      t = cfg.thresholds || {};
    const k = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
    const th = (v, d) => {
      const n = Number(v);
      if (!Number.isFinite(n)) return d;
      return n > 0 && n <= 1 ? n * 100 : n;
    };
    return {
      k: {
        om: k(c.omaniSalary, 0.8),
        fo: k(c.foreignSalary, 0.2),
        mio: k(c.madeInOman, 0.7),
        ls: k(c.localSupplier, 0.18),
        di: k(c.directImport, 0.06),
        sp: k(c.smePurchase, 0.18),
        lsv: k(c.localService, 0.7),
        fsv: k(c.foreignService, 0.1),
        ssv: k(c.smeService, 0.7),
        sl: k(c.subcontractLocal ?? c.smeSubcontract, 0.7),
        sf: k(c.subcontractForeign, 0.1),
        ss: k(c.smeSubcontract, 0.7),
      },
      th: {
        om: th(t.omanization, 30),
        sme: th(t.sme, 10),
        goods: th(t.goods, 40),
        srv: th(t.services, 10),
      },
    };
  }

  // The twelve spending components and where the database stores each one.
  const COMPONENTS = [
    { key: "om", col: "actual_omani_salary", group: "wages", ar: "رواتب العمانيين", en: "Omani wages" },
    { key: "fo", col: "actual_non_omani_salary", group: "wages", ar: "رواتب الأجانب", en: "Expatriate wages" },
    { key: "mio", col: "actual_made_in_oman", group: "goods", ar: "صنع في عُمان", en: "Made in Oman" },
    { key: "ls", col: "actual_local_supplier", group: "goods", ar: "مورد محلي", en: "Local supplier" },
    { key: "di", col: "actual_direct_import", group: "goods", ar: "استيراد مباشر", en: "Direct import" },
    { key: "sp", col: "actual_sme_supplier", group: "goods", ar: "مورد SME", en: "SME supplier" },
    { key: "lsv", col: "actual_local_service", group: "services", ar: "خدمات محلية", en: "Local services" },
    { key: "fsv", col: "actual_foreign_service", group: "services", ar: "خدمات أجنبية", en: "Foreign services" },
    { key: "ssv", col: "actual_sme_service", group: "services", ar: "خدمات SME", en: "SME services" },
    { key: "sl", col: "actual_subcontract_local", group: "subs", ar: "باطن محلي", en: "Local subcontracts" },
    { key: "sf", col: "actual_subcontract_foreign", group: "subs", ar: "باطن أجنبي", en: "Foreign subcontracts" },
    { key: "ss", col: "actual_subcontract_sme", group: "subs", ar: "باطن SME", en: "SME subcontracts" },
  ];
  const GROUPS = [
    { key: "wages", ar: "الرواتب", en: "Wages", color: "var(--primary)" },
    { key: "goods", ar: "المشتريات", en: "Purchases", color: "#3b82a0" },
    { key: "services", ar: "الخدمات", en: "Services", color: "#d9a441" },
    { key: "subs", ar: "عقود الباطن", en: "Subcontracts", color: "#7c6fb0" },
  ];
  const CRITERIA = [
    { key: "om", pct: "omanization_pct", status: "omanization_status", ar: "التعمين", en: "Omanization" },
    { key: "sme", pct: "sme_pct", status: "sme_10_status", ar: "المؤسسات الصغيرة والمتوسطة", en: "SMEs" },
    { key: "goods", pct: "goods_pct", status: "made_in_oman_status", ar: "السلع (صنع في عُمان)", en: "Goods (Made in Oman)" },
    { key: "srv", pct: "services_pct", status: "services_status", ar: "الخدمات", en: "Services" },
  ];

  const pctOrNull = (v) => (v == null || v === "" ? null : Number(v));
  const critValue = (p, c) => ((p[c.status] || NA) === NA ? null : pctOrNull(p[c.pct]));
  const entityName = (p) => p.government_entities?.name || T("بدون جهة", "No entity");
  const companyName = (p) => p.companies?.name || T("بدون شركة", "No company");
  const sectorName = (p) => (p.work_sector || "").trim() || T("بدون قطاع", "No sector");

  // ---------------------------------------------------------------------------
  // State (filters survive re-renders triggered by other pages)
  // ---------------------------------------------------------------------------
  const state = { entity: "", sector: "", company: "", status: "", dist: "entity", sortKey: "lc", sortDir: -1, showAll: false };

  function scopedProjects() {
    const all = window.icvApplyFollowupScope ? window.icvApplyFollowupScope(window.projects || []) : window.projects || [];
    return all.filter(
      (p) =>
        (!state.entity || String(p.government_entity_id) === state.entity) &&
        (!state.sector || sectorName(p) === state.sector) &&
        (!state.company || String(p.implementing_company_id) === state.company) &&
        (!state.status || (p.compliance_status || NA) === state.status),
    );
  }

  // ---------------------------------------------------------------------------
  // Calculations on stored values
  // ---------------------------------------------------------------------------
  function portfolio(list, cfg) {
    const comp = {};
    COMPONENTS.forEach((c) => (comp[c.key] = list.reduce((s, p) => s + num(p[c.col]), 0)));
    const spend = list.reduce((s, p) => s + num(p.total_spend), 0);
    const lc = list.reduce((s, p) => s + num(p.total_local_content), 0);
    const value = list.reduce((s, p) => s + num(p.total_project_value), 0);
    // Criteria on the portfolio, same definitions as per project, over projects with approved reports.
    const rep = list.filter((p) => (p.compliance_status || NA) !== NA);
    const sum = (arr, f) => arr.reduce((s, p) => s + f(p), 0);
    const repValue = sum(rep, (p) => num(p.total_project_value));
    const om = sum(rep, (p) => num(p.current_omani)),
      fo = sum(rep, (p) => num(p.non_omani));
    const purch = sum(rep, (p) => num(p.actual_made_in_oman) + num(p.actual_local_supplier) + num(p.actual_direct_import) + num(p.actual_sme_supplier));
    const crit = {
      om: om + fo > 0 ? (om / (om + fo)) * 100 : null,
      sme: repValue > 0 ? (sum(rep, (p) => num(p.actual_subcontract_sme) + num(p.actual_sme_service)) / repValue) * 100 : null,
      goods: purch > 0 ? (sum(rep, (p) => num(p.actual_made_in_oman)) / purch) * 100 : null,
      srv: repValue > 0 ? (sum(rep, (p) => num(p.actual_local_service) + num(p.actual_foreign_service) + num(p.actual_sme_service)) / repValue) * 100 : null,
    };
    const lcComp = {};
    COMPONENTS.forEach((c) => (lcComp[c.key] = comp[c.key] * cfg.k[c.key]));
    return { comp, lcComp, spend, lc, value, crit, withReports: rep.length };
  }

  // Replays approved reports per quarter with the database rules: a cumulative report replaces the
  // running totals, a separate report adds to them; wages follow their own cumulative flag.
  function trend(list, cfg) {
    const ids = new Set(list.map((p) => p.id));
    const qn = (q) => Number(String(q || "").replace(/\D/g, "")) || 0;
    const byProject = {};
    (window.reports || [])
      .filter((r) => ids.has(r.project_id) && String(r.status || "").trim() === "معتمد")
      .forEach((r) => (byProject[r.project_id] = byProject[r.project_id] || []).push(r));
    const series = {}; // project -> [{period, spend, lc}]
    const periods = new Set();
    Object.entries(byProject).forEach(([pid, rows]) => {
      rows.sort(
        (a, b) =>
          num(a.annual_period) - num(b.annual_period) ||
          qn(a.quarter) - qn(b.quarter) ||
          String(a.created_at || "").localeCompare(String(b.created_at || "")),
      );
      const v = { om: 0, fo: 0, mio: 0, ls: 0, di: 0, sp: 0, lsv: 0, fsv: 0, ssv: 0, sl: 0, sf: 0, ss: 0 };
      series[pid] = rows.map((r) => {
        const d = r.report_data || {};
        const g = (o, k) => num(o?.[k]);
        const salCum = String(d.salary_input_type || "").includes("تراكمية");
        const cum = String(d.report_type || "").includes("تراكمي");
        const add = (k, x, replace) => (v[k] = replace ? x : v[k] + x);
        add("om", g(d, "omani_salary"), salCum);
        add("fo", g(d, "foreign_salary"), salCum);
        add("mio", g(d.purchases, "made_in_oman"), cum);
        add("ls", g(d.purchases, "local_supplier"), cum);
        add("di", g(d.purchases, "direct_import"), cum);
        add("sp", g(d.purchases, "sme_purchase"), cum);
        add("lsv", g(d.services, "local_service"), cum);
        add("fsv", g(d.services, "foreign_service"), cum);
        add("ssv", g(d.services, "sme_service"), cum);
        add("sl", g(d.subcontracts, "local"), cum);
        add("sf", g(d.subcontracts, "foreign"), cum);
        add("ss", g(d.subcontracts, "sme"), cum);
        const spend = Object.values(v).reduce((s, x) => s + x, 0);
        const lc = Object.keys(v).reduce((s, k) => s + v[k] * cfg.k[k], 0);
        const period = num(r.annual_period) * 10 + qn(r.quarter);
        periods.add(period);
        return { period, spend, lc };
      });
    });
    // Consistency check with the database: the last point must equal the stored totals.
    list.forEach((p) => {
      const s = series[p.id];
      if (s?.length && Math.abs(s[s.length - 1].lc - num(p.total_local_content)) > 1)
        console.warn("[local content] trend differs from stored total for", p.project_name);
    });
    const sorted = [...periods].sort((a, b) => a - b);
    return sorted.map((period) => {
      let spend = 0,
        lc = 0;
      Object.values(series).forEach((rows) => {
        let last = null;
        rows.forEach((x) => {
          if (x.period <= period) last = x;
        });
        if (last) {
          spend += last.spend;
          lc += last.lc;
        }
      });
      return { label: "Q" + (period % 10) + " " + Math.floor(period / 10), spend, lc };
    });
  }

  // Full project plan by group (wages, purchases, services, subcontracts).
  function planTotals(project) {
    const plan = (window.plans || [])
      .filter((x) => x.project_id === project.id)
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))[0];
    if (!plan) return null;
    const d = plan.plan_data || {};
    const rows = (a) => (Array.isArray(a) ? a.reduce((s, x) => s + num(x?.value), 0) : 0);
    const sal = d.workforce?.salaries || {};
    const wages = Object.values(sal).reduce((s, x) => s + num(x?.omani_salary) + num(x?.foreign_salary), 0);
    const t = { wages, goods: rows(d.purchases), services: rows(d.services), subs: rows(d.subcontracts) };
    return t.wages + t.goods + t.services + t.subs > 0 ? t : null;
  }
  const actualGroups = (p) => ({
    wages: num(p.actual_omani_salary) + num(p.actual_non_omani_salary),
    goods: num(p.actual_made_in_oman) + num(p.actual_local_supplier) + num(p.actual_direct_import) + num(p.actual_sme_supplier),
    services: num(p.actual_local_service) + num(p.actual_foreign_service) + num(p.actual_sme_service),
    subs: num(p.actual_subcontract_local) + num(p.actual_subcontract_foreign) + num(p.actual_subcontract_sme),
  });

  // What a project still needs to reach a threshold (approximate, for follow-up).
  function needed(p, c, th) {
    const gap = (th - num(p[c.pct])) / 100;
    if (c.key === "sme" || c.key === "srv")
      return T("نحو ", "About ") + money(gap * num(p.total_project_value)) + " " + cur() + T(" إضافية", " more");
    if (c.key === "goods") {
      const purch = num(p.actual_made_in_oman) + num(p.actual_local_supplier) + num(p.actual_direct_import) + num(p.actual_sme_supplier);
      return T("نحو ", "About ") + money((gap * purch) / (1 - th / 100)) + " " + cur() + T(" مشتريات صنع في عُمان", " of Made-in-Oman purchases");
    }
    const om = num(p.current_omani),
      tot = om + num(p.non_omani);
    const n = Math.max(1, Math.ceil(((th / 100) * tot - om) / (1 - th / 100)));
    return n + T(" عماني إضافي تقريباً", " more Omani staff (approx.)");
  }

  // ---------------------------------------------------------------------------
  // Charts (inline SVG, colours from the theme variables)
  // ---------------------------------------------------------------------------
  function groupedBars(rows) {
    if (!rows.length) return "";
    const W = 440,
      H = 260,
      side = 46,
      pt = 24,
      pb = 34;
    const rtl = !isEn();
    const max = Math.max(1, ...rows.flatMap((r) => [r.plan, r.actual])) * 1.12;
    const plotL = rtl ? 6 : side,
      plotR = rtl ? W - side : W - 6;
    const bw = (plotR - plotL) / rows.length;
    const x = (i) => (rtl ? plotR - (i + 1) * bw : plotL + i * bw);
    const y = (v) => pt + (H - pt - pb) * (1 - v / max);
    let s = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" aria-label="' + T("الخطة مقابل الفعلي", "Plan vs actual") + '">';
    for (let i = 0; i <= 4; i++) {
      const v = (max * i) / 4,
        yy = y(v);
      s += '<line x1="' + plotL + '" x2="' + plotR + '" y1="' + yy + '" y2="' + yy + '" stroke="var(--line)"/>';
      s += '<text x="' + (rtl ? plotR + 6 : plotL - 6) + '" y="' + (yy + 4) + '" font-size="11" fill="var(--muted)" text-anchor="' + (rtl ? "start" : "end") + '">' + compact(v) + "</text>";
    }
    rows.forEach((r, i) => {
      const w = bw * 0.3,
        x0 = x(i) + bw * 0.18;
      const a = rtl ? x0 + w + 4 : x0,
        b = rtl ? x0 : x0 + w + 4; // plan bar first in reading order
      const ratio = r.plan > 0 ? Math.round((r.actual / r.plan) * 100) : null;
      s += '<rect x="' + a + '" y="' + y(r.plan) + '" width="' + w + '" height="' + (y(0) - y(r.plan)) + '" rx="4" style="fill:#c9d6df"><title>' + T("الخطة", "Plan") + ": " + money(r.plan) + "</title></rect>";
      s += '<rect x="' + b + '" y="' + y(r.actual) + '" width="' + w + '" height="' + (y(0) - y(r.actual)) + '" rx="4" style="fill:var(--primary)"><title>' + T("الفعلي", "Actual") + ": " + money(r.actual) + "</title></rect>";
      if (ratio != null)
        s += '<text x="' + (x0 + w + 2) + '" y="' + (Math.min(y(r.actual), y(r.plan)) - 6) + '" font-size="13" font-weight="700" text-anchor="middle" fill="var(--ink)">' + ratio + "%</text>";
      s += '<text x="' + (x0 + w + 2) + '" y="' + (H - 12) + '" font-size="13" text-anchor="middle" fill="var(--ink)">' + esc(r.label) + "</text>";
    });
    return s + "</svg>";
  }

  function trendChart(points) {
    const W = 900,
      H = 260,
      pl = 56,
      pr = 50,
      pt = 22,
      pb = 34;
    const max = Math.max(1, ...points.map((p) => p.lc)) * 1.12;
    const n = points.length,
      bw = (W - pl - pr) / n;
    const x = (i) => pl + (i + 0.5) * bw,
      y = (v) => pt + (H - pt - pb) * (1 - v / max),
      y2 = (v) => pt + (H - pt - pb) * (1 - v / 100);
    let s = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" aria-label="' + T("الاتجاه عبر الأرباع", "Quarterly trend") + '">';
    for (let i = 0; i <= 4; i++) {
      const v = (max * i) / 4;
      s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="var(--line)"/>';
      s += '<text x="' + (pl - 8) + '" y="' + (y(v) + 4) + '" font-size="11" fill="var(--muted)" text-anchor="end">' + compact(v) + "</text>";
      s += '<text x="' + (W - pr + 8) + '" y="' + (y2(i * 25) + 4) + '" font-size="11" fill="#b58a2c">' + i * 25 + "%</text>";
    }
    const bar = Math.min(bw * 0.56, 90);
    points.forEach((p, i) => {
      s += '<rect x="' + (x(i) - bar / 2) + '" y="' + y(p.lc) + '" width="' + bar + '" height="' + (y(0) - y(p.lc)) + '" rx="4" style="fill:#c9d6df"><title>' + p.label + ": " + money(p.lc) + " " + cur() + "</title></rect>";
      s += '<text x="' + x(i) + '" y="' + (H - 10) + '" font-size="12" text-anchor="middle" fill="var(--ink)">' + p.label + "</text>";
    });
    const pts = points.map((p, i) => (p.spend > 0 ? [x(i), y2((p.lc / p.spend) * 100), (p.lc / p.spend) * 100, p.label] : null)).filter(Boolean);
    if (pts.length > 1) s += '<polyline points="' + pts.map((q) => q[0] + "," + q[1]).join(" ") + '" fill="none" stroke="#d9a441" stroke-width="3"/>';
    pts.forEach((q) => {
      s += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="4.5" fill="#fff" stroke="#d9a441" stroke-width="2.5"><title>' + q[3] + ": " + q[2].toFixed(1) + "%</title></circle>";
    });
    const last = pts[pts.length - 1];
    if (last) s += '<text x="' + last[0] + '" y="' + (last[1] - 12) + '" font-size="12" font-weight="700" text-anchor="middle" fill="#8a6414">' + last[2].toFixed(1) + "%</text>";
    return s + "</svg>";
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  function section(num_, title, sub, body, caption, extra) {
    return (
      '<section class="panel lc-section">' +
      '<div class="lc-head"><div><h2><span class="lc-num">' + num_ + "</span>" + title + "</h2>" +
      (sub ? '<div class="desc">' + sub + "</div>" : "") +
      "</div>" + (extra || "") + "</div>" +
      body +
      (caption ? '<p class="lc-caption">' + caption + "</p>" : "") +
      "</section>"
    );
  }
  const options = (pairs, selected, allLabel) =>
    '<option value="">' + allLabel + "</option>" +
    pairs
      .sort((a, b) => String(a[1]).localeCompare(String(b[1]), "ar"))
      .map((x) => '<option value="' + esc(x[0]) + '"' + (String(x[0]) === selected ? " selected" : "") + ">" + esc(x[1]) + "</option>")
      .join("");

  function render() {
    const root = document.getElementById(PAGE_ID);
    if (!root) return;
    injectStyle();
    const cfg = settings();
    const all = window.icvApplyFollowupScope ? window.icvApplyFollowupScope(window.projects || []) : window.projects || [];
    const list = scopedProjects();
    const P = portfolio(list, cfg);
    const role = window.__icvProfile?.role;
    const canScope = role !== "admin" && (window.icvFollowupEntityIds || []).length > 0;
    const uniq = (f) => [...new Map(all.map((p) => f(p)).filter((x) => x[0])).entries()];

    // Filters
    let html =
      '<div class="panel lc-hero"><div class="toolbar"><div><h2>' + T("المحتوى المحلي", "Local Content") + '</h2><div class="muted">' +
      T("من أين يأتي المحتوى المحلي، ومدى الالتزام بالمعايير، وأين الفجوات — من التقارير المعتمدة فقط.", "Where local content comes from, how projects meet the criteria, and where the gaps are — approved reports only.") +
      "</div></div>" +
      (canScope
        ? '<label class="muted lc-scope"><input type="checkbox" ' + (window.icvFollowupOnly ? "checked" : "") + ' onchange="icvSetFollowupScope(this.checked)"> ' + T("جهات المتابعة فقط", "My entities only") + "</label>"
        : "") +
      '</div><div class="lc-filters">' +
      '<div class="field"><label for="lcEntity">' + T("الجهة الحكومية", "Government entity") + '</label><select id="lcEntity">' + options(uniq((p) => [String(p.government_entity_id || ""), entityName(p)]), state.entity, T("كل الجهات", "All entities")) + "</select></div>" +
      '<div class="field"><label for="lcSector">' + T("القطاع", "Sector") + '</label><select id="lcSector">' + options(uniq((p) => [sectorName(p), sectorName(p)]), state.sector, T("كل القطاعات", "All sectors")) + "</select></div>" +
      '<div class="field"><label for="lcCompany">' + T("الشركة المنفذة", "Implementing company") + '</label><select id="lcCompany">' + options(uniq((p) => [String(p.implementing_company_id || ""), companyName(p)]), state.company, T("كل الشركات", "All companies")) + "</select></div>" +
      '<div class="field"><label for="lcStatus">' + T("حالة الالتزام", "Compliance") + '</label><select id="lcStatus">' +
      [["", T("الكل", "All")], [OK, statusText(OK)], [BAD, statusText(BAD)], [NA, statusText(NA)]]
        .map((x) => '<option value="' + x[0] + '"' + (x[0] === state.status ? " selected" : "") + ">" + x[1] + "</option>")
        .join("") +
      "</select></div></div></div>";

    if (!list.length) {
      root.innerHTML = html + '<div class="panel lc-empty">' + T("لا توجد مشاريع ضمن الفلاتر المختارة.", "No projects match the selected filters.") + "</div>";
      bind(root);
      return;
    }

    // 1. Portfolio indicators
    const statusCount = (s) => list.filter((p) => (p.compliance_status || NA) === s).length;
    const kpis =
      '<div class="cards lc-kpis">' +
      [
        [T("إجمالي الصرف", "Total expenditure"), money(P.spend) + " " + cur(), T("من التقارير المعتمدة", "From approved reports")],
        [T("إجمالي المحتوى المحلي", "Total local content"), money(P.lc) + " " + cur(), T("حسب معاملات الإعدادات", "Using the settings coefficients")],
        [T("المحتوى المحلي / الصرف", "Local content / expenditure"), pct(P.spend ? (P.lc / P.spend) * 100 : null), T("كم بقي محلياً من كل ريال مصروف", "Share of each rial spent that stayed local")],
        [T("المحتوى المحلي / قيمة المشاريع", "Local content / project value"), pct(P.value ? (P.lc / P.value) * 100 : null), money(P.value) + " " + cur() + T(" قيمة المشاريع", " project value")],
      ]
        .map((k) => '<div class="card"><div class="label">' + k[0] + '</div><div class="value">' + k[1] + '</div><div class="sub">' + k[2] + "</div></div>")
        .join("") +
      "</div>";
    const crit =
      '<div class="lc-criteria">' +
      CRITERIA.map((c) => {
        const v = P.crit[c.key],
          th = cfg.th[c.key];
        const st = v == null ? NA : v >= th ? OK : BAD;
        const max = Math.max(th * 2, v || 0, 1);
        return (
          '<div class="lc-crit"><div class="lc-crit-top"><b>' + T(c.ar, c.en) + "</b>" + statusChip(st) + '</div><div class="lc-crit-val">' + pct(v) + "</div>" +
          '<div class="lc-gauge" title="' + T("الحد", "Threshold") + " " + th + '%"><i class="' + (st === OK ? "ok" : st === BAD ? "bad" : "na") + '" style="width:' + (v == null ? 0 : Math.min(100, (v / max) * 100)) + '%"></i><em style="inset-inline-start:' + (th / max) * 100 + '%"></em></div>' +
          '<small class="lc-sub">' + T("الحد", "Threshold") + " " + th + "%</small></div>"
        );
      }).join("") +
      "</div>";
    const counts =
      '<div class="lc-counts">' +
      '<span class="lc-chip ok">' + statusCount(OK) + " " + T("مستوفي", "compliant") + "</span>" +
      '<span class="lc-chip bad">' + statusCount(BAD) + " " + T("غير مستوفي", "non-compliant") + "</span>" +
      '<span class="lc-chip na">' + statusCount(NA) + " " + T("بلا تقارير معتمدة", "without approved reports") + "</span></div>";
    html += section(
      1,
      T("مؤشرات المحفظة", "Portfolio indicators"),
      list.length + " " + T("مشروع", "projects"),
      kpis + crit + counts,
      T(
        "البطاقات العلوية مجموع المشاريع المعروضة. المعايير الأربعة محسوبة على مجموع المشاريع التي لها تقارير معتمدة بنفس تعريف كل مشروع: التعمين = العمانيون ÷ إجمالي العمالة، SME = عقود باطن SME + خدمات SME ÷ القيمة، السلع = صنع في عُمان ÷ المشتريات، الخدمات = الخدمات ÷ القيمة. الخط على كل مقياس هو الحد من الإعدادات.",
        "Top cards add up the listed projects. The four criteria are calculated across projects with approved reports using the same definitions as each project: Omanization = Omanis ÷ workforce, SME = SME subcontracts + SME services ÷ value, Goods = Made in Oman ÷ purchases, Services = services ÷ value. The mark on each gauge is the threshold from Settings.",
      ),
    );

    // 2. Components
    const maxSpend = Math.max(1, ...Object.values(P.comp));
    let lastGroup = "";
    const bars = COMPONENTS.map((c) => {
      const sp = P.comp[c.key],
        lc = P.lcComp[c.key];
      const g = GROUPS.find((x) => x.key === c.group);
      const head = c.group !== lastGroup ? '<div class="lc-bar-group">' + T(g.ar, g.en) + "</div>" : "";
      lastGroup = c.group;
      return (
        head +
        '<div class="lc-bar-row"><span>' + T(c.ar, c.en) + ' <span class="lc-sub">(' + Math.round(cfg.k[c.key] * 100) + '%)</span></span>' +
        '<div class="lc-track" title="' + T("الصرف", "Spend") + " " + money(sp) + " · " + T("محتوى محلي", "Local content") + " " + money(lc) + '"><span class="lc-spend" style="width:' + (sp / maxSpend) * 100 + '%"></span><span class="lc-lc" style="width:' + (lc / maxSpend) * 100 + '%"></span></div>' +
        '<span class="lc-amt"><b>' + money(lc) + "</b> / " + money(sp) + "</span></div>"
      );
    }).join("");
    const groupLc = GROUPS.map((g) => ({ ...g, v: COMPONENTS.filter((c) => c.group === g.key).reduce((s, c) => s + P.lcComp[c.key], 0) }));
    const lcSum = groupLc.reduce((s, g) => s + g.v, 0) || 1;
    const share =
      '<div class="lc-stack lc-stack-big">' + groupLc.map((g) => '<span style="width:' + (g.v / lcSum) * 100 + "%;background:" + g.color + '" title="' + T(g.ar, g.en) + '"></span>').join("") + "</div>" +
      groupLc
        .slice()
        .sort((a, b) => b.v - a.v)
        .map((g) => '<div class="lc-share-row"><span><i style="background:' + g.color + '"></i>' + T(g.ar, g.en) + "</span><b>" + ((g.v / lcSum) * 100).toFixed(1) + '%</b><small class="lc-sub">' + money(g.v) + " " + cur() + "</small></div>")
        .join("");
    html +=
      '<div class="lc-grid">' +
      section(
        2,
        T("من أين يأتي المحتوى المحلي", "Where local content comes from"),
        T("الصرف الفعلي لكل مكوّن، والجزء المحسوب منه محتوى محلياً.", "Actual spend per component and the part counted as local content."),
        '<div class="lc-bars">' + bars + '</div><div class="lc-legend"><span><i style="background:#d9e3ea"></i>' + T("الصرف", "Spend") + '</span><span><i style="background:var(--primary)"></i>' + T("المحتوى المحلي", "Local content") + "</span></div>",
        T(
          "كل صف مكوّن من مكونات الصرف في التقارير المعتمدة. الشريط الفاتح هو المصروف، والداكن هو الجزء المحسوب محتوى محلياً، والنسبة بين القوسين معامل الإعدادات لذلك المكوّن. الرقم على اليسار: المحتوى المحلي / الصرف بالريال.",
          "Each row is a spending component from approved reports. The light bar is the amount spent, the dark bar is the part counted as local content, and the percentage in brackets is that component's coefficient in Settings. Figures: local content / spend in rials.",
        ),
      ) +
      section(
        "",
        T("حصة كل مجموعة", "Share by group"),
        T("نسبة كل مجموعة من إجمالي المحتوى المحلي.", "Each group's share of total local content."),
        '<div class="lc-share">' + share + "</div>",
        T(
          "يوضح أي مجموعة تصنع معظم المحتوى المحلي. المجموعة ذات الحصة الصغيرة رغم صرفها الكبير في القسم 2 هي أوضح فرصة للتحسين.",
          "Shows which group produces most of the local content. A group with a small share despite large spend in section 2 is the clearest improvement opportunity.",
        ),
      ) +
      "</div>";

    // 3. Compliance per criterion  +  4. Plan vs actual
    const critStack = CRITERIA.map((c) => {
      const s = list.map((p) => p[c.status] || NA);
      const ok = s.filter((x) => x === OK).length,
        bad = s.filter((x) => x === BAD).length,
        na = s.length - ok - bad,
        all_ = s.length || 1;
      const seg = (v, cls) => (v ? '<span class="' + cls + '" style="width:' + (v / all_) * 100 + '%">' + v + "</span>" : "");
      return (
        '<div class="lc-crit-row"><div><b>' + T(c.ar, c.en) + '</b><span class="lc-sub">' + ok + " " + T("من", "of") + " " + (ok + bad) + " " + T("منطبق", "applicable") + " · " + T("الحد", "threshold") + " " + cfg.th[c.key] + "%</span></div>" +
        '<div class="lc-stack">' + seg(ok, "ok") + seg(bad, "bad") + seg(na, "na") + "</div></div>"
      );
    }).join("");
    const withPlan = list.map((p) => ({ p, plan: planTotals(p) })).filter((x) => x.plan);
    const pv = { wages: 0, goods: 0, services: 0, subs: 0 },
      av = { wages: 0, goods: 0, services: 0, subs: 0 };
    withPlan.forEach(({ p, plan }) => {
      const a = actualGroups(p);
      Object.keys(pv).forEach((k) => {
        pv[k] += plan[k];
        av[k] += a[k];
      });
    });
    const planBody = withPlan.length
      ? '<div class="lc-svg">' + groupedBars(GROUPS.map((g) => ({ label: T(g.ar, g.en), plan: pv[g.key], actual: av[g.key] }))) + '</div><div class="lc-legend"><span><i style="background:#c9d6df"></i>' + T("الخطة", "Plan") + '</span><span><i style="background:var(--primary)"></i>' + T("الفعلي حتى الآن", "Actual to date") + "</span></div>"
      : '<div class="lc-empty">' + T("لا توجد مشاريع لها خطة محتوى محلي ضمن الفلاتر.", "No projects with a local content plan match the filters.") + "</div>";
    html +=
      '<div class="lc-grid">' +
      section(
        3,
        T("الالتزام حسب المعيار", "Compliance by criterion"),
        T("عدد المشاريع التي تحقق كل معيار.", "Number of projects meeting each criterion."),
        '<div class="lc-crit-stack">' + critStack + '</div><div class="lc-legend"><span><i class="ok"></i>' + T("مستوفي", "Compliant") + '</span><span><i class="bad"></i>' + T("غير مستوفي", "Non-compliant") + '</span><span><i class="na"></i>' + T("غير منطبق", "Not applicable") + "</span></div>",
        T(
          "لكل معيار: الأخضر مشاريع حققت الحد، والأحمر لم تحققه، والرمادي مشاريع لا ينطبق عليها المعيار (لا توجد تقارير معتمدة أو لا توجد بيانات لهذا المعيار). الحالات محسوبة في قاعدة البيانات لكل مشروع.",
          "Per criterion: green projects meet the threshold, red do not, grey are not applicable (no approved reports or no data for that criterion). Statuses are calculated per project in the database.",
        ),
      ) +
      section(
        4,
        T("الخطة مقابل الفعلي", "Plan vs actual"),
        withPlan.length + " " + T("من", "of") + " " + list.length + " " + T("لها خطة", "have a plan"),
        planBody,
        T(
          "يقارن الخطة الكاملة للمشاريع التي لها خطة محتوى محلي بما صُرف فعلياً حتى الآن من التقارير المعتمدة. النسبة فوق كل مجموعة = الفعلي ÷ الخطة، فتعكس مقدار ما نُفّذ من الخطة وليس الالتزام بالمعايير.",
          "Compares the full plan of projects that have a local content plan with actual spend to date from approved reports. The percentage above each group = actual ÷ plan: progress against the plan, not compliance.",
        ),
      ) +
      "</div>";

    // 5. Trend
    const tr = trend(list, cfg);
    html += section(
      5,
      T("الاتجاه عبر الأرباع", "Quarterly trend"),
      T("المحتوى المحلي المتراكم ونسبته من الصرف.", "Cumulative local content and its share of spend."),
      tr.length
        ? '<div class="lc-svg">' + trendChart(tr) + '</div><div class="lc-legend"><span><i style="background:#c9d6df"></i>' + T("المحتوى المحلي المتراكم", "Cumulative local content") + " (" + cur() + ')</span><span><i style="background:#d9a441"></i>' + T("المحتوى المحلي / الصرف", "Local content / spend") + " (%)</span></div>"
        : '<div class="lc-empty">' + T("لا توجد تقارير معتمدة ضمن الفلاتر.", "No approved reports match the filters.") + "</div>",
      T(
        "الأعمدة: المحتوى المحلي المتراكم لكل المشاريع المعروضة في نهاية كل ربع (المحور الأيسر). الخط: نسبة المحتوى المحلي من الصرف المتراكم (المحور الأيمن). يُحسب من التقارير المعتمدة بنفس قواعد قاعدة البيانات، وآخر نقطة تساوي إجمالي الصفحة. الزمن من اليسار إلى اليمين.",
        "Bars: cumulative local content of the listed projects at the end of each quarter (left axis). Line: local content as a share of cumulative spend (right axis). Calculated from approved reports with the database rules; the last point equals the page total. Time runs left to right.",
      ),
    );

    // 6. Distribution  +  7. Near threshold
    const keyOf = { entity: entityName, company: companyName, sector: sectorName }[state.dist];
    const map = {};
    list.forEach((p) => {
      const k = keyOf(p);
      const r = (map[k] = map[k] || { n: k, count: 0, value: 0, lc: 0, spend: 0, ok: 0, bad: 0 });
      r.count++;
      r.value += num(p.total_project_value);
      r.lc += num(p.total_local_content);
      r.spend += num(p.total_spend);
      if (p.compliance_status === OK) r.ok++;
      if (p.compliance_status === BAD) r.bad++;
    });
    const distRows = Object.values(map)
      .sort((a, b) => b.lc - a.lc)
      .map((r) => "<tr><td>" + esc(r.n) + '</td><td class="lc-n">' + r.count + '</td><td class="lc-n">' + money(r.value) + '</td><td class="lc-n">' + money(r.lc) + '</td><td class="lc-n">' + pct(r.spend ? (r.lc / r.spend) * 100 : null) + '</td><td class="lc-n ok">' + r.ok + '</td><td class="lc-n bad">' + r.bad + "</td></tr>")
      .join("");
    const tabs = [["entity", T("حسب الجهة", "By entity")], ["company", T("حسب الشركة", "By company")], ["sector", T("حسب القطاع", "By sector")]]
      .map((t) => '<button type="button" class="btn' + (state.dist === t[0] ? " primary" : "") + '" data-lc-dist="' + t[0] + '">' + t[1] + "</button>")
      .join("");
    const near = [];
    list.forEach((p) =>
      CRITERIA.forEach((c) => {
        const v = pctOrNull(p[c.pct]),
          th = cfg.th[c.key];
        if (p[c.status] === BAD && v != null && th - v <= NEAR_POINTS[c.key]) near.push({ p, c, v, th });
      }),
    );
    const nearHtml = near.length
      ? '<div class="lc-near">' +
        near
          .sort((a, b) => a.th - a.v - (b.th - b.v))
          .map(
            (x) =>
              '<div class="lc-near-item"><a href="#" class="project-link" data-lc-project="' + esc(x.p.id) + '">' + esc(x.p.project_name) + "</a><span>" + T(x.c.ar, x.c.en) + ": " + pct(x.v) + " " + T("من", "of") + " " + x.th + "% · <b>" + T("ينقصه", "short by") + " " + (x.th - x.v).toFixed(1) + " " + T("نقطة", "pts") + "</b></span><small>" + needed(x.p, x.c, x.th) + "</small></div>",
          )
          .join("") +
        "</div>"
      : '<div class="lc-empty">' + T("لا توجد مشاريع قريبة من الحد حالياً.", "No projects are close to a threshold right now.") + "</div>";
    html +=
      section(
        6,
        T("التوزيع", "Distribution"),
        T("المحتوى المحلي والالتزام مجمّعاً.", "Local content and compliance, grouped."),
        '<div class="lc-tabs">' + tabs + '</div><div class="table-wrap"><table class="lc-dist-table"><thead><tr><th>' + T("الاسم", "Name") + "</th><th>" + T("المشاريع", "Projects") + "</th><th>" + T("القيمة", "Value") + " (" + cur() + ")</th><th>" + T("المحتوى المحلي", "Local content") + " (" + cur() + ")</th><th>" + T("المحتوى المحلي / الصرف", "LC / spend") + "</th><th>" + T("مستوفي", "Compliant") + "</th><th>" + T("غير مستوفي", "Non-compliant") + "</th></tr></thead><tbody>" + distRows + "</tbody></table></div>",
        T(
          "يجمع المشاريع المعروضة حسب الجهة أو الشركة المنفذة أو القطاع، مرتبة من الأعلى محتوى محلياً. المشاريع بلا تقارير معتمدة تدخل في العدد والقيمة فقط.",
          "Groups the listed projects by entity, implementing company or sector, highest local content first. Projects without approved reports count only in projects and value.",
        ),
      ) +
      section(
        7,
        T("مشاريع قريبة من الحد", "Projects close to a threshold"),
        T("أسرع مكان للتحسين.", "The quickest wins."),
        nearHtml,
        T(
          "مشاريع غير مستوفية لمعيار وتبعد عن حده نقطتين أو أقل (5 نقاط للسلع). التقدير أسفل كل مشروع هو ما يلزم تقريباً لبلوغ الحد بالأرقام الحالية، للاسترشاد في المتابعة وليس حساباً رسمياً.",
          "Projects failing a criterion by 2 points or less (5 for goods). The estimate under each project is roughly what is needed to reach the threshold at current figures — a follow-up guide, not an official calculation.",
        ),
      );

    // 8. Projects table (first 10, then "show all")
    const rows = list
      .map((p) => ({
        p,
        name: p.project_name || "",
        entity: entityName(p),
        value: num(p.total_project_value),
        spend: num(p.total_spend),
        lc: num(p.total_local_content),
        lcSpend: num(p.total_spend) ? (num(p.total_local_content) / num(p.total_spend)) * 100 : null,
        // A criterion that does not apply yet shows «—» rather than a stored zero.
        om: critValue(p, CRITERIA[0]),
        sme: critValue(p, CRITERIA[1]),
        goods: critValue(p, CRITERIA[2]),
        srv: critValue(p, CRITERIA[3]),
        status: p.compliance_status || NA,
      }))
      .sort((a, b) => {
        const x = a[state.sortKey],
          y = b[state.sortKey];
        if (x == null && y == null) return 0;
        if (x == null) return 1;
        if (y == null) return -1;
        return (typeof x === "string" ? x.localeCompare(y, "ar") : x - y) * state.sortDir;
      });
    window.__icvLocalContentRows = rows;
    const shown = state.showAll ? rows : rows.slice(0, PAGE_SIZE);
    const critCell = (v, th) => '<td class="lc-n ' + (v == null ? "lc-na" : v >= th ? "ok" : "bad") + '">' + pct(v) + "</td>";
    const head = [
      ["name", T("المشروع", "Project")],
      ["entity", T("الجهة", "Entity")],
      ["value", T("القيمة", "Value") + " (" + cur() + ")"],
      ["spend", T("الصرف", "Spend") + " (" + cur() + ")"],
      ["lc", T("المحتوى المحلي", "Local content") + " (" + cur() + ")"],
      ["lcSpend", T("المحتوى المحلي / الصرف", "LC / spend")],
      ["om", T("التعمين", "Omanization")],
      ["sme", "SME"],
      ["goods", T("السلع", "Goods")],
      ["srv", T("الخدمات", "Services")],
      ["status", T("الحالة", "Status")],
    ]
      .map((h) => '<th data-lc-sort="' + h[0] + '" class="' + (state.sortKey === h[0] ? "lc-sorted" : "") + '">' + h[1] + "</th>")
      .join("");
    const body = shown
      .map(
        (r) =>
          '<tr><td><a href="#" class="project-link" data-lc-project="' + esc(r.p.id) + '">' + esc(r.name) + "</a></td><td>" + esc(r.entity) + '</td><td class="lc-n">' + money(r.value) + '</td><td class="lc-n">' + money(r.spend) + '</td><td class="lc-n">' + money(r.lc) + '</td><td class="lc-n">' + pct(r.lcSpend) + "</td>" +
          critCell(r.om, cfg.th.om) + critCell(r.sme, cfg.th.sme) + critCell(r.goods, cfg.th.goods) + critCell(r.srv, cfg.th.srv) +
          "<td>" + statusChip(r.status) + "</td></tr>",
      )
      .join("");
    const more =
      rows.length > PAGE_SIZE
        ? '<div class="lc-more"><button type="button" class="btn" data-lc-more>' + (state.showAll ? T("إظهار أول 10 فقط", "Show first 10 only") : T("إظهار الكل", "Show all") + " (" + rows.length + ")") + "</button></div>"
        : "";
    html += section(
      8,
      T("المشاريع", "Projects"),
      T("يعرض", "Showing") + " " + shown.length + " " + T("من", "of") + " " + rows.length + " · " + T("اضغط عنوان أي عمود للترتيب.", "Click a column title to sort."),
      '<div class="table-wrap"><table class="lc-table"><thead><tr>' + head + "</tr></thead><tbody>" + body + "</tbody></table></div>" + more,
      T(
        "كل المشاريع المعروضة مع أرقامها من قاعدة البيانات. لون نسبة كل معيار أخضر إذا بلغت الحد وأحمر إذا لم تبلغه، و«—» تعني أن المعيار لا ينطبق بعد. اسم المشروع يفتح صفحته، والتصدير يشمل كل المشاريع وليس العشرة الأولى فقط.",
        "All listed projects with their figures from the database. A criterion is green when it meets the threshold and red when it does not; «—» means it does not apply yet. The project name opens its page; the export includes every project, not just the first ten.",
      ),
      '<button type="button" class="btn primary" data-lc-export>' + T("تصدير Excel", "Export Excel") + "</button>",
    );

    root.innerHTML = html;
    bind(root);
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------
  function bind(root) {
    const on = (id, key) => {
      const el = root.querySelector("#" + id);
      if (el)
        el.onchange = () => {
          state[key] = el.value;
          state.showAll = false;
          render();
        };
    };
    on("lcEntity", "entity");
    on("lcSector", "sector");
    on("lcCompany", "company");
    on("lcStatus", "status");
    root.querySelectorAll("[data-lc-dist]").forEach((b) => (b.onclick = () => ((state.dist = b.dataset.lcDist), render())));
    root.querySelectorAll("[data-lc-sort]").forEach(
      (th) =>
        (th.onclick = () => {
          const k = th.dataset.lcSort;
          state.sortDir = state.sortKey === k ? -state.sortDir : ["name", "entity", "status"].includes(k) ? 1 : -1;
          state.sortKey = k;
          render();
        }),
    );
    root.querySelector("[data-lc-more]")?.addEventListener("click", () => {
      state.showAll = !state.showAll;
      render();
    });
    root.querySelectorAll("[data-lc-project]").forEach(
      (a) =>
        (a.onclick = (e) => {
          e.preventDefault();
          if (typeof window.viewProject === "function") window.viewProject(a.dataset.lcProject);
        }),
    );
    root.querySelector("[data-lc-export]")?.addEventListener("click", exportExcel);
  }

  function exportExcel() {
    const rows = window.__icvLocalContentRows || [];
    const head = [
      T("المشروع", "Project"), T("الجهة", "Entity"), T("القيمة", "Value"), T("الصرف", "Spend"), T("المحتوى المحلي", "Local content"),
      T("المحتوى المحلي / الصرف %", "LC / spend %"), T("التعمين %", "Omanization %"), "SME %", T("السلع %", "Goods %"), T("الخدمات %", "Services %"), T("الحالة", "Status"),
    ];
    const r1 = (v) => (v == null ? "" : Math.round(v * 10) / 10);
    const data = rows.map((r) => [r.name, r.entity, Math.round(r.value), Math.round(r.spend), Math.round(r.lc), r1(r.lcSpend), r1(r.om), r1(r.sme), r1(r.goods), r1(r.srv), statusText(r.status)]);
    const file = T("ICV - المحتوى المحلي - ", "ICV - Local content - ") + new Date().toISOString().slice(0, 10);
    if (typeof XLSX !== "undefined") {
      const ws = XLSX.utils.aoa_to_sheet([head, ...data]);
      ws["!cols"] = [{ wch: 48 }, { wch: 34 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 18 }];
      ws["!sheetViews"] = [{ rightToLeft: !isEn() }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, T("المحتوى المحلي", "Local content"));
      XLSX.writeFile(wb, file + ".xlsx");
      return;
    }
    const csv = "﻿" + [head, ...data].map((r) => r.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = file + ".csv";
    a.click();
  }

  // ---------------------------------------------------------------------------
  // Styles: built on the platform classes (.panel, .cards, .card, .field, .btn, .table-wrap)
  // and theme variables, so themes, dark text and both languages follow automatically.
  // ---------------------------------------------------------------------------
  function injectStyle() {
    if (document.getElementById("icv-local-content-style")) return;
    const s = document.createElement("style");
    s.id = "icv-local-content-style";
    s.textContent =
      "#page-local-content{display:grid;gap:18px;min-width:0}" +
      "#page-local-content .lc-hero .toolbar{align-items:flex-start}" +
      "#page-local-content .lc-scope{display:flex;align-items:center;gap:8px}" +
      "#page-local-content .lc-filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:14px}" +
      "#page-local-content .lc-filters .field{margin:0}" +
      "#page-local-content .lc-section{min-width:0}" +
      "#page-local-content .lc-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}" +
      "#page-local-content .lc-head .desc{margin-bottom:0}" +
      "#page-local-content .lc-num{display:inline-grid;place-items:center;min-width:24px;height:24px;border-radius:7px;background:var(--soft);color:var(--primary2);font-size:12px;font-weight:800;margin-inline-end:8px}" +
      "#page-local-content .lc-num:empty{display:none}" +
      "#page-local-content .lc-caption{margin:14px 0 0;padding-top:10px;border-top:1px dashed var(--line);color:var(--muted);font-size:11.5px;line-height:1.8}" +
      "#page-local-content .lc-kpis{margin-bottom:12px}" +
      "#page-local-content .lc-kpis .value{font-size:20px}" +
      "#page-local-content .lc-criteria{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}" +
      "#page-local-content .lc-crit{border:1px solid var(--line);border-radius:14px;padding:14px;min-width:0}" +
      "#page-local-content .lc-crit-top{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px}" +
      "#page-local-content .lc-crit-val{font-size:22px;font-weight:800;margin:6px 0 2px}" +
      "#page-local-content .lc-gauge{position:relative;height:8px;background:#edf1f5;border-radius:99px;margin:8px 0 6px}" +
      "#page-local-content .lc-gauge i{position:absolute;inset-block:0;inset-inline-start:0;border-radius:99px}" +
      "#page-local-content .lc-gauge em{position:absolute;top:-4px;width:2px;height:16px;background:var(--ink);opacity:.55}" +
      "#page-local-content .lc-gauge i.ok,#page-local-content .lc-stack .ok,#page-local-content .lc-legend i.ok{background:var(--green)}" +
      "#page-local-content .lc-gauge i.bad,#page-local-content .lc-stack .bad,#page-local-content .lc-legend i.bad{background:var(--red)}" +
      "#page-local-content .lc-gauge i.na,#page-local-content .lc-stack .na,#page-local-content .lc-legend i.na{background:#94a3b8}" +
      "#page-local-content .lc-chip{display:inline-block;border-radius:999px;padding:2px 9px;font-size:11px;font-weight:700;white-space:nowrap}" +
      "#page-local-content .lc-chip.ok{background:#e8f6ef;color:var(--green)}#page-local-content .lc-chip.bad{background:#fdeceb;color:var(--red)}#page-local-content .lc-chip.na{background:#f1f3f5;color:#5b6675}" +
      "#page-local-content .lc-counts{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#page-local-content .lc-counts .lc-chip{font-size:12px;padding:5px 12px}" +
      "#page-local-content .lc-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:18px;min-width:0}" +
      "#page-local-content .lc-bars{display:grid;gap:7px}" +
      "#page-local-content .lc-bar-group{font-size:11px;color:var(--muted);font-weight:800;margin-top:6px}" +
      "#page-local-content .lc-bar-row{display:grid;grid-template-columns:150px minmax(0,1fr) 160px;gap:10px;align-items:center;font-size:12px}" +
      "#page-local-content .lc-track{position:relative;height:16px;background:#f1f4f7;border-radius:6px;overflow:hidden}" +
      "#page-local-content .lc-track span{position:absolute;inset-block:0;inset-inline-start:0}" +
      "#page-local-content .lc-spend{background:#d9e3ea}#page-local-content .lc-lc{background:var(--primary)}" +
      "#page-local-content .lc-amt{text-align:end;direction:ltr;font-variant-numeric:tabular-nums;color:var(--muted)}#page-local-content .lc-amt b{color:var(--ink)}" +
      "html[dir=rtl] #page-local-content .lc-amt{text-align:left}" +
      "#page-local-content .lc-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:var(--muted);margin-top:10px}" +
      "#page-local-content .lc-legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-inline-end:5px;vertical-align:-1px}" +
      "#page-local-content .lc-share{display:grid;gap:12px}" +
      "#page-local-content .lc-stack{display:flex;height:22px;border-radius:7px;overflow:hidden;background:#f1f4f7}" +
      "#page-local-content .lc-stack span{display:grid;place-items:center;height:100%;color:#fff;font-size:11px;font-weight:700}" +
      "#page-local-content .lc-stack-big{height:30px}" +
      "#page-local-content .lc-share-row{display:grid;grid-template-columns:1fr auto;gap:2px 8px;font-size:12px}#page-local-content .lc-share-row small{grid-column:1/-1;font-size:11px}" +
      "#page-local-content .lc-share-row i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-inline-end:6px}" +
      "#page-local-content .lc-crit-stack{display:grid;gap:12px}" +
      "#page-local-content .lc-crit-row>div:first-child{display:flex;justify-content:space-between;gap:8px;font-size:12px;margin-bottom:4px}" +
      "#page-local-content .lc-svg{width:100%;overflow:hidden}#page-local-content svg text{font-family:inherit}" +
      "#page-local-content .lc-tabs{display:flex;gap:6px;flex-wrap:wrap}#page-local-content .lc-tabs .btn{width:auto}" +
      "#page-local-content .table-wrap table{min-width:0}" +
      "#page-local-content .lc-table{min-width:980px!important}" +
      "#page-local-content .lc-table td:first-child,#page-local-content .lc-table td:nth-child(2){white-space:normal;min-width:200px;max-width:320px}" +
      "#page-local-content .lc-table th{cursor:pointer;user-select:none}#page-local-content .lc-table th.lc-sorted{color:var(--primary2)}" +
      "#page-local-content .lc-n{direction:ltr;text-align:end;font-variant-numeric:tabular-nums;white-space:nowrap}" +
      "html[dir=rtl] #page-local-content .lc-n{text-align:left}" +
      "#page-local-content td.ok,#page-local-content td.bad{font-weight:700}#page-local-content .lc-na{color:#94a3b8}" +
      "#page-local-content .lc-more{display:flex;justify-content:center;margin-top:12px}#page-local-content .lc-more .btn{width:auto}" +
      "#page-local-content .lc-sub{color:var(--muted);font-size:11px;font-weight:400}" +
      "#page-local-content .lc-dist-table td:first-child{white-space:normal;min-width:220px}" +
      "#page-local-content .lc-near{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}" +
      "#page-local-content .lc-near-item{border:1px solid #f2dfb0;background:#fffcf3;border-radius:12px;padding:12px;display:grid;gap:3px;font-size:12px}" +
      "#page-local-content .lc-near-item b{color:var(--amber)}#page-local-content .lc-near-item small{color:var(--muted)}" +
      "#page-local-content .lc-empty{color:var(--muted);font-size:12px;padding:10px 0}" +
      "#page-local-content .lc-head .btn{width:auto;white-space:nowrap}" +
      "@media(max-width:1100px){#page-local-content .lc-grid{grid-template-columns:1fr}#page-local-content .lc-criteria{grid-template-columns:repeat(2,minmax(0,1fr))}#page-local-content .lc-filters{grid-template-columns:repeat(2,minmax(0,1fr))}}" +
      "@media(max-width:700px){#page-local-content .lc-kpis{grid-template-columns:1fr 1fr}#page-local-content .lc-kpis .value{font-size:16px}#page-local-content .lc-crit{padding:11px}#page-local-content .lc-crit-top{flex-direction:column;align-items:flex-start}#page-local-content .lc-bar-row{grid-template-columns:96px minmax(0,1fr) 112px;font-size:11px}#page-local-content .lc-filters{grid-template-columns:1fr}}";
    document.head.appendChild(s);
  }

  // Replace the old page renderer; the router and the scope toggle call this name.
  const install = () => {
    if (!window.icvStructure) return false;
    window.icvStructure.renderLocalContent = render;
    return true;
  };
  if (!install()) document.addEventListener("DOMContentLoaded", install);
  window.icvRenderLocalContent = render;
})();
