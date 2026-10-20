/* Automatic sign-out after two full hours without activity.
 * Any use of the platform (mouse, keyboard, touch, scroll) in any open tab restarts the two hours:
 * the last activity time is shared between tabs through localStorage.
 * Five minutes before the end a notice offers to continue the session.
 * Signing out here ends this browser's session only; other devices keep theirs.
 */
(function () {
  "use strict";
  if (window.__icvIdleInstalled) return;
  window.__icvIdleInstalled = true;

  const LIMIT_MS = 2 * 60 * 60 * 1000;
  const WARN_MS = 5 * 60 * 1000;
  const SAVE_EVERY_MS = 15 * 1000;
  const CHECK_EVERY_MS = 20 * 1000;
  const KEY_LAST = "icv-last-activity";
  const KEY_FLAG = "icv-idle-logout";
  const URL = "https://bmwtrnosqosbkezdswcx.supabase.co";
  const KEY = "sb_publishable_Ge88ZuNnqW89l0SMfw_mvQ_nY2BzpPr";

  const isEn = () => {
    try {
      return localStorage.getItem("icv-ui-language") === "en";
    } catch (e) {
      return false;
    }
  };
  const T = (ar, en) => (isEn() ? en : ar);
  const store = {
    get(k) {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    },
    del(k) {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    },
  };

  if (!window.supabase?.createClient) return;
  const client = window.supabase.createClient(URL, KEY);

  let lastSaved = 0;
  let memoryLast = Date.now();
  let loggingOut = false;

  const lastActivity = () => Math.max(memoryLast, Number(store.get(KEY_LAST)) || 0);
  let expiring = false;
  function markActive() {
    const now = Date.now();
    // Activity after two idle hours (e.g. the first click on a tab left open) must not revive the session.
    if (now - lastActivity() >= LIMIT_MS) {
      if (expiring) return;
      expiring = true;
      signedIn().then((on) => {
        expiring = false;
        if (on) return logout();
        lastSaved = 0; // signed out (login screen): start counting from now
        memoryLast = Date.now();
        markActive();
      });
      return;
    }
    memoryLast = now;
    if (now - lastSaved >= SAVE_EVERY_MS) {
      lastSaved = now;
      store.set(KEY_LAST, String(now));
    }
    hideWarning();
  }

  async function signedIn() {
    try {
      const { data } = await client.auth.getSession();
      return !!data?.session;
    } catch (e) {
      return false;
    }
  }

  async function logout() {
    if (loggingOut) return;
    loggingOut = true;
    store.set(KEY_FLAG, "1");
    try {
      await client.auth.signOut({ scope: "local" });
    } catch (e) {}
    const onIndex = /(^|\/)(index\.html)?$/.test(location.pathname);
    if (onIndex) location.reload();
    else location.href = "index.html";
  }

  // ---- Warning shown in the last five minutes --------------------------------------------
  let warnEl = null;
  function showWarning(msLeft) {
    if (!warnEl) {
      warnEl = document.createElement("div");
      warnEl.id = "icvIdleWarning";
      warnEl.setAttribute("role", "alertdialog");
      warnEl.setAttribute("aria-live", "assertive");
      warnEl.style.cssText =
        "position:fixed;inset-inline:16px;bottom:16px;margin:0 auto;max-width:460px;z-index:100000;background:#fff;color:#162033;border:1px solid #f2dfb0;" +
        "border-radius:16px;box-shadow:0 18px 50px rgba(15,23,42,.22);padding:16px;font:inherit;font-size:14px;line-height:1.7;direction:" + (isEn() ? "ltr" : "rtl");
      warnEl.innerHTML =
        '<b style="display:block;margin-bottom:4px">' + T("ستنتهي جلستك قريباً", "Your session is about to end") + "</b>" +
        '<div data-idle-text></div><button type="button" data-idle-continue style="margin-top:10px;height:38px;border-radius:10px;border:0;background:var(--primary,#0f766e);color:#fff;font:inherit;font-weight:700;padding:0 16px;cursor:pointer">' +
        T("متابعة الجلسة", "Stay signed in") + "</button>";
      warnEl.querySelector("[data-idle-continue]").onclick = () => {
        lastSaved = 0;
        markActive();
      };
      document.body.appendChild(warnEl);
    }
    const min = Math.max(1, Math.ceil(msLeft / 60000));
    warnEl.querySelector("[data-idle-text]").textContent = T(
      "لم يُسجَّل أي نشاط منذ مدة. سيتم تسجيل خروجك تلقائياً خلال " + min + (min === 1 ? " دقيقة" : " دقائق") + ".",
      "No activity for a while. You will be signed out automatically in " + min + (min === 1 ? " minute" : " minutes") + ".",
    );
  }
  function hideWarning() {
    if (warnEl) {
      warnEl.remove();
      warnEl = null;
    }
  }

  async function check() {
    if (loggingOut) return;
    if (!(await signedIn())) {
      hideWarning();
      return;
    }
    const idle = Date.now() - lastActivity();
    if (idle >= LIMIT_MS) return logout();
    if (idle >= LIMIT_MS - WARN_MS) showWarning(LIMIT_MS - idle);
    else hideWarning();
  }

  // ---- Message on the login screen after an automatic sign-out ----------------------------
  function showLoginNotice() {
    if (store.get(KEY_FLAG) !== "1") return;
    const put = () => {
      const box = document.getElementById("authMsg");
      if (!box) return false;
      box.textContent = T("تم تسجيل خروجك تلقائياً بعد ساعتين من عدم النشاط. سجّل الدخول مرة أخرى.", "You were signed out automatically after two hours of inactivity. Please sign in again.");
      store.del(KEY_FLAG);
      return true;
    };
    if (!put()) document.addEventListener("DOMContentLoaded", put, { once: true });
  }

  // ---- Start --------------------------------------------------------------------------------
  // On opening a page, a session idle for two hours or more (e.g. a laptop left closed) ends at once.
  (async () => {
    const stored = Number(store.get(KEY_LAST)) || 0;
    if (stored && Date.now() - stored >= LIMIT_MS && (await signedIn())) return logout();
    memoryLast = Date.now();
    lastSaved = Date.now();
    store.set(KEY_LAST, String(memoryLast));
    showLoginNotice();
    ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll", "input"].forEach((ev) =>
      window.addEventListener(ev, markActive, { passive: true, capture: true }),
    );
    // Activity in another tab moves the shared time forward; this tab follows it.
    window.addEventListener("storage", (e) => {
      if (e.key === KEY_LAST) {
        memoryLast = Math.max(memoryLast, Number(e.newValue) || 0);
        if (Date.now() - lastActivity() < LIMIT_MS - WARN_MS) hideWarning();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") check();
    });
    window.addEventListener("focus", check);
    setInterval(check, CHECK_EVERY_MS);
  })();

  window.ICVIdle = { check, lastActivity, LIMIT_MS };
})();
