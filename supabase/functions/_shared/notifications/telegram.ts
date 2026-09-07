// Thin wrapper around the same Telegram connector gateway already used by
// supabase/functions/telegram-reminders — kept here so every treatment-plan
// notification (assignment, reminders, overdue escalation) sends the same
// way, with an optional inline "open the case" button.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  opts?: { buttonUrl?: string; buttonLabel?: string },
) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const telegramKey = Deno.env.get("TELEGRAM_API_KEY");
  if (!lovableKey || !telegramKey) {
    throw new Error("LOVABLE_API_KEY / TELEGRAM_API_KEY not configured");
  }

  const body: Record<string, unknown> = { chat_id: chatId, text, parse_mode: "HTML" };
  if (opts?.buttonUrl) {
    body.reply_markup = {
      inline_keyboard: [[{ text: opts.buttonLabel ?? "Ochish", url: opts.buttonUrl }]],
    };
  }

  const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": telegramKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`sendMessage failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  return res.json();
}
