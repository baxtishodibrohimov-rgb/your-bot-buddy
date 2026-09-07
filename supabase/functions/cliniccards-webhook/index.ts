// Webhook receiver (spec section 2: "Agar Cliniccards webhook imkoniyatiga
// ega bo'lsa, webhook ishlat"). Cliniccards' real webhook payload shape is
// unknown until their API docs are provided, so this accepts a small generic
// envelope — { appointmentId } or { appointment: { id } } — and re-runs the
// same idempotent sync path as the poller for just that one appointment.
//
// Protected by a shared secret header (CLINICCARDS_WEBHOOK_SECRET) rather
// than verify_jwt, since the caller is Cliniccards, not a logged-in user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCliniccardsAdapter } from "../_shared/cliniccards/factory.ts";
import { syncSecondConsultations } from "../_shared/cliniccards/case-sync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cliniccards-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const WEBHOOK_SECRET = Deno.env.get("CLINICCARDS_WEBHOOK_SECRET");
    if (WEBHOOK_SECRET) {
      const provided = req.headers.get("x-cliniccards-signature") ?? req.headers.get("x-webhook-secret");
      if (provided !== WEBHOOK_SECRET) {
        return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE) throw new Error("Supabase env missing");

    const body = await req.json().catch(() => ({}));
    const appointmentId: string | undefined =
      body?.appointmentId ?? body?.appointment_id ?? body?.appointment?.id ?? body?.appointment?.appointmentId;

    if (!appointmentId) {
      return new Response(JSON.stringify({ ok: false, error: "appointmentId missing in payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const adapter = getCliniccardsAdapter();
    const result = await syncSecondConsultations(supabase, adapter, "webhook", appointmentId);

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("cliniccards-webhook error", error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
