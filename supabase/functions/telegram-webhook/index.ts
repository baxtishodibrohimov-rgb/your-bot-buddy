// Telegram webhook - Telegram tomonidan har bir update darhol yuboriladi
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { handleUpdate } from '../telegram-poll/bot-handler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token',
};

async function deriveSecret(telegramApiKey: string): Promise<string> {
  const data = new TextEncoder().encode(`telegram-webhook:${telegramApiKey}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  // base64url
  const b64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const TELEGRAM_API_KEY = Deno.env.get('TELEGRAM_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !TELEGRAM_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing env vars');
    }

    // Telegram secret_token tekshiruvi
    const expected = await deriveSecret(TELEGRAM_API_KEY);
    const actual = req.headers.get('x-telegram-bot-api-secret-token') ?? '';
    if (actual !== expected) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    const update = await req.json();
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Debug uchun saqlash
    const updateId = update.update_id;
    const chatId = update.message?.chat?.id ?? update.callback_query?.message?.chat?.id ?? 0;
    const text = update.message?.text ?? update.callback_query?.data ?? null;
    if (typeof updateId === 'number') {
      await supabase.from('telegram_messages').upsert(
        [{ update_id: updateId, chat_id: chatId, text, raw_update: update }],
        { onConflict: 'update_id' },
      );
    }

    // Asosiy logika - polling bilan bir xil
    try {
      await handleUpdate(update, supabase, LOVABLE_API_KEY, TELEGRAM_API_KEY);
    } catch (err) {
      console.error('handleUpdate error', err, JSON.stringify(update));
    }

    // Telegram'ga darhol 200 qaytaramiz (aks holda u qayta yuboradi)
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('telegram-webhook error', error);
    // 200 qaytaramiz - aks holda Telegram retry qiladi va yana sekinlashadi
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
