// Media kutubxona va biriktirmalar (rasm, video, hujjat va h.k.)
import {
  sendMessage,
  sendMediaByType,
  answerCallbackQuery,
  escapeHtml,
  type InlineKeyboard,
} from './telegram-api.ts';
import { t, type Lang } from './i18n.ts';

type Patient = {
  id: string;
  telegram_id: number;
  language: Lang;
  state: string | null;
  state_data: Record<string, unknown> | null;
};

type Admin = {
  id: string;
  telegram_id: number;
  full_name: string | null;
  is_super_admin: boolean;
};

type FileType = 'photo' | 'video' | 'document' | 'audio' | 'voice' | 'animation';

const PAGE_SIZE = 8;

async function setState(supabase: any, patientId: string, state: string | null, stateData: any = null) {
  await supabase.from('patients').update({ state, state_data: stateData }).eq('id', patientId);
}

function fileTypeLabel(type: string, lang: Lang): string {
  const map: Record<string, keyof typeof t> = {
    photo: 'mediaTypePhoto',
    video: 'mediaTypeVideo',
    document: 'mediaTypeDocument',
    audio: 'mediaTypeAudio',
    voice: 'mediaTypeVoice',
    animation: 'mediaTypeAnimation',
  };
  const key = map[type];
  if (!key) return type;
  return (t[key] as { uz: string; ru: string })[lang];
}

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ============= MEDIA QABUL QILISH (admin botga yuborganda) =============

/**
 * Telegram update'idan media ma'lumotlarini chiqaradi.
 * Agar message'da media yo'q bo'lsa null.
 */
export function extractMediaFromMessage(msg: any): {
  file_id: string;
  file_unique_id: string | null;
  file_type: FileType;
  mime_type: string | null;
  file_size: number | null;
  file_name: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  thumbnail_file_id: string | null;
  caption: string | null;
} | null {
  if (!msg) return null;
  const caption: string | null = msg.caption ?? null;

  // Photo: massiv (eng katta o'lchamni olamiz)
  if (Array.isArray(msg.photo) && msg.photo.length > 0) {
    const largest = msg.photo[msg.photo.length - 1];
    return {
      file_id: largest.file_id,
      file_unique_id: largest.file_unique_id ?? null,
      file_type: 'photo',
      mime_type: 'image/jpeg',
      file_size: largest.file_size ?? null,
      file_name: null,
      width: largest.width ?? null,
      height: largest.height ?? null,
      duration: null,
      thumbnail_file_id: null,
      caption,
    };
  }

  if (msg.video) {
    return {
      file_id: msg.video.file_id,
      file_unique_id: msg.video.file_unique_id ?? null,
      file_type: 'video',
      mime_type: msg.video.mime_type ?? 'video/mp4',
      file_size: msg.video.file_size ?? null,
      file_name: msg.video.file_name ?? null,
      width: msg.video.width ?? null,
      height: msg.video.height ?? null,
      duration: msg.video.duration ?? null,
      thumbnail_file_id: msg.video.thumbnail?.file_id ?? null,
      caption,
    };
  }

  if (msg.animation) {
    return {
      file_id: msg.animation.file_id,
      file_unique_id: msg.animation.file_unique_id ?? null,
      file_type: 'animation',
      mime_type: msg.animation.mime_type ?? 'video/mp4',
      file_size: msg.animation.file_size ?? null,
      file_name: msg.animation.file_name ?? null,
      width: msg.animation.width ?? null,
      height: msg.animation.height ?? null,
      duration: msg.animation.duration ?? null,
      thumbnail_file_id: msg.animation.thumbnail?.file_id ?? null,
      caption,
    };
  }

  if (msg.document) {
    return {
      file_id: msg.document.file_id,
      file_unique_id: msg.document.file_unique_id ?? null,
      file_type: 'document',
      mime_type: msg.document.mime_type ?? null,
      file_size: msg.document.file_size ?? null,
      file_name: msg.document.file_name ?? null,
      width: null,
      height: null,
      duration: null,
      thumbnail_file_id: msg.document.thumbnail?.file_id ?? null,
      caption,
    };
  }

  if (msg.audio) {
    return {
      file_id: msg.audio.file_id,
      file_unique_id: msg.audio.file_unique_id ?? null,
      file_type: 'audio',
      mime_type: msg.audio.mime_type ?? 'audio/mpeg',
      file_size: msg.audio.file_size ?? null,
      file_name: msg.audio.file_name ?? null,
      width: null,
      height: null,
      duration: msg.audio.duration ?? null,
      thumbnail_file_id: null,
      caption,
    };
  }

  if (msg.voice) {
    return {
      file_id: msg.voice.file_id,
      file_unique_id: msg.voice.file_unique_id ?? null,
      file_type: 'voice',
      mime_type: msg.voice.mime_type ?? 'audio/ogg',
      file_size: msg.voice.file_size ?? null,
      file_name: null,
      width: null,
      height: null,
      duration: msg.voice.duration ?? null,
      thumbnail_file_id: null,
      caption,
    };
  }

  return null;
}

