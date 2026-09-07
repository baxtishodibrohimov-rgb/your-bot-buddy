// Outbox dispatcher: sends every pending row in tp_notifications over
// Telegram. Producers (assignment RPC/auto-assignment, reminder cron, review
// flow) only ever INSERT into tp_notifications — this is the single place
// that actually talks to Telegram, so message formatting stays in one spot
// and a Telegram outage just leaves rows pending for the next run (retried
// automatically by pg_cron) instead of losing them.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { escapeHtml, sendTelegramMessage } from "../_shared/notifications/telegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// deno-lint-ignore no-explicit-any
function buildMessage(notification: any, caseRow: any, patient: any): string {
  const patientName = escapeHtml(patient?.full_name ?? "Noma'lum bemor");
  const consultationAt = formatDateTime(caseRow?.consultation_datetime ?? null);
  const deadlineAt = formatDateTime(caseRow?.deadline ?? null);

  switch (notification.type) {
    case "case_assigned":
      return (
        `🦷 <b>Yangi treatment plan sizga biriktirildi.</b>\n\n` +
        `Bemor: <b>${patientName}</b>\n` +
        `2-konsultatsiya: <b>${consultationAt}</b>\n` +
        `Deadline: <b>${deadlineAt}</b>\n\n` +
        `Treatment plan va prezentatsiyani konsultatsiyagacha tayyorlang.`
      );
    case "reminder_before_consultation":
      return (
        `⏰ <b>Eslatma</b>\n\n` +
        `Bemor: <b>${patientName}</b>\n` +
        `2-konsultatsiya: <b>${consultationAt}</b>\n` +
        `Joriy status: <b>${caseRow?.status ?? "—"}</b>\n\n` +
        `Treatment plan hali READY emas — konsultatsiyagacha tayyorlang.`
      );
    case "case_overdue":
      return (
        `🔴 <b>OVERDUE — deadline o'tdi</b>\n\n` +
        `Bemor: <b>${patientName}</b>\n` +
        `2-konsultatsiya: <b>${consultationAt}</b>\n` +
        `Deadline: <b>${deadlineAt}</b>\n` +
        `Joriy status: <b>${caseRow?.status ?? "—"}</b>`
      );
    case "review_requested":
      return (
        `📋 <b>Treatment plan review uchun tayyor.</b>\n\n` +
        `Bemor: <b>${patientName}</b>\n` +
        `2-konsultatsiya: <b>${consultationAt}</b>`
      );
    default:
      return `${escapeHtml(notification.type)} — ${patientName}`;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE) throw new Error("Supabase env missing");
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const appBaseUrl = Deno.env.get("APP_BASE_URL");

    const { data: pending, error } = await supabase
      .from("tp_notifications")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(30);
    if (error) throw error;

    let sent = 0;
    let failed = 0;

    for (const n of pending ?? []) {
      try {
        let recipientTelegramId: number | null = n.recipient_telegram_id ? Number(n.recipient_telegram_id) : null;

        if (!recipientTelegramId && n.recipient_staff_id) {
          const { data: staff } = await supabase
            .from("staff")
            .select("telegram_id")
            .eq("id", n.recipient_staff_id)
            .maybeSingle();
          recipientTelegramId = staff?.telegram_id ? Number(staff.telegram_id) : null;
        }

        if (!recipientTelegramId) {
          await supabase.from("tp_notifications").update({ status: "failed", error: "no usable recipient" }).eq("id", n.id);
          failed++;
          continue;
        }

        let caseRow: any = null;
        let patient: any = null;
        if (n.case_id) {
          const { data: c } = await supabase
            .from("tp_cases")
            .select("id, status, consultation_datetime, deadline, cliniccards_patient_id")
            .eq("id", n.case_id)
            .maybeSingle();
          caseRow = c;
          if (c?.cliniccards_patient_id) {
            const { data: p } = await supabase
              .from("tp_cliniccards_patients")
              .select("full_name")
              .eq("cliniccards_patient_id", c.cliniccards_patient_id)
              .maybeSingle();
            patient = p;
          }
        }

        const text = buildMessage(n, caseRow, patient);
        const buttonUrl = appBaseUrl && n.case_id ? `${appBaseUrl.replace(/\/+$/, "")}/admin/tp/cases/${n.case_id}` : undefined;

        await sendTelegramMessage(recipientTelegramId, text, buttonUrl ? { buttonUrl, buttonLabel: "PLAN'NI OCHISH" } : undefined);

        await supabase.from("tp_notifications").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", n.id);
        sent++;
      } catch (e) {
        failed++;
        await supabase
          .from("tp_notifications")
          .update({ status: "failed", error: e instanceof Error ? e.message : String(e), sent_at: new Date().toISOString() })
          .eq("id", n.id);
        console.error(`notification ${n.id} failed:`, e);
      }
    }

    return new Response(JSON.stringify({ ok: true, total: pending?.length ?? 0, sent, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("treatment-plan-notifications-dispatch error", error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
