// Background sync job (spec section 2: "webhook bo'lmasa background sync
// orqali API'ni periodik tekshir"). Triggered by pg_cron every N minutes (see
// the tp_cron migration) and also callable on demand from the admin UI
// ("Sync now" button) with the same effect.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCliniccardsAdapter } from "../_shared/cliniccards/factory.ts";
import { syncSecondConsultations } from "../_shared/cliniccards/case-sync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE) throw new Error("Supabase env missing");

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const adapter = getCliniccardsAdapter();

    const body = await req.json().catch(() => ({}));
    const syncType = body?.manual ? "manual" : "poll";

    const result = await syncSecondConsultations(supabase, adapter, syncType);

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("cliniccards-sync error", error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
