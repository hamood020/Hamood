// Creates and updates platform users. Only an active system admin may call it.
// Phase 1 (2026-10-20): adds the section head role and requires an end date for temporary viewers.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

const ALLOWED_ORIGINS = new Set(["https://hamood020.github.io"]);
const ALLOWED_ROLES = ["viewer", "temporary_viewer", "editor", "section_head", "admin"];

const corsFor = (origin: string | null) => {
  const allowed = !!origin && ALLOWED_ORIGINS.has(origin);
  return {
    allowed,
    headers: {
      ...(allowed ? { "Access-Control-Allow-Origin": origin! } : {}),
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
    },
  };
};
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

// Checks shared by create and update. Returns an Arabic message, or null when valid.
function periodProblem(role: string, start: string | null, end: string | null): string | null {
  if (!ALLOWED_ROLES.includes(role)) return "الدور غير صالح";
  if (start && Number.isNaN(Date.parse(start))) return "تاريخ بداية الصلاحية غير صالح";
  if (end && Number.isNaN(Date.parse(end))) return "تاريخ نهاية الصلاحية غير صالح";
  if (start && end && Date.parse(end) <= Date.parse(start)) return "نهاية الصلاحية يجب أن تكون بعد البداية";
  if (role === "temporary_viewer" && !end) return "حدد تاريخ نهاية الصلاحية للمشاهد المؤقت";
  return null;
}