/**
 * Admin yuborgan mediani kutubxonaga saqlash.
 * Qaytaradi: { id, isDuplicate }
 */
export async function saveAdminMedia(
  supabase: any,
  admin: Admin,
  msg: any,
): Promise<{ id: string; isDuplicate: boolean } | null> {
  const media = extractMediaFromMessage(msg);
  if (!media) return null;

  // Deduplikatsiya: agar shu admin avval shu file_unique_id ni yuklagan bo'lsa, qayta saqlamaymiz
  if (media.file_unique_id) {
    const { data: existing } = await supabase
      .from('media_library')
      .select('id')
      .eq('uploaded_by_admin_id', admin.id)
      .eq('file_unique_id', media.file_unique_id)
      .maybeSingle();
    if (existing) {
      return { id: existing.id, isDuplicate: true };
    }
  }

  const { data, error } = await supabase
    .from('media_library')
    .insert({
      uploaded_by_admin_id: admin.id,
      uploaded_by_telegram_id: admin.telegram_id,
      file_id: media.file_id,
      file_unique_id: media.file_unique_id,
      file_type: media.file_type,
      mime_type: media.mime_type,
      file_size: media.file_size,
      file_name: media.file_name,
      caption: media.caption,
      width: media.width,
      height: media.height,
      duration: media.duration,
      thumbnail_file_id: media.thumbnail_file_id,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('saveAdminMedia error', error);
    return null;
  }
  return { id: data.id, isDuplicate: false };
}

/**
 * Admin botga rasm/video/fayl yuborganda chaqiriladi.
 * Auto-save va admin'ga "biriktirish" tugmasini ko'rsatish.
 */
export async function handleAdminMediaUpload(
  supabase: any,
  patient: Patient,
  admin: Admin,
  chatId: number,
  msg: any,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const lang = patient.language;
  const result = await saveAdminMedia(supabase, admin, msg);
  if (!result) return false;

  const text = result.isDuplicate
    ? (lang === 'uz'
        ? 'ℹ️ Bu media allaqachon kutubxonada bor.'
        : 'ℹ️ Это медиа уже есть в библиотеке.')
    : t.mediaUploaded[lang];

  await sendMessage(
    chatId,
    text,
    {
      inlineKeyboard: [
        [{ text: t.mediaAttach[lang], callback_data: `med:attach:${result.id}` }],
        [{ text: t.adminMenuMedia[lang], callback_data: 'med:lib' }],
      ],
    },
    lovableKey,
    telegramKey,
  );
  return true;
}

// ============= MEDIA KUTUBXONASI =============

export async function showMediaLibrary(
  supabase: any,
  patient: Patient,
  chatId: number,
  filter: FileType | 'all',
  page: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  let query = supabase
    .from('media_library')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filter !== 'all') {
    query = query.eq('file_type', filter);
  }

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, count } = await query.range(from, to);

  const total = count ?? 0;
  await setState(supabase, patient.id, 'admin:media', { filter, page });

  let text = t.mediaTitle[lang];
  if (!data || data.length === 0) {
    text += t.mediaEmpty[lang];
  } else {
    text += lang === 'uz'
      ? `Jami: <b>${total}</b>${filter !== 'all' ? ` (${fileTypeLabel(filter, lang)})` : ''}\n\n`
      : `Всего: <b>${total}</b>${filter !== 'all' ? ` (${fileTypeLabel(filter, lang)})` : ''}\n\n`;
    for (const m of data) {
      const label = fileTypeLabel(m.file_type, lang);
      const name = m.file_name ?? m.caption ?? `${label} #${String(m.id).slice(0, 8)}`;
      text += `• ${label} — <b>${escapeHtml(String(name).slice(0, 50))}</b> <i>(${formatBytes(m.file_size)})</i>\n`;
    }
  }

  // Filtr tugmalari
  const buttons: InlineKeyboard = [
    [
      { text: filter === 'all' ? '✅ ' + t.mediaShowAll[lang] : t.mediaShowAll[lang], callback_data: 'med:lib:all:0' },
    ],
    [
      { text: filter === 'photo' ? '✅ ' + t.mediaFilterPhotos[lang] : t.mediaFilterPhotos[lang], callback_data: 'med:lib:photo:0' },
      { text: filter === 'video' ? '✅ ' + t.mediaFilterVideos[lang] : t.mediaFilterVideos[lang], callback_data: 'med:lib:video:0' },
      { text: filter === 'document' ? '✅ ' + t.mediaFilterDocs[lang] : t.mediaFilterDocs[lang], callback_data: 'med:lib:document:0' },
    ],
  ];

  // Har bir media uchun "ko'rish" tugmasi
  if (data && data.length > 0) {
    for (const m of data) {
      const label = fileTypeLabel(m.file_type, lang);
      const short = (m.file_name ?? m.caption ?? `#${String(m.id).slice(0, 6)}`).slice(0, 25);
      buttons.push([{ text: `${label}: ${short}`, callback_data: `med:view:${m.id}` }]);
    }
  }

  // Sahifalash
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);
  const navRow: { text: string; callback_data: string }[] = [];
  if (page > 0) {
    navRow.push({ text: '◀️', callback_data: `med:lib:${filter}:${page - 1}` });
  }
  if (page < lastPage) {
    navRow.push({ text: '▶️', callback_data: `med:lib:${filter}:${page + 1}` });
  }
  if (navRow.length > 0) {
    buttons.push(navRow);
  }

  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

