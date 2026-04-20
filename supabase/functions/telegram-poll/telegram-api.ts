// Telegram API yordamchilari (gateway orqali)
const GATEWAY_URL = 'https://connector-gateway.lovable.dev/telegram';

export type InlineButton = { text: string; callback_data?: string; url?: string };
export type InlineKeyboard = InlineButton[][];
export type ReplyKeyboard = { text: string }[][];

export async function tgCall(
  method: string,
  body: Record<string, unknown>,
  lovableKey: string,
  telegramKey: string,
) {
  const res = await fetch(`${GATEWAY_URL}/${method}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableKey}`,
      'X-Connection-Api-Key': telegramKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error(`Telegram ${method} failed`, res.status, data);
    throw new Error(`Telegram ${method} failed [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function sendMessage(
  chatId: number,
  text: string,
  opts: {
    inlineKeyboard?: InlineKeyboard;
    replyKeyboard?: ReplyKeyboard;
    removeKeyboard?: boolean;
    parseMode?: 'HTML' | 'Markdown';
  } = {},
  lovableKey: string,
  telegramKey: string,
) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: opts.parseMode ?? 'HTML',
  };

  if (opts.inlineKeyboard) {
    body.reply_markup = { inline_keyboard: opts.inlineKeyboard };
  } else if (opts.replyKeyboard) {
    body.reply_markup = {
      keyboard: opts.replyKeyboard,
      resize_keyboard: true,
      one_time_keyboard: false,
    };
  } else if (opts.removeKeyboard) {
    body.reply_markup = { remove_keyboard: true };
  }

  return tgCall('sendMessage', body, lovableKey, telegramKey);
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text: string | undefined,
  lovableKey: string,
  telegramKey: string,
) {
  return tgCall(
    'answerCallbackQuery',
    { callback_query_id: callbackQueryId, text: text ?? '' },
    lovableKey,
    telegramKey,
  );
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
