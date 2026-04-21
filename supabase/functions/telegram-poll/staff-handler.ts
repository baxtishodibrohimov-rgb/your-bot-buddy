// Xodimlar (staff) — admin bo'limi va /staff buyrug'i
import { sendMessage, escapeHtml, sendMediaByType, type InlineKeyboard, type ReplyKeyboard } from './telegram-api.ts';
import { t, type Lang } from './i18n.ts';

export type StaffPosition =
  | 'registratura'
  | 'koordinator'
  | 'shifokor'
  | 'shifokor_yordamchisi'
  | 'hisobchi'
  | 'sterilizatsiya';

export const STAFF_POSITIONS: StaffPosition[] = [
  'registratura',
  'koordinator',
  'shifokor',
  'shifokor_yordamchisi',
  'hisobchi',
  'sterilizatsiya',
];

type Patient = {
  id: string;
  telegram_id: number;
  language: Lang;
  state: string | null;
  state_data: Record<string, unknown> | null;
};

async function setState(supabase: any, patientId: string, state: string | null, stateData: any = null) {
  await supabase.from('patients').update({ state, state_data: stateData }).eq('id', patientId);
}

function isValidPosition(p: string): p is StaffPosition {
  return (STAFF_POSITIONS as string[]).includes(p);
}

// ============= ADMIN: lavozimlar menyusi =============