// ============= BITTA MEDIA TAFSILOTI =============

export async function showMediaItem(
  supabase: any,
  patient: Patient,
  chatId: number,
  mediaId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: m } = await supabase.from('media_library').select('*').eq('id', mediaId).maybeSingle();
  if (!m) {
    await sendMessage(chatId, '—', {}, lovableKey, telegramKey);
    return;
  }

  // Biriktirmalar ro'yxati
  const { data: attachments } = await supabase
    .from('media_attachments')
    .select('id, entity_type, entity_id')
    .eq('media_id', mediaId);

  // Biriktirilgan entity nomlarini olish
  const attachLines: string[] = [];
  if (attachments && attachments.length > 0) {
    for (const a of attachments) {
      let name = '?';
      if (a.entity_type === 'staff' && a.entity_id) {
        const { data } = await supabase.from('staff').select('full_name').eq('id', a.entity_id).maybeSingle();
        name = `👤 ${data?.full_name ?? '?'}`;
      } else if (a.entity_type === 'staff_position' && a.entity_id) {
        const posKey = a.entity_id as keyof typeof t.staffPositions;
        const label = t.staffPositions[posKey]?.[lang] ?? a.entity_id;
        name = label;
      } else if (a.entity_type === 'service' && a.entity_id) {
        const { data } = await supabase.from('services').select('name_uz, name_ru').eq('id', a.entity_id).maybeSingle();
        name = `🦷 ${(lang === 'uz' ? data?.name_uz : data?.name_ru) ?? '?'}`;
      } else if (a.entity_type === 'clinic') {
        name = `🏥 ${t.adminMenu.clinic[lang]}`;
      }
      attachLines.push(`  • ${escapeHtml(name)}`);
    }
  }

  const caption = lang === 'uz'
    ? `${fileTypeLabel(m.file_type, lang)}\n` +
      `<b>${t.mediaSize[lang]}:</b> ${formatBytes(m.file_size)}\n` +
      (m.file_name ? `<b>Fayl:</b> ${escapeHtml(m.file_name)}\n` : '') +
      (m.caption ? `<b>Izoh:</b> ${escapeHtml(m.caption)}\n` : '') +
      `<b>${t.mediaUploaded2[lang]}:</b> ${new Date(m.created_at).toLocaleString('ru-RU')}\n\n` +
      `<b>${t.mediaAttachedTo[lang]}:</b>\n${attachLines.length ? attachLines.join('\n') : '  ' + t.mediaNotAttached[lang]}`
    : `${fileTypeLabel(m.file_type, lang)}\n` +
      `<b>${t.mediaSize[lang]}:</b> ${formatBytes(m.file_size)}\n` +
      (m.file_name ? `<b>Файл:</b> ${escapeHtml(m.file_name)}\n` : '') +
      (m.caption ? `<b>Подпись:</b> ${escapeHtml(m.caption)}\n` : '') +
      `<b>${t.mediaUploaded2[lang]}:</b> ${new Date(m.created_at).toLocaleString('ru-RU')}\n\n` +
      `<b>${t.mediaAttachedTo[lang]}:</b>\n${attachLines.length ? attachLines.join('\n') : '  ' + t.mediaNotAttached[lang]}`;

  const buttons: InlineKeyboard = [
    [{ text: t.mediaAttach[lang], callback_data: `med:attach:${mediaId}` }],
  ];

  // Mavjud biriktirmalarni olib tashlash
  if (attachments) {
    for (const a of attachments) {
      buttons.push([
        { text: `${t.mediaUnattach[lang]} (${a.entity_type})`, callback_data: `med:unattach:${a.id}` },
      ]);
    }
  }

  buttons.push([{ text: t.mediaDelete[lang], callback_data: `med:del:${mediaId}` }]);
  buttons.push([{ text: t.adminMenuMedia[lang], callback_data: 'med:lib' }]);

  // Mediani caption bilan yuborish
  try {
    await sendMediaByType(chatId, m.file_type, m.file_id, { caption, inlineKeyboard: buttons }, lovableKey, telegramKey);
  } catch (e) {
    console.error('showMediaItem sendMedia failed', e);
    // Agar media yuborilmasa, kamida matn bilan ko'rsatamiz
    await sendMessage(chatId, caption, { inlineKeyboard: buttons }, lovableKey, telegramKey);
  }
}

