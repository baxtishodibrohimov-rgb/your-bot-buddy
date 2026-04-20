// Telegram bot polling - har daqiqada chaqiriladi
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { handleUpdate } from './bot-handler.ts';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';
const MAX_RUNTIME_MS = 55_000;
const MIN_REMAINING_MS = 5_000;

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
    const startTime = Date.now();
    let totalProcessed = 0;

    const { data: state, error: stateErr } = await supabase
      .from('telegram_bot_state')
      .select('update_offset')
      .eq('id', 1)
      .single();

    if (stateErr) throw new Error(`State read failed: ${stateErr.message}`);
    let currentOffset: number = state.update_offset;

    while (true) {
      const elapsed = Date.now() - startTime;
      const remainingMs = MAX_RUNTIME_MS - elapsed;
      if (remainingMs < MIN_REMAINING_MS) break;

      const timeout = Math.min(50, Math.floor(remainingMs / 1000) - 5);
      if (timeout < 1) break;

      const response = await fetch(`${GATEWAY_URL}/getUpdates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TELEGRAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offset: currentOffset,
          timeout,
          allowed_updates: ['message', 'callback_query'],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('getUpdates failed', data);
        throw new Error(`getUpdates failed: ${JSON.stringify(data)}`);
      }

      const updates = data.result ?? [];
      if (updates.length === 0) continue;

      // Saqlash (debug uchun)
      const rows = updates.map((u: any) => ({
        update_id: u.update_id,
        chat_id: u.message?.chat?.id ?? u.callback_query?.message?.chat?.id ?? 0,
        text: u.message?.text ?? u.callback_query?.data ?? null,
        raw_update: u,
      }));

      if (rows.length > 0) {
        await supabase.from('telegram_messages').upsert(rows, { onConflict: 'update_id' });
      }

      // Har bir update'ni qayta ishlash
      for (const update of updates) {
        try {
          await handleUpdate(update, supabase, LOVABLE_API_KEY, TELEGRAM_API_KEY);
        } catch (err) {
          console.error('handleUpdate error', err, JSON.stringify(update));
        }
      }

      const newOffset = Math.max(...updates.map((u: any) => u.update_id)) + 1;
      await supabase
        .from('telegram_bot_state')
        .update({ update_offset: newOffset, updated_at: new Date().toISOString() })
        .eq('id', 1);

      currentOffset = newOffset;
      totalProcessed += updates.length;
    }

    return new Response(
      JSON.stringify({ ok: true, processed: totalProcessed, finalOffset: currentOffset }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('telegram-poll error', error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
