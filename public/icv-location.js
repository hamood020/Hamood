/* Project location: governorates and wilayats of Oman (11 / 63).
 * Stored in projects.location as {"governorate": ["wilayat", ...]}; an empty list = the whole governorate.
 * The database checks every name against the same list (private.valid_project_location).
 */
(function () {
  "use strict";
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

  // pos = [column, row, column span] on the simplified map (west → east, north → south).
  const GOVS = [
    { k: "مسندم", en: "Musandam", pos: [3, 1, 1], w: ["خصب", "دبا", "بخا", "مدحاء"] },
    { k: "البريمي", en: "Al Buraimi", pos: [2, 2, 1], w: ["البريمي", "محضة", "السنينة"] },
    { k: "شمال الباطنة", en: "North Al Batinah", pos: [3, 2, 1], w: ["صحار", "شناص", "لوى", "صحم", "الخابورة", "السويق"] },
    { k: "الظاهرة", en: "Ad Dhahirah", pos: [2, 3, 1], w: ["عبري", "ينقل", "ضنك"] },
    { k: "جنوب الباطنة", en: "South Al Batinah", pos: [3, 3, 1], w: ["الرستاق", "العوابي", "نخل", "وادي المعاول", "بركاء", "المصنعة"] },
    { k: "مسقط", en: "Muscat", pos: [4, 3, 1], w: ["مسقط", "مطرح", "بوشر", "السيب", "العامرات", "قريات"] },
    { k: "الداخلية", en: "Ad Dakhiliyah", pos: [3, 4, 1], w: ["نزوى", "بهلا", "منح", "الحمراء", "أدم", "إزكي", "سمائل", "بدبد", "الجبل الأخضر"] },
    { k: "شمال الشرقية", en: "North Ash Sharqiyah", pos: [4, 4, 1], w: ["إبراء", "المضيبي", "بدية", "القابل", "وادي بني خالد", "دماء والطائيين", "سناو"] },
    { k: "جنوب الشرقية", en: "South Ash Sharqiyah", pos: [5, 4, 1], w: ["صور", "الكامل والوافي", "جعلان بني بو حسن", "جعلان بني بو علي", "مصيرة"] },
    { k: "الوسطى", en: "Al Wusta", pos: [3, 5, 2], w: ["هيماء", "محوت", "الدقم", "الجازر"] },
    { k: "ظفار", en: "Dhofar", pos: [2, 6, 2], w: ["صلالة", "طاقة", "مرباط", "رخيوت", "ثمريت", "ضلكوت", "المزيونة", "مقشن", "شليم وجزر الحلانيات", "سدح"] },
  ];
  const govName = (k) => {
    const g = GOVS.find((x) => x.k === k);
    return g && isEn() ? g.en : k;
  };

  // Keeps only known names, in the reference order.
  function normalize(loc) {
    const out = {};
    if (!loc || typeof loc !== "object" || Array.isArray(loc)) return out;
    GOVS.forEach((g) => {
      if (Array.isArray(loc[g.k])) out[g.k] = g.w.filter((w) => loc[g.k].includes(w));
    });
    return out;
  }
  const isEmpty = (loc) => !Object.keys(normalize(loc)).length;
  const isNationwide = (loc) => Object.keys(normalize(loc)).length === GOVS.length;

  function format(loc) {
    const n = normalize(loc);
    const keys = Object.keys(n);
    if (!keys.length) return "—";
    if (keys.length === GOVS.length && keys.every((k) => !n[k].length)) return T("على مستوى السلطنة", "Nationwide");
    return keys.map((k) => govName(k) + (n[k].length ? " (" + n[k].join("، ") + ")" : "")).join(" · ");
  }

  // ---- Picker -------------------------------------------------------------------------------
  const states = {};

  function injectStyle() {
    if (document.getElementById("icv-location-style")) return;
    const s = document.createElement("style");
    s.id = "icv-location-style";
    s.textContent =
      ".icv-loc{border:1px solid var(--line);border-radius:14px;padding:14px;margin:12px 0;background:var(--soft,#f6faf9)}" +
      ".icv-loc h4{margin:0;font-size:14px}.icv-loc .icv-loc-hint{font-size:11px;color:var(--muted);margin:2px 0 10px;line-height:1.7}" +
      ".icv-loc-govs{display:flex;flex-wrap:wrap;gap:6px}" +
      ".icv-loc-pick{border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:999px;padding:6px 12px;font:inherit;font-size:12px;cursor:pointer}" +
      ".icv-loc-pick.on{background:var(--primary);border-color:var(--primary);color:#fff}.icv-loc-pick.all{border-style:dashed}" +
      ".icv-loc-wgroups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}" +
      ".icv-loc-wg{border:1px solid var(--line);border-radius:12px;padding:10px;background:#fff;min-width:0}" +
      ".icv-loc-wg-h{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:12px;font-weight:800;margin-bottom:8px}" +
      ".icv-loc-wg-h button{border:0;background:none;color:var(--primary2);font:inherit;font-size:11px;font-weight:700;cursor:pointer;padding:0}" +
      ".icv-loc-wg label{display:inline-flex;align-items:center;gap:5px;font-size:12px;margin-block-end:6px;margin-inline-end:12px;cursor:pointer;font-weight:400}" +
      ".icv-loc-wg input{width:auto;height:auto;margin:0}" +
      ".icv-loc-sum{margin-top:12px;font-size:12px;background:#fff;border:1px dashed var(--line);border-radius:10px;padding:9px 11px;color:var(--primary2)}" +
      ".icv-loc-sum.empty{color:var(--muted)}" +
      "@media(max-width:700px){.icv-loc-wgroups{grid-template-columns:1fr}}";
    document.head.appendChild(s);
  }

  function draw(id) {
    const root = document.getElementById(id),
      st = states[id];
    if (!root || !st) return;
    const loc = st.loc,
      sel = GOVS.filter((g) => loc[g.k]);
    root.innerHTML =
      '<div class="icv-loc"><h4>' + T("الموقع: المحافظة والولاية", "Location: governorate and wilayat") + (st.required ? ' <span style="color:var(--red)">*</span>' : "") + "</h4>" +
      '<div class="icv-loc-hint">' +
      T(
        "اختر محافظة أو أكثر. الولاية اختيارية، ويمكن اختيار أكثر من ولاية (مثل مشاريع الطرق). إن لم تُحدَّد ولاية يُعتبر المشروع على مستوى المحافظة.",
        "Choose one or more governorates. Wilayats are optional and several can be chosen (e.g. road projects). With no wilayat the project covers the whole governorate.",
      ) +
      '</div><div class="icv-loc-govs"><button type="button" class="icv-loc-pick all' + (sel.length === GOVS.length ? " on" : "") + '" data-loc-all>' +
      T("على مستوى السلطنة (كل المحافظات)", "Nationwide (all governorates)") + "</button>" +
      GOVS.map((g) => '<button type="button" class="icv-loc-pick' + (loc[g.k] ? " on" : "") + '" data-loc-gov="' + esc(g.k) + '" aria-pressed="' + !!loc[g.k] + '">' + esc(govName(g.k)) + "</button>").join("") +
      '</div><div class="icv-loc-wgroups">' +
      sel
        .map((g) => {
          const set = loc[g.k];
          return (
            '<div class="icv-loc-wg"><div class="icv-loc-wg-h"><span>' + T("ولايات ", "Wilayats of ") + esc(govName(g.k)) + ' <span style="color:var(--muted);font-weight:400">(' + T("اختياري", "optional") + ')</span></span><button type="button" data-loc-allw="' + esc(g.k) + '">' +
            (set.length === g.w.length ? T("إلغاء الكل", "Clear all") : T("تحديد الكل", "Select all")) + "</button></div>" +
            g.w.map((w) => '<label><input type="checkbox" data-loc-g="' + esc(g.k) + '" value="' + esc(w) + '"' + (set.includes(w) ? " checked" : "") + ">" + esc(w) + "</label>").join("") +
            "</div>"
          );
        })
        .join("") +
      '</div><div class="icv-loc-sum' + (sel.length ? "" : " empty") + '">' +
      (sel.length ? "<b>" + T("سيُحفظ الموقع: ", "Will be saved as: ") + "</b>" + esc(format(loc)) : T("لم تُختر محافظة بعد.", "No governorate selected yet.")) +
      "</div></div>";

    root.querySelectorAll("[data-loc-gov]").forEach(
      (b) =>
        (b.onclick = () => {
          const k = b.dataset.locGov;
          if (loc[k]) delete loc[k];
          else loc[k] = [];
          draw(id);
        }),
    );
    root.querySelector("[data-loc-all]").onclick = () => {
      const all = Object.keys(loc).length === GOVS.length;
      GOVS.forEach((g) => {
        if (all) delete loc[g.k];
        else if (!loc[g.k]) loc[g.k] = [];
      });
      draw(id);
    };
    root.querySelectorAll("[data-loc-g]").forEach(
      (c) =>
        (c.onchange = () => {
          const g = GOVS.find((x) => x.k === c.dataset.locG);
          const set = new Set(loc[g.k]);
          c.checked ? set.add(c.value) : set.delete(c.value);
          loc[g.k] = g.w.filter((w) => set.has(w));
          draw(id);
        }),
    );
    root.querySelectorAll("[data-loc-allw]").forEach(
      (b) =>
        (b.onclick = () => {
          const g = GOVS.find((x) => x.k === b.dataset.locAllw);
          loc[g.k] = loc[g.k].length === g.w.length ? [] : g.w.slice();
          draw(id);
        }),
    );
  }

  function mount(id, value, opts) {
    injectStyle();
    states[id] = { loc: normalize(value), required: !!opts?.required };
    draw(id);
  }
  const value = (id) => normalize(states[id]?.loc);

  window.ICVLocation = { GOVS, normalize, format, isEmpty, isNationwide, govName, mount, value };
})();