// ============= MEDIA O'CHIRISH =============

export async function deleteMediaItem(
  supabase: any,
  patient: Patient,
  chatId: number,
  mediaId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await supabase.from('media_library').delete().eq('id', mediaId);
  await sendMessage(chatId, t.mediaDeleted[lang], {}, lovableKey, telegramKey);
  await showMediaLibrary(supabase, patient, chatId, 'all', 0, lovableKey, telegramKey);
}

// ============= BIRIKTIRISH OQIMI =============

export async function startAttachFlow(
  supabase: any,
  patient: Patient,
  chatId: number,
  mediaId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await setState(supabase, patient.id, 'admin:media:attach', { mediaId });
  await sendMessage(
    chatId,
    t.mediaPickEntity[lang],
    {
      inlineKeyboard: [
        [{ text: t.mediaEntityDoctor[lang], callback_data: `med:at:staff_position:${mediaId}` }],
        [{ text: t.mediaEntityService[lang], callback_data: `med:at:service:${mediaId}` }],
        [{ text: t.mediaEntityClinic[lang], callback_data: `med:at:clinic:${mediaId}` }],
      ],
    },
    lovableKey,
    telegramKey,
  );
}

export async function pickAttachTarget(
  supabase: any,
  patient: Patient,
  chatId: number,
  entityType: 'staff' | 'staff_position' | 'service' | 'clinic',
  mediaId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;

  if (entityType === 'clinic') {
    await attachMedia(supabase, patient, chatId, mediaId, 'clinic', null, lovableKey, telegramKey);
    return;
  }

  if (entityType === 'staff_position') {
    // Lavozim tanlash menyusi
    const positions: Array<keyof typeof t.staffPositions> = [
      'registratura', 'koordinator', 'shifokor', 'shifokor_yordamchisi', 'hisobchi', 'sterilizatsiya',
    ];
    const buttons: InlineKeyboard = positions.map((p) => [
      { text: t.staffPositions[p][lang], callback_data: `med:do:staff_position:${mediaId}:${p}` },
    ]);
    await sendMessage(chatId, lang === 'uz' ? 'Qaysi lavozimga?' : 'К какой должности?', { inlineKeyboard: buttons }, lovableKey, telegramKey);
    return;
  }

  if (entityType === 'service') {
    const { data } = await supabase.from('services').select('id, name_uz, name_ru').order('sort_order').limit(50);
    if (!data || data.length === 0) {
      await sendMessage(chatId, t.noServices[lang], {}, lovableKey, telegramKey);
      return;
    }
    const buttons: InlineKeyboard = data.map((s: any) => [
      { text: `🦷 ${(lang === 'uz' ? s.name_uz : s.name_ru).slice(0, 40)}`, callback_data: `med:do:service:${mediaId}:${s.id}` },
    ]);
    await sendMessage(chatId, t.mediaPickService[lang], { inlineKeyboard: buttons }, lovableKey, telegramKey);
    return;
  }
}

