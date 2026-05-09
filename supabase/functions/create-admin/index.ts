// Create a new web admin (auth user + admins row).
// Caller must be an authenticated existing admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is an admin
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: meAdmin } = await admin
      .from("admins").select("id, is_super_admin").eq("user_id", userData.user.id).maybeSingle();
    if (!meAdmin) {
      return new Response(JSON.stringify({ error: "Faqat adminlar yangi admin qo'sha oladi" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const full_name = body.full_name ? String(body.full_name) : null;
    const telegram_id = body.telegram_id ? Number(body.telegram_id) : null;
    const is_super_admin = !!body.is_super_admin;

    if (!email || !password || password.length < 6) {
      return new Response(JSON.stringify({ error: "Email va parol (≥6) majburiy" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (is_super_admin && !meAdmin.is_super_admin) {
      return new Response(JSON.stringify({ error: "Super admin yaratish uchun super admin huquqi kerak" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!telegram_id || Number.isNaN(telegram_id)) {
      return new Response(JSON.stringify({ error: "Telegram ID majburiy" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create auth user (auto-confirm so they can sign in immediately)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: full_name ? { full_name } : undefined,
    });
    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message ?? "Foydalanuvchi yaratilmadi" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = created.user.id;

    // Insert into admins
    const { error: insErr } = await admin.from("admins").insert({
      user_id: newUserId,
      telegram_id,
      full_name,
      is_super_admin,
    });
    if (insErr) {
      // rollback auth user
      await admin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, user_id: newUserId, email }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
