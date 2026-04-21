// Appointment eslatmalari (24 soat oldin) — pg_cron har soatda chaqiradi
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendMessage(chatId: number, text: string, lovableKey: string, telegramKey: string) {
  const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': telegramKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`sendMessage failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  return res.json();
}

const reminderText = {
  uz: '🔔 <b>Eslatma!</b>\n\nErtaga sizning qabulingiz bor:',
  ru: '🔔 <b>Напоминание!</b>\n\nЗавтра у вас приём:',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing');
    if (!TELEGRAM_API_KEY) throw new Error('TELEGRAM_API_KEY missing');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase env missing');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 23-25 soat ichida bo'lgan appointmentlar
    const now = new Date();
    const from = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
    const to = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

    const { data: appts, error } = await supabase
      .from('appointments')
      .select('*')
      .in('status', ['new', 'called'])
      .is('reminder_sent_at', null)
      .not('appointment_at', 'is', null)
      .gte('appointment_at', from)
      .lte('appointment_at', to);

    if (error) throw new Error(error.message);

    let sent = 0;
    let failed = 0;

    for (const a of appts ?? []) {
      if (!a.patient_id) continue;
      const { data: p } = await supabase
        .from('patients')
        .select('telegram_id, language')
        .eq('id', a.patient_id)
        .maybeSingle();
      if (!p) continue;

      const lang = (p.language === 'ru' ? 'ru' : 'uz') as 'uz' | 'ru';
      const dt = new Date(a.appointment_at);
      const dateStr = dt.toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

      let text = reminderText[lang] + '\n\n';
      text += `📅 <b>${dateStr}</b>\n`;
      text += `👤 ${escapeHtml(a.full_name)}\n`;
      text += `📞 ${escapeHtml(a.phone)}\n`;
      if (a.notes) text += `📝 ${escapeHtml(a.notes)}\n`;

      try {
        await sendMessage(p.telegram_id, text, LOVABLE_API_KEY, TELEGRAM_API_KEY);
        sent++;
        await supabase
          .from('appointments')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', a.id);
      } catch (e) {
        failed++;
        console.error(`Reminder failed for appt ${a.id}:`, e);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, total: appts?.length ?? 0, sent, failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('telegram-reminders error', error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
