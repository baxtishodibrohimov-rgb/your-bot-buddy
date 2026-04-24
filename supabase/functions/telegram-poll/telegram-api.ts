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
    protectContent?: boolean;
  } = {},
  lovableKey: string,
  telegramKey: string,
) {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: opts.parseMode ?? 'HTML',
  };

  if (opts.protectContent) {
    body.protect_content = true;
  }

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

// ============= MEDIA YUBORISH =============

type MediaSendOpts = {
  caption?: string;
  inlineKeyboard?: InlineKeyboard;
  parseMode?: 'HTML' | 'Markdown';
};

function buildMediaBody(
  chatId: number,
  fileField: string,
  fileId: string,
  opts: MediaSendOpts,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    [fileField]: fileId,
  };
  if (opts.caption) {
    body.caption = opts.caption;
    body.parse_mode = opts.parseMode ?? 'HTML';
  }
  if (opts.inlineKeyboard) {
    body.reply_markup = { inline_keyboard: opts.inlineKeyboard };
  }
  return body;
}

export async function sendPhoto(
  chatId: number,
  fileId: string,
  opts: MediaSendOpts,
  lovableKey: string,
  telegramKey: string,
) {
  return tgCall('sendPhoto', buildMediaBody(chatId, 'photo', fileId, opts), lovableKey, telegramKey);
}

export async function sendVideo(
  chatId: number,
  fileId: string,
  opts: MediaSendOpts,
  lovableKey: string,
  telegramKey: string,
) {
  return tgCall('sendVideo', buildMediaBody(chatId, 'video', fileId, opts), lovableKey, telegramKey);
}

export async function sendDocument(
  chatId: number,
  fileId: string,
  opts: MediaSendOpts,
  lovableKey: string,
  telegramKey: string,
) {
  return tgCall('sendDocument', buildMediaBody(chatId, 'document', fileId, opts), lovableKey, telegramKey);
}

export async function sendAudio(
  chatId: number,
  fileId: string,
  opts: MediaSendOpts,
  lovableKey: string,
  telegramKey: string,
) {
  return tgCall('sendAudio', buildMediaBody(chatId, 'audio', fileId, opts), lovableKey, telegramKey);
}

export async function sendVoice(
  chatId: number,
  fileId: string,
  opts: MediaSendOpts,
  lovableKey: string,
  telegramKey: string,
) {
  return tgCall('sendVoice', buildMediaBody(chatId, 'voice', fileId, opts), lovableKey, telegramKey);
}

export async function sendAnimation(
  chatId: number,
  fileId: string,
  opts: MediaSendOpts,
  lovableKey: string,
  telegramKey: string,
) {
  return tgCall('sendAnimation', buildMediaBody(chatId, 'animation', fileId, opts), lovableKey, telegramKey);
}

// Universal media yuboruvchi
export async function sendMediaByType(
  chatId: number,
  fileType: string,
  fileId: string,
  opts: MediaSendOpts,
  lovableKey: string,
  telegramKey: string,
) {
  switch (fileType) {
    case 'photo':     return sendPhoto(chatId, fileId, opts, lovableKey, telegramKey);
    case 'video':     return sendVideo(chatId, fileId, opts, lovableKey, telegramKey);
    case 'document':  return sendDocument(chatId, fileId, opts, lovableKey, telegramKey);
    case 'audio':     return sendAudio(chatId, fileId, opts, lovableKey, telegramKey);
    case 'voice':     return sendVoice(chatId, fileId, opts, lovableKey, telegramKey);
    case 'animation': return sendAnimation(chatId, fileId, opts, lovableKey, telegramKey);
    default:          return sendDocument(chatId, fileId, opts, lovableKey, telegramKey);
  }
}
