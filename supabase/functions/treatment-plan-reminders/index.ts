// Reminder + overdue-escalation cron (spec section 7). Reads its schedule
// entirely from tp_reminder_rules — admins edit offsets from the UI, nothing
// here is hardcoded. Every rule fires at most once per case (tp_reminder_sent_log)
// so re-running this on a tight cron schedule is always safe.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACTIVE_STATUSES = ["NEW", "WAITING_ASSIGNMENT", "ASSIGNED", "IMAGES_READY", "ANALYSIS_IN_PROGRESS", "PLAN_IN_PROGRESS", "REVIEW_REQUIRED"];

// deno-lint-ignore no-explicit-any
async function markRuleSent(supabase: any, caseId: string, ruleId: string): Promise<boolean> {
  const { error } = await supabase.from("tp_reminder_sent_log").insert({ case_id: caseId, rule_id: ruleId });
  // 23505 = unique_violation -> another run (or role) already sent this rule for this case.
  if (error && (error as any).code !== "23505") throw error;
  return !error;
}

// deno-lint-ignore no-explicit-any
async function notify(supabase: any, caseId: string, type: string, staffId: string | null) {
  if (!staffId) return;
  await supabase.from("tp_notifications").insert({ case_id: caseId, recipient_staff_id: staffId, channel: "telegram", type });
}

// deno-lint-ignore no-explicit-any
async function notifyAdmins(supabase: any, caseId: string, type: string) {
  const { data: admins } = await supabase.from("admins").select("telegram_id").not("telegram_id", "is", null);
  for (const a of admins ?? []) {
    await supabase.from("tp_notifications").insert({ case_id: caseId, recipient_telegram_id: a.telegram_id, channel: "telegram", type });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE) throw new Error("Supabase env missing");
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: rules } = await supabase.from("tp_reminder_rules").select("*").eq("is_active", true);

    let remindersSent = 0;
    let casesMarkedOverdue = 0;
    const now = Date.now();

    for (const rule of rules ?? []) {
      if (rule.trigger_type === "before_consultation") {
        const offsetMs = (rule.offset_minutes ?? 0) * 60 * 1000;
        const windowStart = new Date(now + offsetMs - 5 * 60 * 1000).toISOString(); // 5-minute tolerance window
        const windowEnd = new Date(now + offsetMs + 5 * 60 * 1000).toISOString();

        const { data: cases } = await supabase
          .from("tp_cases")
          .select("id, responsible_planner_staff_id, primary_doctor_staff_id, status")
          .in("status", ACTIVE_STATUSES)
          .gte("consultation_datetime", windowStart)
          .lte("consultation_datetime", windowEnd);

        for (const c of cases ?? []) {
          const firstTime = await markRuleSent(supabase, c.id, rule.id);
          if (!firstTime) continue;
          if ((rule.notify_roles ?? []).includes("planner")) await notify(supabase, c.id, "reminder_before_consultation", c.responsible_planner_staff_id);
          if ((rule.notify_roles ?? []).includes("doctor")) await notify(supabase, c.id, "reminder_before_consultation", c.primary_doctor_staff_id);
          if ((rule.notify_roles ?? []).includes("admin")) await notifyAdmins(supabase, c.id, "reminder_before_consultation");
          remindersSent++;
        }
      }

      if (rule.trigger_type === "after_deadline") {
        const { data: overdueCases } = await supabase
          .from("tp_cases")
          .select("id, responsible_planner_staff_id, primary_doctor_staff_id, status, deadline")
          .in("status", ACTIVE_STATUSES)
          .not("deadline", "is", null)
          .lt("deadline", new Date(now).toISOString());

        for (const c of overdueCases ?? []) {
          await supabase.from("tp_cases").update({ status: "OVERDUE" }).eq("id", c.id);
          await supabase.from("tp_audit_log").insert({ case_id: c.id, action: "status_changed", details: { to: "OVERDUE", reason: "deadline passed" } });
          casesMarkedOverdue++;

          const firstTime = await markRuleSent(supabase, c.id, rule.id);
          if (!firstTime) continue;
          if ((rule.notify_roles ?? []).includes("planner")) await notify(supabase, c.id, "case_overdue", c.responsible_planner_staff_id);
          if ((rule.notify_roles ?? []).includes("doctor")) await notify(supabase, c.id, "case_overdue", c.primary_doctor_staff_id);
          if ((rule.notify_roles ?? []).includes("admin")) await notifyAdmins(supabase, c.id, "case_overdue");
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, remindersSent, casesMarkedOverdue }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("treatment-plan-reminders error", error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
