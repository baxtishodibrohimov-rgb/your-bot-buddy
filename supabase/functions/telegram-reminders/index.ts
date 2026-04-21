// Appointment eslatmalari (24 soat oldin) — pg_cron har soatda chaqiradi
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendAppointmentReminders } from '../telegram-poll/notifications.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const result = await sendAppointmentReminders(supabase, LOVABLE_API_KEY, TELEGRAM_API_KEY);

    return new Response(
      JSON.stringify({ ok: true, ...result }),
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