Deno.serve(async (req: Request) => {
  const cors = corsFor(req.headers.get("Origin"));
  if (req.method === "OPTIONS") {
    if (!cors.allowed) return new Response("Origin not allowed", { status: 403 });
    return new Response("ok", { headers: cors.headers });
  }
  if (req.method !== "POST") return json({ ok: false, error: "طريقة الطلب غير مسموحة" }, 405, cors.headers);
  if (!cors.allowed) return json({ ok: false, error: "المصدر غير مسموح" }, 403, cors.headers);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anon || !service) return json({ ok: false, error: "إعدادات الخدمة غير مكتملة" }, 500, cors.headers);

    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) return json({ ok: false, error: "جلسة الدخول غير صالحة" }, 401, cors.headers);

    const token = auth.slice("Bearer ".length);
    const caller = createClient(url, anon, {
      auth: { persistSession: false },
      global: { headers: { Authorization: "Bearer " + token } },
    });
    const { data: authData, error: authError } = await caller.auth.getUser();
    const user = authData?.user;
    if (authError || !user) return json({ ok: false, error: "تعذر التحقق من جلسة الدخول" }, 401, cors.headers);

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: cp, error: profileError } = await admin
      .from("user_profiles")
      .select("id,role,is_active,access_starts_at,access_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) return json({ ok: false, error: "تعذر التحقق من صلاحيات الحساب" }, 500, cors.headers);
    if (!cp || cp.role !== "admin" || cp.is_active !== true) {
      return json({ ok: false, error: "هذه العملية متاحة لمدير النظام النشط فقط" }, 403, cors.headers);
    }

    const now = Date.now();
    if (
      (cp.access_starts_at && new Date(cp.access_starts_at).getTime() > now) ||
      (cp.access_expires_at && new Date(cp.access_expires_at).getTime() <= now)
    ) {
      return json({ ok: false, error: "صلاحية حساب المدير غير سارية حاليًا" }, 403, cors.headers);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ ok: false, error: "بيانات الطلب غير صالحة" }, 400, cors.headers);
    }

    const action = String(body.action || "");

    if (action === "create") {
      const username = String(body.username || "").trim().toLowerCase();
      const displayName = String(body.display_name || "").trim();
      const password = String(body.password || "");
      const role = String(body.role || "viewer");
      const start = body.access_starts_at ? String(body.access_starts_at) : null;
      const end = body.access_expires_at ? String(body.access_expires_at) : null;

      if (!/^[a-z0-9._-]{3,80}$/.test(username)) {
        return json({ ok: false, error: "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية أو أرقام أو . _ -" }, 400, cors.headers);
      }
      if (!displayName) return json({ ok: false, error: "اسم الموظف مطلوب" }, 400, cors.headers);
      if (password.length < 8) return json({ ok: false, error: "كلمة المرور يجب ألا تقل عن 8 أحرف" }, 400, cors.headers);
      const problem = periodProblem(role, start, end);
      if (problem) return json({ ok: false, error: problem }, 400, cors.headers);

      const email = username + "@icv-new.local";
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: displayName, username },
      });
      if (createError || !created?.user?.id) {
        return json({ ok: false, error: "تعذر إنشاء الحساب. تحقق من اسم المستخدم وأنه غير مستخدم مسبقًا." }, 400, cors.headers);
      }

      // The sign-up trigger creates an inactive viewer profile; this sets the real role and activates it.
      const { error: insertError } = await admin.from("user_profiles").upsert(
        {
          id: created.user.id,
          username,
          full_name: displayName,
          role,
          is_active: true,
          access_starts_at: start,
          access_expires_at: end,
        },
        { onConflict: "id" },
      );
      if (insertError) {
        await admin.auth.admin.deleteUser(created.user.id);
        const message = insertError.code === "23505"
          ? "اسم المستخدم مستخدم مسبقًا. اختر اسمًا آخر."
          : "تعذر حفظ ملف المستخدم؛ تم التراجع عن إنشاء الحساب.";
        return json({ ok: false, error: message }, 500, cors.headers);
      }
      return json({ ok: true, user_id: created.user.id }, 200, cors.headers);
    }

    if (action === "update") {
      const userId = String(body.user_id || "");
      const displayName = String(body.display_name || "").trim();
      const role = String(body.role || "viewer");
      const isActive = body.is_active !== false;
      const start = body.access_starts_at ? String(body.access_starts_at) : null;
      const end = body.access_expires_at ? String(body.access_expires_at) : null;

      if (!userId) return json({ ok: false, error: "معرف المستخدم مطلوب" }, 400, cors.headers);
      const problem = periodProblem(role, start, end);
      if (problem) return json({ ok: false, error: problem }, 400, cors.headers);
      if (userId === user.id && (!isActive || role !== "admin")) {
        return json({ ok: false, error: "لا يمكن تعطيل حسابك الحالي أو إزالة صلاحية المدير منه" }, 400, cors.headers);
      }

      const { error: profileUpdateError } = await admin.rpc("admin_update_user_profile_guarded", {
        p_user_id: userId,
        p_full_name: displayName,
        p_role: role,
        p_is_active: isActive,
        p_access_starts_at: start,
        p_access_expires_at: end,
        p_actor_user_id: user.id,
      });
      if (profileUpdateError) {
        const m = profileUpdateError.message || "";
        if (m.includes("INVALID_ACTOR")) {
          return json({ ok: false, error: "انتهت صلاحية الجلسة أو لم تعد تملك صلاحية مدير النظام" }, 403, cors.headers);
        }
        if (m.includes("LAST_ACTIVE_ADMIN")) {
          return json({ ok: false, error: "لا يمكن تعطيل أو تخفيض صلاحية آخر مدير نشط" }, 400, cors.headers);
        }
        if (m.includes("USER_NOT_FOUND")) return json({ ok: false, error: "المستخدم غير موجود" }, 404, cors.headers);
        if (m.includes("INVALID_ACCESS_PERIOD")) {
          return json({ ok: false, error: "نهاية الصلاحية يجب أن تكون بعد البداية" }, 400, cors.headers);
        }
        if (m.includes("EXPIRY_REQUIRED")) {
          return json({ ok: false, error: "حدد تاريخ نهاية الصلاحية للمشاهد المؤقت" }, 400, cors.headers);
        }
        if (m.includes("INVALID_ROLE")) return json({ ok: false, error: "الدور غير صالح" }, 400, cors.headers);
        return json({ ok: false, error: "تعذر تحديث ملف المستخدم" }, 500, cors.headers);
      }

      const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, {
        user_metadata: { full_name: displayName },
      });
      if (authUpdateError) {
        return json({ ok: false, error: "تم تحديث ملف المستخدم، لكن تعذر تحديث بيانات الدخول" }, 500, cors.headers);
      }

      return json({ ok: true }, 200, cors.headers);
    }

    return json({ ok: false, error: "عملية غير معروفة" }, 400, cors.headers);
  } catch {
    return json({ ok: false, error: "حدث خطأ داخلي أثناء معالجة الطلب" }, 500, cors.headers);
  }
});