export async function attachMedia(
  supabase: any,
  patient: Patient,
  chatId: number,
  mediaId: string,
  entityType: 'staff' | 'staff_position' | 'service' | 'clinic' | 'broadcast',
  entityId: string | null,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { error } = await supabase.from('media_attachments').insert({
    media_id: mediaId,
    entity_type: entityType,
    entity_id: entityId,
  });

  if (error) {
    if (error.code === '23505') {
      await sendMessage(chatId, t.mediaAlreadyAttached[lang], {}, lovableKey, telegramKey);
    } else {
      await sendMessage(chatId, `⚠️ ${error.message}`, {}, lovableKey, telegramKey);
    }
    return;
  }

  await setState(supabase, patient.id, 'admin:menu', null);
  await sendMessage(chatId, t.mediaAttached[lang], {}, lovableKey, telegramKey);
}

export async function unattachMedia(
  supabase: any,
  patient: Patient,
  chatId: number,
  attachmentId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await supabase.from('media_attachments').delete().eq('id', attachmentId);
  await sendMessage(chatId, t.mediaUnattached[lang], {}, lovableKey, telegramKey);
}

// ============= ENTITY UCHUN BIRIKTIRILGAN MEDIANI KO'RSATISH =============

/**
 * Admin entity tahrirlashda — biriktirilgan media ro'yxati
 */
