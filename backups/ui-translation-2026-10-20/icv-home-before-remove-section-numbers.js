/* Home page («الصفحة الرئيسية»): the portfolio at a glance — where the projects are, how they move
 * through time and spend, and whether reports arrive. Personal work (tasks, reports to review,
 * notifications) stays in «ملفي الشخصي»; local content analysis stays in «المحتوى المحلي».
 * Everything comes from the data already loaded by the page (projects, reports, plans).
 */
(function () {
  "use strict";

  const PAGE_ID = "page-dashboard";
  const isEn = () => {
    // icv-i18n.js loads after this file, so fall back to the stored choice on the first render.
    if (window.ICVLanguage?.get) return window.ICVLanguage.get() === "en";
    try {
      return localStorage.getItem("icv-ui-language") === "en";
    } catch (e) {
      return false;
    }
  };
  const T = (ar, en) => (isEn() ? en : ar);
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const money = (v) => Math.round(num(v)).toLocaleString("en-US");
  const cur = () => T("ر.ع", "OMR");
  const short = (v) => {
    v = num(v);
    if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1) + T("م", "M");
    if (Math.abs(v) >= 1e3) return Math.round(v / 1e3) + T("ألف", "K");
    return String(Math.round(v));
  };
  const day = (d) => {
    if (!d) return null;
    const x = new Date(String(d).slice(0, 10) + "T00:00:00");
    return isNaN(x) ? null : x;
  };
  const fmtDate = (d) => (d ? String(d).slice(0, 10) : "—");

  const OK = "مستوفي",
    BAD = "غير مستوفي",
    NA = "غير منطبق",
    APPROVED = "معتمد";
  const ST = { assigned: "مسند", running: "قيد التنفيذ", done: "منتهي", stuck: "متعثر" };
  const statusLabel = (s) =>
    ({ "مسند": T("مسند", "Assigned"), "قيد التنفيذ": T("قيد التنفيذ", "In progress"), "منتهي": T("منتهي", "Completed"), "متعثر": T("متعثر", "Stalled") })[s] || s || T("بدون حالة", "No status");
  const entityName = (p) => p.government_entities?.name || T("بدون جهة", "No entity");
  const companyName = (p) => p.companies?.name || T("بدون شركة", "No company");

  const state = { metric: "count", gov: null, stage: null, ganttAll: false };

  // ---------------------------------------------------------------------------
  // Quarters and reports
  // ---------------------------------------------------------------------------
  // The last `n` completed calendar quarters, oldest first.
  function lastQuarters(n, today) {
    let y = today.getFullYear(),
      q = Math.floor(today.getMonth() / 3); // current quarter index 0..3 → previous completed = q
    if (q === 0) {
      y -= 1;
      q = 4;
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      out.unshift({ y, q, label: "Q" + q + " " + y, start: new Date(y, (q - 1) * 3, 1), end: new Date(y, q * 3, 0) });
      q -= 1;
      if (q === 0) {
        y -= 1;
        q = 4;
      }
    }
    return out;
  }
  // A project owes a report for a quarter when it was running during that quarter.
  // Same rule the notifications use: started by the quarter end and not ended before it began.
  function owes(p, Q) {
    const s = day(p.start_date),
      e = day(p.end_date);
    if (!s || s > Q.end) return false;
    return !e || e >= Q.start;
  }
  function reportState(p, Q, byKey) {
    if (!owes(p, Q)) return null;
    const rows = byKey.get(p.id + "|" + Q.y + "|Q" + Q.q) || [];
    if (!rows.length) return "miss";
    return rows.some((r) => String(r.status || "").trim() === APPROVED) ? "ok" : "rev";
  }
  function reportIndex() {
    const m = new Map();
    (window.reports || []).forEach((r) => {
      const qn = String(r.quarter || "").replace(/\D/g, "");
      const k = r.project_id + "|" + String(r.annual_period || "").trim() + "|Q" + qn;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    });
    return m;
  }

  // ---------------------------------------------------------------------------
  // Pieces
  // ---------------------------------------------------------------------------
  function section(n, title, sub, body, caption, extra) {
    return (
      '<section class="panel hm-section"><div class="hm-head"><div><h2>' + (n ? '<span class="hm-num">' + n + "</span>" : "") + title + "</h2>" +
      (sub ? '<div class="hm-desc">' + sub + "</div>" : "") + "</div>" + (extra || "") + "</div>" + body +
      (caption ? '<p class="hm-caption">' + caption + "</p>" : "") + "</section>"
    );
  }
  const link = (p, text) => '<a href="#" class="project-link" data-hm-project="' + esc(p.id) + '">' + esc(text ?? p.project_name) + "</a>";
  const empty = (t) => '<div class="hm-empty">' + t + "</div>";

  function kpis(list, Qs, idx) {
    const last = Qs[Qs.length - 1];
    const due = list.map((p) => reportState(p, last, idx)).filter(Boolean);
    const rec = due.filter((x) => x !== "miss").length;
    const withRep = list.filter((p) => (p.compliance_status || NA) !== NA);
    const ok = withRep.filter((p) => p.compliance_status === OK).length;
    const govs = new Set(list.flatMap((p) => Object.keys(window.ICVLocation?.normalize(p.location) || {})));
    const stuck = list.filter((p) => p.project_status === ST.stuck).length;
    const k = [
      [T("المشاريع", "Projects"), list.length, T("في ", "in ") + govs.size + T(" محافظات", " governorates")],
      [T("قيمة المشاريع", "Project value"), short(list.reduce((s, p) => s + num(p.total_project_value), 0)), cur()],
      [T("قيد التنفيذ", "In progress"), list.filter((p) => p.project_status === ST.running).length, T("مشروع قائم الآن", "running now")],
      [T("متعثرة", "Stalled"), stuck, stuck ? T("تحتاج تدخل", "need action") : T("لا يوجد", "none"), stuck ? "hm-alert" : ""],
      [T("تقارير آخر ربع", "Last quarter reports"), due.length ? rec + " / " + due.length : "—", due.length ? Math.round((rec / due.length) * 100) + "% " + T("مستلمة", "received") + " (" + last.label + ")" : T("لا تقارير مطلوبة", "none due") + " (" + last.label + ")"],
      [T("مستوفية للمعايير", "Meeting criteria"), withRep.length ? Math.round((ok / withRep.length) * 100) + "%" : "—", ok + T(" من ", " of ") + withRep.length + T(" لها تقارير معتمدة", " with approved reports")],
    ];
    return (
      '<div class="cards hm-kpis">' +
      k.map((x) => '<div class="card ' + (x[3] || "") + '"><div class="label">' + x[0] + '</div><div class="value">' + x[1] + '</div><div class="sub">' + x[2] + "</div></div>").join("") +
      "</div>"
    );
  }

  // Simplified tile map: each governorate in its approximate place.
  function mapHtml(list) {
    const L = window.ICVLocation;
    if (!L) return empty(T("تعذر تحميل بيانات المحافظات.", "Governorate data could not be loaded."));
    const stats = L.GOVS.map((g) => {
      const ps = list.filter((p) => L.normalize(p.location)[g.k]);
      return { g, ps, count: ps.length, value: ps.reduce((s, p) => s + num(p.total_project_value), 0) };
    });
    if (!state.gov || !L.GOVS.some((g) => g.k === state.gov)) state.gov = stats.slice().sort((a, b) => b.count - a.count)[0].g.k;
    const max = Math.max(1, ...stats.map((s) => s[state.metric]));
    const shade = (t) => {
      const a = [231, 244, 241],
        b = [11, 95, 89];
      return "rgb(" + a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(",") + ")";
    };
    const tiles = stats
      .map((s) => {
        const v = s[state.metric],
          t = v / max;
        return (
          '<button type="button" class="hm-tile' + (s.g.k === state.gov ? " sel" : "") + '" data-hm-gov="' + esc(s.g.k) + '" style="grid-column:' + s.g.pos[0] + " / span " + s.g.pos[2] + ";grid-row:" + s.g.pos[1] +
          ";background:" + (v ? shade(0.15 + t * 0.85) : "#f3f5f7") + ";color:" + (v && t > 0.45 ? "#fff" : "var(--ink)") + '"><b>' + esc(L.govName(s.g.k)) + "</b><span>" +
          (state.metric === "count" ? s.count : short(s.value)) + "</span><small>" + (state.metric === "count" ? T("مشروع", "projects") : cur()) + "</small></button>"
        );
      })
      .join("");
    const sel = stats.find((s) => s.g.k === state.gov);
    const per = sel.g.w.map((w) => ({ w, n: sel.ps.filter((p) => (L.normalize(p.location)[sel.g.k] || []).includes(w)).length })).sort((a, b) => b.n - a.n);
    const whole = sel.ps.filter((p) => !(L.normalize(p.location)[sel.g.k] || []).length).length;
    const mx = Math.max(1, ...per.map((x) => x.n));
    const noLoc = list.filter((p) => L.isEmpty(p.location));
    const detail =
      "<h3>" + T("محافظة ", "") + esc(L.govName(sel.g.k)) + '</h3><div class="hm-sub">' + sel.count + " " + T("مشروع", "projects") + " · " + money(sel.value) + " " + cur() + " · " + sel.g.w.length + " " + T("ولايات", "wilayats") + "</div>" +
      '<div class="hm-wil">' +
      per.map((x) => "<span>" + esc(x.w) + '</span><b class="hm-n">' + x.n + '</b><div class="hm-bar"><i style="width:' + (x.n / mx) * 100 + '%"></i></div>').join("") +
      (whole ? "<span>" + T("على مستوى المحافظة", "Whole governorate") + '</span><b class="hm-n">' + whole + "</b>" : "") +
      "</div>" +
      (sel.ps.length
        ? '<ul class="hm-plist">' +
          sel.ps
            .map((p) => {
              const govs = Object.keys(L.normalize(p.location));
              return "<li>" + link(p) + '<div class="hm-sub">' + (govs.length > 1 ? T("يمتد على: ", "Spans: ") + govs.map(L.govName).join("، ") + " · " : "") + esc(statusLabel(p.project_status)) + "</div></li>";
            })
            .join("") +
          "</ul>"
        : '<p class="hm-sub">' + T("لا توجد مشاريع في هذه المحافظة.", "No projects in this governorate.") + "</p>");
    const scale =
      '<div class="hm-scale">' + T("أقل", "Less") + ' <i style="background:' + shade(0.15) + '"></i><i style="background:' + shade(0.45) + '"></i><i style="background:' + shade(0.75) + '"></i><i style="background:' + shade(1) + '"></i> ' + T("أكثر", "More") + "</div>";
    const missing = noLoc.length
      ? '<div class="hm-noloc">' + noLoc.length + " " + T("مشروع بلا موقع محدد، لا يظهر في الخريطة. أضف الموقع من «تعديل بيانات المشروع»: ", "projects have no location and are not on the map. Add it from “Edit project”: ") +
        noLoc.slice(0, 5).map((p) => link(p)).join("، ") + (noLoc.length > 5 ? " …" : "") + "</div>"
      : "";
    const M = window.ICV_OMAN_MAP;
    let mapBody = '<div class="hm-tilemap">' + tiles + "</div>";
    if (M) {
      const fmt = (s) => (state.metric === "count" ? String(s.count) : short(s.value));
      const shapes = stats
        .map((s) => {
          const geo = M.g[s.g.k];
          if (!geo) return "";
          const v = s[state.metric];
          return (
            '<path class="hm-gpath' + (s.g.k === state.gov ? " sel" : "") + '" data-hm-gov="' + esc(s.g.k) + '" d="' + geo.d + '" fill="' + (v ? shade(0.15 + (v / max) * 0.85) : "#eef2f5") + '"><title>' +
            esc(L.govName(s.g.k)) + ": " + s.count + " " + T("مشروع", "projects") + " · " + money(s.value) + " " + cur() + "</title></path>"
          );
        })
        .join("");
      // Selected outline drawn last so its border is not hidden by neighbours.
      const selGeo = M.g[state.gov];
      const outline = selGeo ? '<path d="' + selGeo.d + '" fill="none" stroke="var(--ink)" stroke-width="2.2" pointer-events="none"/>' : "";
      const labels = stats
        .map((s) => {
          const geo = M.g[s.g.k];
          if (!geo) return "";
          const [bx, by] = geo.b,
            [lx, ly] = geo.l;
          const v = s[state.metric],
            dark = v && v / max > 0.45;
          const pw = Math.max(22, 10 + fmt(s).length * 7.5);
          const lead = geo.a !== "middle" ? '<line x1="' + bx + '" y1="' + by + '" x2="' + lx + '" y2="' + ly + '" stroke="#94a3b8" stroke-width="1"/>' : "";
          return (
            '<g class="hm-glabel" data-hm-gov="' + esc(s.g.k) + '">' + lead +
            '<rect x="' + (bx - pw / 2) + '" y="' + (by - 11) + '" width="' + pw + '" height="22" rx="11" fill="' + (dark ? "#fff" : "var(--primary2)") + '" stroke="' + (dark ? "var(--primary2)" : "#fff") + '" stroke-width="1.5"/>' +
            '<text x="' + bx + '" y="' + (by + 4.5) + '" text-anchor="middle" font-size="12.5" font-weight="800" fill="' + (dark ? "var(--primary2)" : "#fff") + '">' + fmt(s) + "</text>" +
            '<text x="' + lx + '" y="' + (ly + 4.5) + '" text-anchor="' + geo.a + '" font-size="14" font-weight="700" fill="var(--ink)" paint-order="stroke" stroke="#fff" stroke-width="3" stroke-linejoin="round">' + esc(L.govName(s.g.k)) + "</text></g>"
          );
        })
        .join("");
      mapBody =
        '<div class="hm-svgmap"><svg viewBox="' + M.viewBox + '" role="img" aria-label="' + T("خريطة سلطنة عُمان حسب المحافظات", "Map of Oman by governorate") + '">' + shapes + outline + labels + "</svg></div>" +
        '<div class="hm-govchips">' +
        stats
          .slice()
          .sort((a, b) => b[state.metric] - a[state.metric])
          .map((s) => '<button type="button" class="hm-chip' + (s.g.k === state.gov ? " on" : "") + '" data-hm-gov="' + esc(s.g.k) + '">' + esc(L.govName(s.g.k)) + " <b>" + fmt(s) + "</b></button>")
          .join("") +
        "</div>";
    }
    return '<div class="hm-mapwrap"><div>' + mapBody + scale + '</div><div class="hm-gov">' + detail + "</div></div>" + missing;
  }

  function pipelineHtml(list) {
    const total = list.reduce((s, p) => s + num(p.total_project_value), 0) || 1;
    const order = [ST.assigned, ST.running, ST.done, ST.stuck];
    const extra = [...new Set(list.map((p) => p.project_status || ""))].filter((s) => !order.includes(s));
    const stages = order.concat(extra);
    const html = stages
      .map((k, i) => {
        const ps = list.filter((p) => (p.project_status || "") === k),
          v = ps.reduce((s, p) => s + num(p.total_project_value), 0);
        const cls = (k === ST.stuck ? " stuck" : "") + (i < 2 ? " arrow" : "") + (state.stage === k ? " sel" : "");
        return (
          '<button type="button" class="hm-stage' + cls + '" data-hm-stage="' + esc(k) + '"><b>' + esc(statusLabel(k)) + '</b><span class="hm-big">' + ps.length + '</span><span class="hm-sub">' + short(v) + " " + cur() + " · " + Math.round((v / total) * 100) + '%</span><span class="hm-bar"><i style="width:' + (v / total) * 100 + '%"></i></span></button>'
        );
      })
      .join("");
    const sel = state.stage
      ? "<b>" + esc(statusLabel(state.stage)) + ":</b> " + (list.filter((p) => (p.project_status || "") === state.stage).map((p) => link(p)).join(" · ") || T("لا توجد مشاريع.", "No projects."))
      : '<span class="hm-sub">' + T("اضغط حالة لعرض مشاريعها.", "Click a status to list its projects.") + "</span>";
    return '<div class="hm-pipe">' + html + '</div><div class="hm-stage-list">' + sel + "</div>";
  }

  function scatterHtml(list, today) {
    const pts = list
      .filter((p) => [ST.running, ST.stuck].includes(p.project_status) && day(p.start_date) && day(p.end_date) && num(p.total_project_value) > 0)
      .map((p) => {
        const s = day(p.start_date),
          e = day(p.end_date);
        const t = e > s ? Math.max(0, Math.min(100, ((today - s) / (e - s)) * 100)) : 100;
        return { p, t, s: Math.min(100, (num(p.total_spend) / num(p.total_project_value)) * 100) };
      });
    if (!pts.length) return empty(T("لا توجد مشاريع قائمة لها تاريخ بداية ونهاية وقيمة.", "No running projects with start, end and value."));
    const W = 460,
      H = 330,
      pl = 44,
      pr = 14,
      pt = 14,
      pb = 40;
    const X = (v) => pl + ((W - pl - pr) * v) / 100,
      Y = (v) => pt + (H - pt - pb) * (1 - v / 100);
    const maxV = Math.max(...pts.map((x) => num(x.p.total_project_value)));
    let s = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" role="img" aria-label="' + T("الوقت مقابل الصرف", "Time vs spend") + '">';
    s += '<polygon points="' + X(30) + "," + Y(0) + " " + X(100) + "," + Y(0) + " " + X(100) + "," + Y(70) + '" fill="#f8d7a5" opacity=".45"/>';
    for (let i = 0; i <= 100; i += 25)
      s +=
        '<line x1="' + X(0) + '" x2="' + X(100) + '" y1="' + Y(i) + '" y2="' + Y(i) + '" stroke="var(--line)"/><text x="' + (pl - 6) + '" y="' + (Y(i) + 4) + '" font-size="10" fill="var(--muted)" text-anchor="end">' + i +
        '%</text><text x="' + X(i) + '" y="' + (H - pb + 16) + '" font-size="10" fill="var(--muted)" text-anchor="middle">' + i + "%</text>";
    s += '<line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(100) + '" y2="' + Y(100) + '" stroke="#94a3b8" stroke-dasharray="4 4"/>';
    s += '<text x="' + X(68) + '" y="' + (Y(76) - 4) + '" font-size="10" fill="var(--muted)" transform="rotate(-35 ' + X(68) + " " + Y(76) + ')">' + T("صرف يواكب الوقت", "spend keeps pace") + "</text>";
    s += '<text x="' + (W + pl) / 2 + '" y="' + (H - 6) + '" font-size="11" fill="var(--ink)" text-anchor="middle">' + T("المدة المنقضية", "Time elapsed") + "</text>";
    s += '<text x="12" y="' + H / 2 + '" font-size="11" fill="var(--ink)" text-anchor="middle" transform="rotate(-90 12 ' + H / 2 + ')">' + T("نسبة الصرف", "Spend") + "</text>";
    pts.forEach((x) => {
      const r = 5 + Math.sqrt(num(x.p.total_project_value) / maxV) * 9;
      s +=
        '<circle class="hm-dot" data-hm-project="' + esc(x.p.id) + '" cx="' + X(x.t) + '" cy="' + Y(x.s) + '" r="' + r + '" fill="' + (x.p.project_status === ST.stuck ? "var(--red)" : "var(--primary)") +
        '" fill-opacity=".75" stroke="#fff" stroke-width="1.5"><title>' + esc(x.p.project_name) + "\n" + T("المدة المنقضية ", "Time elapsed ") + Math.round(x.t) + "% · " + T("الصرف ", "Spend ") + x.s.toFixed(1) + "%</title></circle>";
    });
    const late = pts.filter((x) => x.t - x.s >= 30).length;
    return (
      '<div class="hm-svg">' + s + "</svg></div>" +
      '<div class="hm-legend"><span><i style="background:var(--primary)"></i>' + T("قيد التنفيذ", "In progress") + '</span><span><i style="background:var(--red)"></i>' + T("متعثر", "Stalled") + '</span><span><i style="background:#f8d7a5"></i>' + T("منطقة التأخر", "Lagging zone") + "</span><span><b>" + late + "</b> " + T("في منطقة التأخر", "in the lagging zone") + "</span></div>"
    );
  }

  function ganttHtml(list, today) {
    const rows = list.filter((p) => day(p.start_date) && day(p.end_date)).sort((a, b) => day(a.end_date) - day(b.end_date));
    if (!rows.length) return { html: empty(T("لا توجد مشاريع لها تاريخ بداية ونهاية.", "No projects with start and end dates.")), ext: 0, total: 0 };
    const starts = rows.map((p) => day(p.start_date)),
      ends = rows.map((p) => day(p.end_date));
    let min = new Date(Math.min(...starts, today)),
      max = new Date(Math.max(...ends, today));
    min = new Date(min.getFullYear(), min.getMonth() - 1, 1);
    max = new Date(max.getFullYear(), max.getMonth() + 2, 1);
    const span = max - min;
    const pos = (d) => ((d - min) / span) * 100;
    const shown = state.ganttAll ? rows : rows.slice(0, 10);
    const years = [];
    for (let y = min.getFullYear() + 1; y <= max.getFullYear(); y++) years.push(y);
    const axis = years.map((y) => '<span style="left:' + pos(new Date(y, 0, 1)) + '%">' + y + "</span>").join("") + '<span class="hm-today-l" style="left:' + pos(today) + '%">' + T("اليوم", "Today") + "</span>";
    const ext = rows.filter((p) => day(p.original_end_date) && day(p.end_date) > day(p.original_end_date)).length;
    const bars = shown
      .map((p) => {
        const s = day(p.start_date),
          e = day(p.end_date),
          o = day(p.original_end_date) && day(p.original_end_date) < e ? day(p.original_end_date) : e;
        const cls = p.project_status === ST.stuck ? " stuck" : p.project_status === ST.done ? " done" : "";
        return (
          '<div class="hm-grow"><span class="hm-nm" title="' + esc(p.project_name) + '">' + link(p) + '</span><div class="hm-gtrack"><div class="hm-gbar' + cls + '" style="left:' + pos(s) + "%;width:" + Math.max(0.5, pos(o) - pos(s)) + '%" title="' + fmtDate(p.start_date) + " → " + fmtDate(o.toISOString()) + '"></div>' +
          (o < e ? '<div class="hm-gbar ext" style="left:' + pos(o) + "%;width:" + (pos(e) - pos(o)) + '%" title="' + T("تمديد حتى ", "Extended to ") + fmtDate(p.end_date) + '"></div>' : "") +
          '<div class="hm-today" style="left:' + pos(today) + '%"></div></div></div>'
        );
      })
      .join("");
    const more = rows.length > 10 ? '<div class="hm-more"><button type="button" class="btn" data-hm-gantt>' + (state.ganttAll ? T("إظهار أول 10 فقط", "Show first 10 only") : T("إظهار الكل", "Show all") + " (" + rows.length + ")") + "</button></div>" : "";
    return { html: '<div class="hm-gaxis"><div></div><div>' + axis + '</div></div><div class="hm-gantt">' + bars + "</div>" + more, ext, total: rows.length };
  }

  function heatHtml(list, Qs, idx) {
    const ents = [...new Map(list.map((p) => [p.government_entity_id || "-", entityName(p)])).entries()];
    const rows = ents
      .map(([id, name]) => {
        const ps = list.filter((p) => (p.government_entity_id || "-") === id);
        const cells = Qs.map((Q) => {
          const s = ps.map((p) => reportState(p, Q, idx)).filter(Boolean);
          if (!s.length) return '<td class="hm-c none">—</td>';
          const rec = s.filter((x) => x !== "miss").length;
          const cls = s.includes("miss") ? "miss" : s.includes("rev") ? "rev" : "ok";
          return '<td class="hm-c ' + cls + '" title="' + esc(name) + " · " + Q.label + '">' + rec + "/" + s.length + "</td>";
        });
        return { any: cells.some((c) => !c.includes(" none")), html: '<tr><td class="hm-e" title="' + esc(name) + '">' + esc(name) + "</td>" + cells.join("") + "</tr>" };
      })
      .filter((r) => r.any);
    if (!rows.length) return empty(T("لا توجد مشاريع مطلوب منها تقارير في آخر 6 أرباع.", "No projects owed reports in the last 6 quarters."));
    return (
      '<div class="hm-heatwrap"><table class="hm-heat"><thead><tr><th>' + T("الجهة", "Entity") + "</th>" + Qs.map((Q) => "<th>" + Q.label + "</th>").join("") + "</tr></thead><tbody>" + rows.map((r) => r.html).join("") + "</tbody></table></div>" +
      '<div class="hm-legend"><span><i class="ok"></i>' + T("كل التقارير معتمدة", "All approved") + '</span><span><i class="rev"></i>' + T("مستلمة وبعضها تحت المراجعة", "Received, some under review") + '</span><span><i class="miss"></i>' + T("تقرير واحد أو أكثر لم يُستلم", "One or more missing") + '</span><span><i class="none"></i>' + T("لا مشاريع مطلوب منها تقرير", "Nothing due") + "</span></div>"
    );
  }

  function entitiesHtml(list, Qs, idx) {
    const ids = [...new Set(list.map((p) => p.government_entity_id || "-"))];
    const rows = ids
      .map((id) => {
        const ps = list.filter((p) => (p.government_entity_id || "-") === id);
        let due = 0,
          rec = 0;
        ps.forEach((p) =>
          Qs.forEach((Q) => {
            const s = reportState(p, Q, idx);
            if (s) {
              due++;
              if (s !== "miss") rec++;
            }
          }),
        );
        const wr = ps.filter((p) => (p.compliance_status || NA) !== NA),
          ok = wr.filter((p) => p.compliance_status === OK).length;
        return { name: entityName(ps[0]), n: ps.length, v: ps.reduce((s, p) => s + num(p.total_project_value), 0), rep: due ? (rec / due) * 100 : null, cmp: wr.length ? (ok / wr.length) * 100 : null, stuck: ps.filter((p) => p.project_status === ST.stuck).length };
      })
      .sort((a, b) => (b.cmp ?? -1) - (a.cmp ?? -1) || (b.rep ?? -1) - (a.rep ?? -1) || b.v - a.v);
    const bar = (v) =>
      v == null
        ? '<span class="hm-sub">—</span>'
        : '<span class="hm-n">' + Math.round(v) + '%</span><span class="hm-mini"><i style="width:' + v + "%;background:" + (v >= 70 ? "var(--green)" : v >= 40 ? "var(--amber)" : "var(--red)") + '"></i></span>';
    return (
      '<div class="table-wrap"><table class="hm-table"><thead><tr><th>' + T("الجهة", "Entity") + "</th><th>" + T("المشاريع", "Projects") + "</th><th>" + T("القيمة", "Value") + " (" + cur() + ")</th><th>" + T("انتظام التقارير", "Reporting") + "</th><th>" + T("المستوفي", "Compliant") + "</th><th>" + T("متعثر", "Stalled") + "</th></tr></thead><tbody>" +
      rows
        .map(
          (r, i) =>
            '<tr><td><span class="hm-rank">' + (i + 1) + "</span>" + esc(r.name) + '</td><td class="hm-n">' + r.n + '</td><td class="hm-n">' + money(r.v) + "</td><td>" + bar(r.rep) + "</td><td>" + bar(r.cmp) + '</td><td class="hm-n' + (r.stuck ? " hm-red" : "") + '">' + r.stuck + "</td></tr>",
        )
        .join("") +
      "</tbody></table></div>"
    );
  }

  function companiesHtml(list) {
    const ids = [...new Set(list.map((p) => p.implementing_company_id || "-"))];
    const rows = ids
      .map((id) => {
        const ps = list.filter((p) => (p.implementing_company_id || "-") === id);
        const wr = ps.filter((p) => (p.compliance_status || NA) !== NA);
        return { name: companyName(ps[0]), n: ps.length, v: ps.reduce((s, p) => s + num(p.total_project_value), 0), ok: wr.filter((p) => p.compliance_status === OK).length, wr: wr.length };
      })
      .sort((a, b) => b.v - a.v)
      .slice(0, 6);
    if (!rows.length) return empty(T("لا توجد شركات.", "No companies."));
    const mx = rows[0].v || 1;
    return '<div class="hm-cos">' + rows
      .map(
        (r, i) =>
          '<div class="hm-co"><div class="hm-co-top"><span><span class="hm-rank">' + (i + 1) + "</span><b>" + esc(r.name) + '</b></span><span class="hm-n">' + short(r.v) + " " + cur() + '</span></div><div class="hm-cobar"><i style="width:' + (r.v / mx) * 100 + '%"></i></div><div class="hm-sub">' +
          r.n + " " + T("مشاريع", "projects") + " · " + (r.wr ? r.ok + T(" من ", " of ") + r.wr + T(" مستوفية", " compliant") : T("بلا تقارير معتمدة بعد", "no approved reports yet")) + "</div></div>",
      )
      .join("") + "</div>";
  }

  function newsHtml(list, today) {
    const m0 = new Date(today.getFullYear(), today.getMonth(), 1);
    const inMonth = (d) => {
      const x = day(d);
      return x && x >= m0 && x <= today;
    };
    const ids = new Set(list.map((p) => p.id));
    const byId = new Map(list.map((p) => [p.id, p]));
    const newP = list.filter((p) => inMonth(p.created_at));
    const appr = (window.reports || []).filter((r) => ids.has(r.project_id) && String(r.status || "").trim() === APPROVED && inMonth(r.reviewed_at));
    const plans = (window.plans || []).filter((x) => ids.has(x.project_id) && inMonth(x.received_at || x.created_at));
    const box = (n, t, items) =>
      '<div class="hm-new"><div class="hm-sub">' + t + '</div><div class="hm-big">' + n + "</div>" +
      (items.length ? "<ul>" + items.slice(0, 4).map((x) => "<li>" + x + "</li>").join("") + (items.length > 4 ? "<li>" + T("و", "and ") + (items.length - 4) + T(" أخرى", " more") + "</li>" : "") + "</ul>" : "") + "</div>";
    return (
      '<div class="hm-news">' +
      box(newP.length, T("مشاريع جديدة", "New projects"), newP.map((p) => link(p) + " · " + esc(entityName(p)))) +
      box(appr.length, T("تقارير اعتُمدت", "Reports approved"), appr.map((r) => (byId.get(r.project_id) ? link(byId.get(r.project_id)) : "") + " · " + esc(r.quarter || "") + " " + esc(r.annual_period || ""))) +
      box(plans.length, T("خطط محتوى محلي استُلمت", "Local content plans received"), plans.map((x) => (byId.get(x.project_id) ? link(byId.get(x.project_id)) : "") + (x.version ? " · " + T("الإصدار ", "v") + esc(x.version) : ""))) +
      "</div>"
    );
  }

  // ---------------------------------------------------------------------------
  // Page
  // ---------------------------------------------------------------------------
  function render() {
    const root = document.getElementById(PAGE_ID);
    if (!root) return;
    injectStyle();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const list = window.icvApplyFollowupScope ? window.icvApplyFollowupScope(window.projects || []) : window.projects || [];
    const Qs = lastQuarters(6, today),
      idx = reportIndex();
    const role = window.__icvProfile?.role;
    const canScope = role !== "admin" && (window.icvFollowupEntityIds || []).length > 0;
    const canAdd = window.ICV?.canEdit ? window.ICV.canEdit(window.__icvProfile) : role === "admin" || role === "editor" || role === "section_head";
    const monthName = today.toLocaleDateString(isEn() ? "en-GB" : "ar-OM", { month: "long", year: "numeric" });

    let html =
      '<div class="panel hm-hero"><div class="toolbar"><div><h2>' + T("الصفحة الرئيسية", "Home") + '</h2><div class="muted">' +
      T("صورة عامة عن المحفظة: أين المشاريع، كيف تسير في الوقت والصرف، وهل التقارير تصل.", "The portfolio at a glance: where projects are, how they track time and spend, and whether reports arrive.") +
      '</div></div><div class="hm-actions">' +
      (canScope ? '<label class="hm-scope"><input type="checkbox" ' + (window.icvFollowupOnly ? "checked" : "") + ' onchange="icvSetFollowupScope(this.checked)"> ' + T("جهات المتابعة فقط", "My entities only") + "</label>" : "") +
      "" +
      "</div></div></div>";

    if (!list.length) {
      root.innerHTML = html + '<div class="panel">' + empty(T("لا توجد مشاريع لعرضها.", "No projects to show.")) + "</div>";
      bind(root);
      return;
    }

    html += section(
      1,
      T("المحفظة في سطر", "Portfolio in one line"),
      "",
      kpis(list, Qs, idx),
      T(
        "أرقام سريعة عن كل المشاريع المعروضة. «تقارير آخر ربع» = التقارير المستلمة ÷ المشاريع التي كانت قائمة في آخر ربع مكتمل. نسبة المستوفي من المشاريع التي لها تقارير معتمدة فقط. تحليل المحتوى المحلي التفصيلي في صفحته ولا يتكرر هنا.",
        "Quick figures for all listed projects. “Last quarter reports” = reports received ÷ projects that were running in the last completed quarter. Compliance counts only projects with approved reports. Detailed local content analysis lives on its own page.",
      ),
      '<a href="#" class="project-link" data-hm-lc>' + T("التحليل الكامل في صفحة المحتوى المحلي ←", "Full analysis on the Local Content page →") + "</a>",
    );

    html += section(
      2,
      T("المشاريع حسب المحافظة", "Projects by governorate"),
      T("اضغط أي محافظة لتظهر ولاياتها ومشاريعها.", "Click a governorate to see its wilayats and projects."),
      mapHtml(list),
      T(
        "خريطة السلطنة بحدود المحافظات (حدود تقريبية للعرض فقط، المصدر: Natural Earth). لون المحافظة أغمق كلما زاد عدد مشاريعها أو قيمتها، والرقم في الدائرة هو العدد أو القيمة. المشروع الممتد على أكثر من محافظة (مثل مشاريع الطرق) يُحسب في كل محافظة يمر بها، لذلك قد يزيد مجموع المحافظات عن إجمالي المشاريع، والقيمة لا تُقسَّم بينها. الموقع يُحدَّد من نموذج المشروع.",
        "Map of Oman by governorate (approximate boundaries for display only; source: Natural Earth). Darker means more projects or value; the number in the circle is the count or value. A project spanning several governorates (e.g. roads) counts in each, so governorate totals can exceed the project total and the value is not split. The location is set in the project form.",
      ),
      '<div class="hm-toggle"><button type="button" class="btn' + (state.metric === "count" ? " primary" : "") + '" data-hm-metric="count">' + T("العدد", "Count") + '</button><button type="button" class="btn' + (state.metric === "value" ? " primary" : "") + '" data-hm-metric="value">' + T("القيمة", "Value") + "</button></div>",
    );

    html +=
      '<div class="hm-grid">' +
      section(
        3,
        T("مسار المشاريع", "Project pipeline"),
        T("من الإسناد إلى الانتهاء.", "From award to completion."),
        pipelineHtml(list),
        T(
          "عدد المشاريع وقيمتها في كل حالة، والشريط يوضح حصة الحالة من القيمة الكلية. المتعثر منفصل لأنه قد يحدث في أي مرحلة. اضغط أي حالة لعرض مشاريعها.",
          "Number and value of projects in each status; the bar shows the status share of total value. Stalled is separate because it can happen at any stage. Click a status to list its projects.",
        ),
      ) +
      "</div>";

    const g = ganttHtml(list, today);
    html += section(
      5,
      T("الخط الزمني للمشاريع", "Project timeline"),
      g.total ? T("من البداية إلى الانتهاء. ", "Start to finish. ") + g.ext + T(" مشروع مُدد.", " extended.") : "",
      g.html,
      T(
        "شريط لكل مشروع من تاريخ البداية إلى تاريخ الانتهاء الأصلي، والجزء المخطط بالبرتقالي هو التمديد حتى تاريخ الانتهاء الحالي. الخط الأسود هو تاريخ اليوم. مرتبة حسب أقرب تاريخ انتهاء، ويظهر أول 10 مشاريع.",
        "One bar per project from start to the original end date; the striped orange part is the extension to the current end date. The black line is today. Sorted by nearest end date; the first 10 are shown.",
      ),
      '<div class="hm-legend hm-legend-top"><span><i style="background:var(--primary)"></i>' + T("المدة الأصلية", "Original duration") + '</span><span><i class="ext"></i>' + T("تمديد", "Extension") + '</span><span><i style="background:var(--red)"></i>' + T("متعثر", "Stalled") + '</span><span><i style="background:#9fb3bf"></i>' + T("منتهي", "Completed") + "</span></div>",
    );

    html += section(
      6,
      T("انتظام التقارير حسب الجهة", "Reporting by entity"),
      T("آخر 6 أرباع مكتملة.", "Last 6 completed quarters."),
      heatHtml(list, Qs, idx),
      T(
        "لكل جهة وربع: الرقم = المشاريع التي استُلم تقريرها ÷ المشاريع التي كانت قائمة في ذلك الربع (بدأ قبل نهاية الربع ولم ينتهِ قبل بدايته، وهي نفس قاعدة التنبيهات). يكفي تقرير واحد ناقص ليصبح المربع أحمر، فتظهر الجهات المتأخرة باستمرار كصف أحمر.",
        "Per entity and quarter: projects whose report was received ÷ projects running in that quarter (started by the quarter end and not ended before it began — the same rule as the notifications). One missing report turns the cell red, so persistently late entities show as a red row.",
      ),
    );

    html +=
      section(
        7,
        T("بطاقة أداء الجهات", "Entity scorecard"),
        T("مرتبة من الأفضل التزاماً.", "Best compliance first."),
        entitiesHtml(list, Qs, idx),
        T(
          "لكل جهة: عدد مشاريعها وقيمتها، ونسبة التقارير المستلمة من المستحقة في آخر 6 أرباع، ونسبة المشاريع المستوفية من التي لها تقارير معتمدة، وعدد المتعثر. الترتيب حسب المستوفي ثم انتظام التقارير.",
          "Per entity: projects and value, share of due reports received in the last 6 quarters, share of projects with approved reports that are compliant, and stalled projects. Sorted by compliance, then reporting.",
        ),
      ) +
      section(
        8,
        T("أكبر الشركات المنفذة", "Largest contractors"),
        T("حسب قيمة المشاريع.", "By project value."),
        companiesHtml(list),
        T(
          "أكبر 6 شركات حسب مجموع قيمة مشاريعها، مع عدد المشاريع والمستوفي منها. يوضح الشركات التي يؤثر التزامها أكثر على المحفظة.",
          "The 6 largest contractors by total project value, with project count and how many are compliant — the contractors whose compliance matters most to the portfolio.",
        ),
      );

    html += section(
      9,
      T("جديد هذا الشهر", "New this month"),
      esc(monthName) + T(" على مستوى المنصة.", " across the platform."),
      newsHtml(list, today),
      T(
        "ما أُضيف أو اعتُمد منذ بداية الشهر: المشاريع حسب تاريخ إنشائها، والتقارير حسب تاريخ اعتمادها، وخطط المحتوى المحلي حسب تاريخ استلامها. نشاط كل موظف يبقى في ملفه الشخصي، وهنا المجموع فقط.",
        "What was added or approved since the start of the month: projects by creation date, reports by approval date, local content plans by received date. Each person’s own activity stays in their profile; this is the platform total.",
      ),
    );

    root.innerHTML = html;
    bind(root);
  }

  function bind(root) {
    root.querySelectorAll("[data-hm-project]").forEach(
      (a) =>
        (a.onclick = (e) => {
          e.preventDefault();
          if (typeof window.viewProject === "function") window.viewProject(a.dataset.hmProject);
        }),
    );
    root.querySelectorAll("[data-hm-gov]").forEach((b) => (b.onclick = () => ((state.gov = b.dataset.hmGov), render())));
    root.querySelectorAll("[data-hm-metric]").forEach((b) => (b.onclick = () => ((state.metric = b.dataset.hmMetric), render())));
    root.querySelectorAll("[data-hm-stage]").forEach((b) => (b.onclick = () => ((state.stage = state.stage === b.dataset.hmStage ? null : b.dataset.hmStage), render())));
    root.querySelector("[data-hm-gantt]")?.addEventListener("click", () => ((state.ganttAll = !state.ganttAll), render()));
    root.querySelector("[data-hm-add]")?.addEventListener("click", () => window.openProject());
    root.querySelector("[data-hm-lc]")?.addEventListener("click", (e) => {
      e.preventDefault();
      const btn = document.querySelector('.nav [data-page="local-content"]');
      if (typeof window.showPage === "function") window.showPage("local-content", btn);
      else btn?.click();
    });
  }

  // Prefixes every selector of every rule with the page id, so page rules win over the shared ones.
  function scope(chunk) {
    return chunk.replace(/([^{}]*)\{([^{}]*)\}/g, (m, sel, body) => {
      const list = sel
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => (x.startsWith("html[") ? x : "#page-dashboard" + (x ? " " + x : "")));
      return (list.length ? list.join(",") : "#page-dashboard") + "{" + body + "}";
    });
  }

  function injectStyle() {
    if (document.getElementById("icv-home-style")) return;
    const P = "#page-dashboard ";
    const css = [
      "{display:grid;gap:18px;min-width:0}",
      ".hm-hero .toolbar{align-items:flex-start}",
      ".hm-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}",
      ".hm-actions .btn{width:auto}",
      ".hm-scope{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)}",
      ".hm-section{min-width:0}",
      ".hm-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px;flex-wrap:wrap}",
      ".hm-head h2{margin:0}",
      ".hm-desc{color:var(--muted);font-size:12px;margin-top:3px}",
      ".hm-num{display:inline-grid;place-items:center;min-width:24px;height:24px;border-radius:7px;background:var(--soft);color:var(--primary2);font-size:12px;font-weight:800;margin-inline-end:8px}",
      ".hm-caption{margin:14px 0 0;padding-top:10px;border-top:1px dashed var(--line);color:var(--muted);font-size:11.5px;line-height:1.8}",
      ".hm-sub{color:var(--muted);font-size:11px;font-weight:400}",
      ".hm-empty{color:var(--muted);font-size:12px;padding:10px 0}",
      ".hm-n{direction:ltr;font-variant-numeric:tabular-nums;white-space:nowrap}",
      ".hm-red{color:var(--red);font-weight:700}",
      ".hm-kpis{grid-template-columns:repeat(6,minmax(0,1fr))}",
      ".hm-kpis .value{font-size:21px;font-variant-numeric:tabular-nums}",
      ".hm-kpis .hm-alert .value{color:var(--red)}",
      ".hm-toggle{display:flex;gap:6px}.hm-toggle .btn{width:auto}",
      ".hm-mapwrap{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:16px}",
      ".hm-tilemap{direction:ltr;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-auto-rows:80px;gap:6px;max-width:540px;margin:0 auto;width:100%}",
      ".hm-tile{border-radius:12px;border:2px solid transparent;padding:8px;cursor:pointer;display:flex;flex-direction:column;justify-content:space-between;align-items:stretch;direction:rtl;text-align:start;font:inherit;transition:transform .12s;min-width:0}",
      ".hm-tile:hover{transform:translateY(-2px)}.hm-tile.sel{border-color:var(--ink)}",
      ".hm-tile b{font-size:12px;line-height:1.3}.hm-tile span{font-size:17px;font-weight:800;font-variant-numeric:tabular-nums}.hm-tile small{font-size:10px;opacity:.85}",
      ".hm-svgmap{max-width:600px;margin:0 auto;width:100%}",
      ".hm-svgmap svg{display:block;width:100%;height:auto;direction:ltr}",
      ".hm-svgmap text{font-family:inherit;direction:ltr;pointer-events:none}",
      ".hm-gpath{stroke:#fff;stroke-width:1.2;cursor:pointer;transition:opacity .12s}.hm-gpath:hover{opacity:.82}",
      ".hm-glabel{cursor:pointer}",
      ".hm-govchips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:10px}",
      ".hm-chip{border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:999px;padding:4px 10px;font:inherit;font-size:11px;cursor:pointer}",
      ".hm-chip b{color:var(--primary2);margin-inline-start:3px}.hm-chip.on{background:var(--primary);border-color:var(--primary);color:#fff}.hm-chip.on b{color:#fff}",
      ".hm-scale{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--muted);margin-top:10px;justify-content:center}.hm-scale i{width:26px;height:10px;border-radius:3px;display:inline-block}",
      ".hm-gov{border:1px solid var(--line);border-radius:14px;padding:14px;min-width:0}",
      ".hm-gov h3{margin:0 0 4px;font-size:15px}",
      ".hm-wil{display:grid;grid-template-columns:1fr auto;gap:4px 10px;font-size:12px;margin-top:10px}",
      ".hm-wil .hm-bar{grid-column:1/-1}",
      ".hm-bar{display:block;height:6px;background:#eef2f5;border-radius:99px;overflow:hidden}.hm-bar i{display:block;height:100%;background:var(--primary)}",
      ".hm-plist{margin:12px 0 0;padding:0;list-style:none;display:grid;gap:6px;font-size:12px}.hm-plist li{border-top:1px solid var(--line);padding-top:6px}",
      ".hm-noloc{margin-top:12px;font-size:12px;background:#fff8e6;border:1px solid #f2dfb0;color:#7a5a10;border-radius:10px;padding:9px 12px}",
      ".hm-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;min-width:0}",
      ".hm-pipe{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}",
      ".hm-stage{display:flex;flex-direction:column;gap:2px;align-items:stretch;text-align:start;border:1px solid var(--line);background:#fff;border-radius:14px;padding:12px;position:relative;cursor:pointer;font:inherit;color:var(--ink);min-width:0}",
      ".hm-stage b{font-size:13px}.hm-big{font-size:28px;font-weight:800;color:var(--primary2);line-height:1.2}",
      ".hm-stage .hm-bar{margin-top:6px}",
      ".hm-stage.arrow:after{content:'';position:absolute;inset-inline-end:-9px;top:50%;width:8px;height:8px;border-top:2px solid #94a3b8;border-inline-end:2px solid #94a3b8;transform:translateY(-50%) rotate(45deg);z-index:1}",
      "html[dir=rtl] #page-dashboard .hm-stage.arrow:after{transform:translateY(-50%) rotate(-135deg)}",
      ".hm-stage.stuck{background:#fff7f6;border-color:#f5cfcb}.hm-stage.stuck .hm-big{color:var(--red)}.hm-stage.stuck .hm-bar i{background:var(--red)}",
      ".hm-stage.sel{outline:2px solid var(--ink)}",
      ".hm-stage-list{margin-top:12px;font-size:12px;line-height:1.9}",
      ".hm-svg{width:100%;overflow:hidden}.hm-svg text{font-family:inherit}.hm-dot{cursor:pointer}",
      ".hm-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:var(--muted);margin-top:10px}",
      ".hm-legend-top{margin-top:0}",
      ".hm-legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-inline-end:5px;vertical-align:-1px}",
      ".hm-legend i.ext,.hm-gbar.ext{background:repeating-linear-gradient(45deg,#e7a64a,#e7a64a 4px,#f3c88a 4px,#f3c88a 8px)}",
      ".hm-legend i.ok{background:#cdebd8}.hm-legend i.rev{background:#fbe6bd}.hm-legend i.miss{background:#f8cfcb}.hm-legend i.none{background:#f3f5f7}",
      ".hm-gantt{display:grid;gap:6px}",
      ".hm-grow,.hm-gaxis{display:grid;grid-template-columns:240px minmax(0,1fr);gap:10px;align-items:center;font-size:12px}",
      ".hm-nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}",
      ".hm-gtrack{position:relative;height:20px;direction:ltr}",
      ".hm-gbar{position:absolute;top:3px;height:14px;border-radius:5px;background:var(--primary)}",
      ".hm-gbar.stuck{background:var(--red)}.hm-gbar.done{background:#9fb3bf}",
      ".hm-today{position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--ink);opacity:.6}",
      ".hm-gaxis{font-size:10px;color:var(--muted);margin-bottom:4px}",
      ".hm-gaxis>div:last-child{position:relative;height:16px;direction:ltr}",
      ".hm-gaxis span{position:absolute;transform:translateX(-50%);white-space:nowrap}",
      ".hm-gaxis .hm-today-l{color:var(--ink);font-weight:700;top:-2px}",
      ".hm-more{display:flex;justify-content:center;margin-top:12px}.hm-more .btn{width:auto}",
      ".hm-heatwrap{overflow-x:auto}",
      ".hm-heat{width:100%;border-collapse:separate;border-spacing:4px;font-size:12px;min-width:560px}",
      ".hm-heat th{font-weight:700;color:var(--muted);font-size:11px;text-align:center;white-space:nowrap}",
      ".hm-heat th:first-child{text-align:start}",
      ".hm-heat td.hm-c{width:62px;height:30px;border-radius:7px;text-align:center;font-size:11px;font-weight:700;direction:ltr}",
      ".hm-c.ok{background:#cdebd8;color:#13612f}.hm-c.rev{background:#fbe6bd;color:#7a4b00}.hm-c.miss{background:#f8cfcb;color:#8e1d16}.hm-c.none{background:#f3f5f7;color:#b8c1cc}",
      ".hm-heat td.hm-e{max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".table-wrap .hm-table{min-width:620px}",
      ".hm-table td:first-child{white-space:normal;min-width:180px}",
      ".hm-mini{display:inline-block;width:64px;height:6px;border-radius:99px;background:#eef2f5;vertical-align:middle;margin-inline-start:6px;overflow:hidden}.hm-mini i{display:block;height:100%}",
      ".hm-rank{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:6px;background:var(--soft);color:var(--primary2);font-weight:800;font-size:11px;margin-inline-end:6px}",
      ".hm-cos{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 24px}",
      ".hm-co{margin-bottom:12px}.hm-co-top{display:flex;justify-content:space-between;gap:8px;font-size:12px;align-items:center}",
      ".hm-cobar{height:10px;background:#eef2f5;border-radius:99px;margin:6px 0 3px;overflow:hidden}.hm-cobar i{display:block;height:100%;background:var(--primary)}",
      ".hm-news{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}",
      ".hm-new{border:1px solid var(--line);border-radius:14px;padding:14px;min-width:0}",
      ".hm-new ul{margin:8px 0 0;padding:0;list-style:none;font-size:12px;display:grid;gap:4px}",
    ];
    const s = document.createElement("style");
    s.id = "icv-home-style";
    s.textContent =
      css.map(scope).join("") +
      "@media(max-width:1200px){" + P + ".hm-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}" + P + ".hm-mapwrap," + P + ".hm-grid{grid-template-columns:1fr}}" +
      "@media(max-width:760px){" + P + ".hm-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}" + P + ".hm-kpis .value{font-size:17px}" + P + ".hm-pipe{grid-template-columns:1fr 1fr}" + P + ".hm-stage.arrow:after{display:none}" +
      P + ".hm-grow," + P + ".hm-gaxis{grid-template-columns:110px minmax(0,1fr)}" + P + ".hm-news," + P + ".hm-cos{grid-template-columns:1fr}" + P + ".hm-tilemap{grid-auto-rows:64px;gap:4px}" + P + ".hm-tile{padding:5px}" + P + ".hm-tile b{font-size:10px}" + P + ".hm-tile span{font-size:13px}}";
    document.head.appendChild(s);
  }

  const install = () => {
    if (!window.icvStructure) return false;
    window.icvStructure.renderDashboard = render;
    return true;
  };
  if (!install()) document.addEventListener("DOMContentLoaded", install);
  window.icvRenderHome = render;
})();