export async function showStaffPositionsMenu(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  // Har lavozim uchun xodimlar sonini olish
  const { data: rows } = await supabase
    .from('staff')
    .select('position')
    .eq('is_active', true);
  const counts: Record<string, number> = {};
  for (const r of rows ?? []) counts[r.position] = (counts[r.position] ?? 0) + 1;

  const buttons: InlineKeyboard = STAFF_POSITIONS.map((pos) => {
    const label = t.staffPositions[pos][lang];
    const count = counts[pos] ?? 0;
    return [{ text: `${label} (${count})`, callback_data: `stf:p:${pos}` }];
  });
  await setState(supabase, patient.id, 'admin:staff', null);
  await sendMessage(chatId, t.staffMenuTitle[lang], { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

// ============= ADMIN: bitta lavozim ichida =============

export async function showStaffByPosition(
  supabase: any,
  patient: Patient,
  chatId: number,
  position: StaffPosition,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: list } = await supabase
    .from('staff')
    .select('id, full_name, telegram_id, is_active')
    .eq('position', position)
    .order('sort_order')
    .order('created_at');

  const posLabel = t.staffPositions[position][lang];
  let text = `<b>${escapeHtml(posLabel)}</b>\n\n`;
  if (!list || list.length === 0) {
    text += t.staffListEmpty[lang];
  } else {
    for (const s of list) {
      const status = s.is_active ? '🟢' : '⚪️';
      text += `${status} <b>${escapeHtml(s.full_name)}</b>\n   <code>${s.telegram_id}</code>\n`;
    }
  }

  const buttons: InlineKeyboard = [
    [{ text: t.staffAddBtn[lang], callback_data: `stf:add:${position}` }],
    [{ text: t.staffPositionMediaBtn[lang], callback_data: `ent:med:staff_position:${position}` }],
  ];
  if (list) {
    for (const s of list) {
      buttons.push([
        { text: `🖼 ${s.full_name.slice(0, 20)}`, callback_data: `ent:med:staff:${s.id}` },
        { text: `🗑`, callback_data: `stf:del:${s.id}` },
      ]);
    }
  }
  buttons.push([{ text: '⬅️ ' + t.adminMenu.doctors[lang], callback_data: 'stf:menu' }]);

  await setState(supabase, patient.id, 'admin:staff', null);
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

// ============= ADMIN: yangi xodim qo'shish (2 qadam) =============

export async function startAddStaff(
  supabase: any,
  patient: Patient,
  chatId: number,
  position: StaffPosition,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await setState(supabase, patient.id, 'admin:stf:tg_id', { position });
  await sendMessage(
    chatId,
    `<b>${escapeHtml(t.staffPositions[position][lang])}</b>\n\n` + t.staffAskTgId[lang],
    { removeKeyboard: true },
    lovableKey,
    telegramKey,
  );
}

export async function handleStaffStep(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const state = patient.state ?? '';
  const data = (patient.state_data as Record<string, any>) ?? {};

  if (state === 'admin:stf:tg_id') {
    const trimmed = text.trim().replace(/^@/, '');
    if (!/^\d+$/.test(trimmed)) {
      await sendMessage(chatId, t.staffInvalidTgId[lang], {}, lovableKey, telegramKey);
      return;
    }
    const tgId = Number(trimmed);
    // Duplikat tekshiruvi
    const { data: existing } = await supabase
      .from('staff')
      .select('id')
      .eq('telegram_id', tgId)
      .maybeSingle();
    if (existing) {
      await sendMessage(chatId, t.staffDuplicateTgId[lang], {}, lovableKey, telegramKey);
      return;
    }
    data.telegram_id = tgId;
    await setState(supabase, patient.id, 'admin:stf:name', data);
    await sendMessage(chatId, t.staffAskName[lang], {}, lovableKey, telegramKey);
    return;
  }

  if (state === 'admin:stf:name') {
    const fullName = text.trim();
    if (fullName.length < 2 || fullName.length > 200) {
      await sendMessage(
        chatId,
        lang === 'uz' ? '⚠️ Ismni 2-200 belgi orasida kiriting.' : '⚠️ Введите имя от 2 до 200 символов.',
        {}, lovableKey, telegramKey,
      );
      return;
    }
    const position = data.position as StaffPosition;
    const tgId = data.telegram_id as number;
    const { error } = await supabase.from('staff').insert({
      telegram_id: tgId,
      full_name: fullName,
      position,
      is_active: true,
    });
    if (error) {
      await sendMessage(chatId, `⚠️ ${error.message}`, {}, lovableKey, telegramKey);
      return;
    }
    await setState(supabase, patient.id, 'admin:staff', null);
    await sendMessage(chatId, t.staffAdded[lang], {}, lovableKey, telegramKey);
    await showStaffByPosition(supabase, patient, chatId, position, lovableKey, telegramKey);
    return;
  }
}

export async function deleteStaffMember(
  supabase: any,
  patient: Patient,
  chatId: number,
  staffId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: s } = await supabase
    .from('staff')
    .select('position')
    .eq('id', staffId)
    .maybeSingle();
  await supabase.from('staff').delete().eq('id', staffId);
  await sendMessage(chatId, t.staffDeleted[lang], {}, lovableKey, telegramKey);
  if (s?.position && isValidPosition(s.position)) {
    await showStaffByPosition(supabase, patient, chatId, s.position, lovableKey, telegramKey);
  } else {
    await showStaffPositionsMenu(supabase, patient, chatId, lovableKey, telegramKey);
  }
}

// ============= /staff buyrug'i (xodim botga yozsa) =============

export async function handleStaffCommand(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: staff } = await supabase
    .from('staff')
    .select('full_name, position, is_active')
    .eq('telegram_id', patient.telegram_id)
    .eq('is_active', true)
    .maybeSingle();

  if (!staff) {
    await sendMessage(chatId, t.staffNotRegistered[lang], {}, lovableKey, telegramKey);
    return;
  }

  const positionLabel = t.staffPositions[staff.position as StaffPosition]?.[lang] ?? staff.position;
  const greeting = t.staffGreeting[lang]
    .replace('{name}', escapeHtml(staff.full_name))
    .replace('{position}', escapeHtml(positionLabel));

  await sendMessage(chatId, greeting, {}, lovableKey, telegramKey);

  // Lavozim mediasini yuborish
  const { data: media } = await supabase
    .from('media_attachments')
    .select('caption_override, sort_order, media_library(file_type, file_id, caption)')
    .eq('entity_type', 'staff_position')
    .eq('entity_id', staff.position)
    .order('sort_order');

  if (media && media.length > 0) {
    await sendMessage(chatId, t.staffPositionMediaIntro[lang], {}, lovableKey, telegramKey);
    for (const a of media) {
      const m = (a as any).media_library;
      if (!m) continue;
      const caption = a.caption_override ?? m.caption ?? undefined;
      try {
        await sendMediaByType(chatId, m.file_type, m.file_id, caption ? { caption } : {}, lovableKey, telegramKey);
      } catch (e) {
        console.error('staff media send failed', e);
      }
    }
  }
}

// ============= ADMIN: callback router =============

export async function handleStaffCallback(
  supabase: any,
  patient: Patient,
  chatId: number,
  data: string,
  answerCb: (text?: string) => Promise<void>,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  if (data === 'stf:menu') {
    await answerCb();
    await showStaffPositionsMenu(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('stf:p:')) {
    const pos = data.slice('stf:p:'.length);
    if (isValidPosition(pos)) {
      await answerCb();
      await showStaffByPosition(supabase, patient, chatId, pos, lovableKey, telegramKey);
    } else {
      await answerCb();
    }
    return true;
  }
  if (data.startsWith('stf:add:')) {
    const pos = data.slice('stf:add:'.length);
    if (isValidPosition(pos)) {
      await answerCb();
      await startAddStaff(supabase, patient, chatId, pos, lovableKey, telegramKey);
    } else {
      await answerCb();
    }
    return true;
  }
  if (data.startsWith('stf:del:')) {
    const id = data.slice('stf:del:'.length);
    await answerCb('🗑');
    await deleteStaffMember(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }
  return false;
}