export async function showEntityMedia(
  supabase: any,
  patient: Patient,
  chatId: number,
  entityType: 'staff' | 'staff_position' | 'service' | 'clinic',
  entityId: string | null,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  let query = supabase
    .from('media_attachments')
    .select('id, media_id, sort_order, media_library(id, file_type, file_id, file_name, caption, file_size)')
    .eq('entity_type', entityType)
    .order('sort_order');

  if (entityId) {
    query = query.eq('entity_id', entityId);
  } else {
    query = query.is('entity_id', null);
  }

  const { data } = await query;

  let text = t.entityMediaTitle[lang];
  if (!data || data.length === 0) {
    text += t.entityMediaEmpty[lang];
    await sendMessage(
      chatId,
      text,
      {
        inlineKeyboard: [[{ text: t.entityMediaGoLib[lang], callback_data: 'med:lib' }]],
      },
      lovableKey,
      telegramKey,
    );
    return;
  }

  text += lang === 'uz' ? `Jami: <b>${data.length}</b>\n\n` : `Всего: <b>${data.length}</b>\n\n`;
  for (const a of data) {
    const m = a.media_library;
    if (!m) continue;
    const label = fileTypeLabel(m.file_type, lang);
    const name = m.file_name ?? m.caption ?? `#${String(m.id).slice(0, 6)}`;
    text += `• ${label} — ${escapeHtml(String(name).slice(0, 40))}\n`;
  }

  const buttons: InlineKeyboard = [];
  for (const a of data) {
    const m = a.media_library;
    if (!m) continue;
    const label = fileTypeLabel(m.file_type, lang);
    buttons.push([
      { text: `👁 ${label}`, callback_data: `med:view:${m.id}` },
      { text: `➖`, callback_data: `med:unattach:${a.id}` },
    ]);
  }
  buttons.push([{ text: t.entityMediaGoLib[lang], callback_data: 'med:lib' }]);

  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

// ============= BEMORGA MEDIA YUBORISH (shifokor/xizmat ko'rsatilganda) =============

export async function sendEntityMediaToUser(
  supabase: any,
  chatId: number,
  entityType: 'staff' | 'staff_position' | 'service' | 'clinic',
  entityId: string | null,
  lovableKey: string,
  telegramKey: string,
) {
  let query = supabase
    .from('media_attachments')
    .select('caption_override, sort_order, media_library(file_type, file_id, caption)')
    .eq('entity_type', entityType)
    .order('sort_order');

  if (entityId) {
    query = query.eq('entity_id', entityId);
  } else {
    query = query.is('entity_id', null);
  }

  const { data } = await query;
  if (!data || data.length === 0) return;

  for (const a of data) {
    const m = a.media_library;
    if (!m) continue;
    const caption = a.caption_override ?? m.caption ?? undefined;
    try {
      await sendMediaByType(chatId, m.file_type, m.file_id, caption ? { caption } : {}, lovableKey, telegramKey);
    } catch (e) {
      console.error('sendEntityMediaToUser failed', e);
    }
  }
}

// ============= ROUTER =============

/**
 * Media bilan bog'liq callback'larni qayta ishlash. Handle qilingan bo'lsa true.
 */
export async function handleMediaCallback(
  supabase: any,
  patient: Patient,
  chatId: number,
  data: string,
  callbackId: string,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  // Kutubxona (filter va sahifalash bilan)
  if (data === 'med:lib') {
    await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    await showMediaLibrary(supabase, patient, chatId, 'all', 0, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('med:lib:')) {
    // med:lib:{filter}:{page}
    const parts = data.split(':');
    const filter = (parts[2] ?? 'all') as FileType | 'all';
    const page = Number(parts[3] ?? 0) || 0;
    await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    await showMediaLibrary(supabase, patient, chatId, filter, page, lovableKey, telegramKey);
    return true;
  }

  if (data.startsWith('med:view:')) {
    const id = data.slice('med:view:'.length);
    await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    await showMediaItem(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }

  if (data.startsWith('med:del:')) {
    const id = data.slice('med:del:'.length);
    await answerCallbackQuery(callbackId, '🗑', lovableKey, telegramKey);
    await deleteMediaItem(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }

  if (data.startsWith('med:attach:')) {
    const id = data.slice('med:attach:'.length);
    await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    await startAttachFlow(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }

  if (data.startsWith('med:at:')) {
    // med:at:{entityType}:{mediaId}
    const rest = data.slice('med:at:'.length);
    const idx = rest.indexOf(':');
    if (idx > 0) {
      const entityType = rest.slice(0, idx) as 'staff' | 'staff_position' | 'service' | 'clinic';
      const mediaId = rest.slice(idx + 1);
      await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
      await pickAttachTarget(supabase, patient, chatId, entityType, mediaId, lovableKey, telegramKey);
    } else {
      await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    }
    return true;
  }

  if (data.startsWith('med:do:')) {
    // med:do:{entityType}:{mediaId}:{entityId}
    const parts = data.split(':');
    if (parts.length >= 5) {
      const entityType = parts[2] as 'staff' | 'staff_position' | 'service';
      const mediaId = parts[3];
      const entityId = parts[4];
      await answerCallbackQuery(callbackId, '✅', lovableKey, telegramKey);
      await attachMedia(supabase, patient, chatId, mediaId, entityType, entityId, lovableKey, telegramKey);
    } else {
      await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    }
    return true;
  }

  if (data.startsWith('med:unattach:')) {
    const id = data.slice('med:unattach:'.length);
    await answerCallbackQuery(callbackId, '✅', lovableKey, telegramKey);
    await unattachMedia(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }

  // Entity tahrirlashda media tugmasi
  // ent:med:{entityType}:{entityId|-}
  if (data.startsWith('ent:med:')) {
    const rest = data.slice('ent:med:'.length);
    const idx = rest.indexOf(':');
    if (idx > 0) {
      const entityType = rest.slice(0, idx) as 'staff' | 'staff_position' | 'service' | 'clinic';
      const entityId = rest.slice(idx + 1);
      await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
      await showEntityMedia(
        supabase,
        patient,
        chatId,
        entityType,
        entityId === '-' ? null : entityId,
        lovableKey,
        telegramKey,
      );
    } else {
      await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    }
    return true;
  }

  return false;
}
