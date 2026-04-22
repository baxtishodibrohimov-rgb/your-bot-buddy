// Xodimlar (staff) — admin bo'limi va /staff buyrug'i
import { sendMessage, escapeHtml, sendMediaByType, type InlineKeyboard, type ReplyKeyboard } from './telegram-api.ts';
import { t, type Lang } from './i18n.ts';
import { isCoordinator } from './coordinator-handler.ts';

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
        { text: `✏️ ${s.full_name.slice(0, 12)}`, callback_data: `stf:edit:${s.id}` },
        { text: `🖼`, callback_data: `ent:med:staff:${s.id}` },
        { text: `📋`, callback_data: `chk:s:${s.id}` },
        { text: `🗑`, callback_data: `stf:del:${s.id}` },
      ]);
    }
  }
  buttons.push([{ text: '⬅️ ' + t.adminMenu.doctors[lang], callback_data: 'stf:menu' }]);

  await setState(supabase, patient.id, 'admin:staff', null);
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

// ============= ADMIN: bitta xodim tahrirlash menyusi =============

const STAFF_EDITABLE_FIELDS: Array<keyof typeof t.docFields> = [
  'full_name', 'specialty_uz', 'specialty_ru', 'experience_years', 'bio_uz', 'bio_ru', 'sort_order',
];

export async function showStaffEditMenu(
  supabase: any,
  patient: Patient,
  chatId: number,
  staffId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: s } = await supabase.from('staff').select('*').eq('id', staffId).maybeSingle();
  if (!s) {
    await sendMessage(chatId, '—', {}, lovableKey, telegramKey);
    return;
  }

  let text = t.staffEditTitle[lang].replace('{name}', escapeHtml(s.full_name)) + '\n\n';
  for (const f of STAFF_EDITABLE_FIELDS) {
    const label = t.docFields[f][lang];
    const val = s[f] ?? '—';
    text += `<b>${escapeHtml(label)}:</b> ${escapeHtml(String(val))}\n`;
  }

  const buttons: InlineKeyboard = [];
  for (let i = 0; i < STAFF_EDITABLE_FIELDS.length; i += 2) {
    const row = [
      { text: '✏️ ' + t.docFields[STAFF_EDITABLE_FIELDS[i]][lang], callback_data: `stf:fld:${staffId}:${STAFF_EDITABLE_FIELDS[i]}` },
    ];
    if (i + 1 < STAFF_EDITABLE_FIELDS.length) {
      row.push({ text: '✏️ ' + t.docFields[STAFF_EDITABLE_FIELDS[i + 1]][lang], callback_data: `stf:fld:${staffId}:${STAFF_EDITABLE_FIELDS[i + 1]}` });
    }
    buttons.push(row);
  }
  buttons.push([{ text: t.entityMediaBtn[lang] + ' (' + (lang === 'uz' ? 'media/audio/file' : 'медиа/аудио/файл') + ')', callback_data: `ent:med:staff:${staffId}` }]);
  if (s.position) {
    buttons.push([{ text: '⬅️', callback_data: `stf:p:${s.position}` }]);
  }

  await setState(supabase, patient.id, 'admin:staff', null);
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

async function askStaffFieldValue(
  supabase: any,
  patient: Patient,
  chatId: number,
  staffId: string,
  field: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const label = (t.docFields as any)[field]?.[lang] ?? field;
  await setState(supabase, patient.id, 'admin:stf:editfld', { staffId, field });
  await sendMessage(
    chatId,
    `<b>${escapeHtml(label)}</b>\n\n${t.editEnterValue[lang]}\n\n/cancel — ${t.adminCancel[lang]}`,
    { removeKeyboard: true },
    lovableKey,
    telegramKey,
  );
}

async function saveStaffFieldValue(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const lang = patient.language;
  const data = (patient.state_data as any) ?? {};
  const { staffId, field } = data;
  if (!staffId || !field) return false;

  const trimmed = text.trim();
  const skip = trimmed === '—' || trimmed === '-';
  let value: any;

  if (field === 'experience_years' || field === 'sort_order') {
    if (skip) {
      value = field === 'sort_order' ? 0 : null;
    } else {
      const n = Number(trimmed.replace(/\s/g, ''));
      if (isNaN(n)) {
        await sendMessage(chatId, t.editInvalidNumber[lang], {}, lovableKey, telegramKey);
        return true;
      }
      value = n;
    }
  } else if (field === 'full_name') {
    if (skip || trimmed.length < 2) {
      await sendMessage(
        chatId,
        lang === 'uz' ? '⚠️ Ism bo\'sh bo\'lishi mumkin emas.' : '⚠️ Имя не может быть пустым.',
        {}, lovableKey, telegramKey,
      );
      return true;
    }
    value = trimmed;
  } else {
    value = skip ? null : trimmed;
  }

  await supabase.from('staff').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', staffId);
  await sendMessage(chatId, t.editSaved[lang], {}, lovableKey, telegramKey);
  await showStaffEditMenu(supabase, patient, chatId, staffId, lovableKey, telegramKey);
  return true;
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
): Promise<boolean> {
  const lang = patient.language;
  const state = patient.state ?? '';
  const data = (patient.state_data as Record<string, any>) ?? {};

  // Maydon-maydon tahrirlash (yangi qiymat saqlash)
  if (state === 'admin:stf:editfld') {
    return await saveStaffFieldValue(supabase, patient, chatId, text, lovableKey, telegramKey);
  }

  if (state === 'admin:stf:tg_id') {
    const trimmed = text.trim().replace(/^@/, '');
    if (!/^\d+$/.test(trimmed)) {
      await sendMessage(chatId, t.staffInvalidTgId[lang], {}, lovableKey, telegramKey);
      return true;
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
      return true;
    }
    data.telegram_id = tgId;
    await setState(supabase, patient.id, 'admin:stf:name', data);
    await sendMessage(chatId, t.staffAskName[lang], {}, lovableKey, telegramKey);
    return true;
  }

  if (state === 'admin:stf:name') {
    const fullName = text.trim();
    if (fullName.length < 2 || fullName.length > 200) {
      await sendMessage(
        chatId,
        lang === 'uz' ? '⚠️ Ismni 2-200 belgi orasida kiriting.' : '⚠️ Введите имя от 2 до 200 символов.',
        {}, lovableKey, telegramKey,
      );
      return true;
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
      return true;
    }
    await setState(supabase, patient.id, 'admin:staff', null);
    await sendMessage(chatId, t.staffAdded[lang], {}, lovableKey, telegramKey);
    await showStaffByPosition(supabase, patient, chatId, position, lovableKey, telegramKey);
    return true;
  }

  return false;
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

function staffMenuKeyboard(lang: Lang, isCoord: boolean = false): ReplyKeyboard {
  const rows: ReplyKeyboard = [
    [{ text: t.staffMenu.instruction[lang] }, { text: t.staffMenuChecklists[lang] }],
    [{ text: t.staffMenu.startDay[lang] }],
  ];
  if (isCoord) {
    // Koordinator uchun qo'shimcha bo'lim: xodimlar boshqaruvi, statistika, tekshiruvlar va laboratoriya
    rows.push([{ text: t.coordExtraStaff[lang] }, { text: t.coordExtraStats[lang] }]);
    rows.push([{ text: t.coordExtraLab[lang] }, { text: t.coordMenu.pending[lang] }]);
  }
  rows.push([{ text: t.staffMenu.complaint[lang] }]);
  rows.push([{ text: t.staffMenu.exit[lang] }]);
  return rows;
}

async function getStaffByTgId(supabase: any, telegramId: number) {
  const { data } = await supabase
    .from('staff')
    .select('id, full_name, position, is_active')
    .eq('telegram_id', telegramId)
    .eq('is_active', true)
    .maybeSingle();
  return data;
}

export async function handleStaffCommand(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const staff = await getStaffByTgId(supabase, patient.telegram_id);

  if (!staff) {
    await sendMessage(chatId, t.staffNotRegistered[lang], {}, lovableKey, telegramKey);
    return;
  }

  const positionLabel = t.staffPositions[staff.position as StaffPosition]?.[lang] ?? staff.position;
  const greeting = t.staffGreeting[lang]
    .replace('{name}', escapeHtml(staff.full_name))
    .replace('{position}', escapeHtml(positionLabel));

  const isCoord = staff.position === 'koordinator';
  await setState(supabase, patient.id, 'staff:menu', { staff_id: staff.id });
  await sendMessage(
    chatId,
    greeting + '\n\n' + t.staffPortalTitle[lang],
    { replyKeyboard: staffMenuKeyboard(lang, isCoord) },
    lovableKey,
    telegramKey,
  );
}

// Xodim portalidagi tugma matnlarini ushlash
export async function handleStaffPortalMessage(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const lang = patient.language;
  const staff = await getStaffByTgId(supabase, patient.telegram_id);
  if (!staff) {
    // Xodimligi bekor qilingan — state'dan chiqaramiz
    await setState(supabase, patient.id, null, null);
    return false;
  }
  const isCoord = staff.position === 'koordinator';

  const matches = (key: keyof typeof t.staffMenu) =>
    text === t.staffMenu[key].uz || text === t.staffMenu[key].ru;

  if (matches('instruction')) {
    await sendStaffInstruction(supabase, chatId, staff, lang, lovableKey, telegramKey);
    return true;
  }
  if (text === t.staffMenuChecklists.uz || text === t.staffMenuChecklists.ru) {
    const { showStaffChecklistsList } = await import('./checklist-handler.ts');
    await showStaffChecklistsList(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (matches('startDay')) {
    const { startWorkDay } = await import('./checklist-handler.ts');
    await startWorkDay(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (matches('complaint')) {
    await setState(supabase, patient.id, 'staff:complaint', { staff_id: staff.id });
    await sendMessage(chatId, t.staffComplaintAsk[lang], { removeKeyboard: true }, lovableKey, telegramKey);
    return true;
  }
  if (matches('exit')) {
    await setState(supabase, patient.id, null, null);
    await sendMessage(chatId, t.staffExited[lang], { removeKeyboard: true }, lovableKey, telegramKey);
    return true;
  }

  // ===== KOORDINATOR uchun qo'shimcha tugmalar =====
  if (isCoord) {
    // 👥 Xodimlar (admin) — admindagi xodimlar bo'limi
    if (text === t.coordExtraStaff.uz || text === t.coordExtraStaff.ru) {
      await showStaffPositionsMenu(supabase, patient, chatId, lovableKey, telegramKey);
      return true;
    }
    // 📊 Statistika — koordinator statistikasi menyusi
    if (text === t.coordExtraStats.uz || text === t.coordExtraStats.ru) {
      const { showCoordStatsMenu } = await import('./coordinator-stats.ts');
      await setState(supabase, patient.id, 'coord:stats', { staff_id: staff.id });
      await showCoordStatsMenu(chatId, lang, lovableKey, telegramKey);
      return true;
    }
    // ⏳ Tekshiruvlar — pending reviews ro'yxati
    if (text === t.coordMenu.pending.uz || text === t.coordMenu.pending.ru) {
      const { showPendingReviewsForStaff } = await import('./coordinator-handler.ts');
      await showPendingReviewsForStaff(supabase, chatId, lang, lovableKey, telegramKey);
      return true;
    }
    // 🦷 Laboratoriya — koordinator lab menyusi
    if (text === t.coordExtraLab.uz || text === t.coordExtraLab.ru) {
      const { showCoordLabMenu } = await import('./lab-handler.ts');
      await showCoordLabMenu(supabase, patient, chatId, lovableKey, telegramKey);
      return true;
    }
  }
  return false;
}

// Statistika menyusidan tugmalarni ushlash (koordinator uchun)
export async function handleCoordStatsMessage(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const lang = patient.language;
  const staff = await getStaffByTgId(supabase, patient.telegram_id);
  if (!staff || staff.position !== 'koordinator') {
    await setState(supabase, patient.id, null, null);
    return false;
  }

  if (text === t.coordStatsAttendance.uz || text === t.coordStatsAttendance.ru) {
    const { showAttendanceReport } = await import('./coordinator-stats.ts');
    await showAttendanceReport(supabase, chatId, lang, lovableKey, telegramKey);
    return true;
  }
  if (text === t.coordStatsChecklists.uz || text === t.coordStatsChecklists.ru) {
    const { showChecklistsReport } = await import('./coordinator-stats.ts');
    await showChecklistsReport(supabase, chatId, lang, lovableKey, telegramKey);
    return true;
  }
  if (text === t.coordStatsPatients.uz || text === t.coordStatsPatients.ru) {
    const { showPatientsList } = await import('./coordinator-stats.ts');
    await showPatientsList(supabase, chatId, lang, lovableKey, telegramKey);
    return true;
  }
  // Chiqish — staff portaliga qaytish
  if (text === t.staffMenu.exit.uz || text === t.staffMenu.exit.ru) {
    await handleStaffCommand(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  return false;
}

async function sendStaffInstruction(
  supabase: any,
  chatId: number,
  staff: { id: string; position: string },
  lang: Lang,
  lovableKey: string,
  telegramKey: string,
) {
  // Avval shaxsiy media (entity_type=staff, entity_id=staff.id), keyin lavozim mediasi
  const { data: personal } = await supabase
    .from('media_attachments')
    .select('caption_override, sort_order, media_library(file_type, file_id, caption)')
    .eq('entity_type', 'staff')
    .eq('entity_id', staff.id)
    .order('sort_order');

  const { data: positionMedia } = await supabase
    .from('media_attachments')
    .select('caption_override, sort_order, media_library(file_type, file_id, caption)')
    .eq('entity_type', 'staff_position')
    .eq('entity_id', staff.position)
    .order('sort_order');

  const all = [...(personal ?? []), ...(positionMedia ?? [])];
  if (all.length === 0) {
    await sendMessage(chatId, t.staffInstructionEmpty[lang], {}, lovableKey, telegramKey);
    return;
  }

  await sendMessage(chatId, t.staffInstructionIntro[lang], {}, lovableKey, telegramKey);
  for (const a of all) {
    const m = (a as any).media_library;
    if (!m) continue;
    const caption = a.caption_override ?? m.caption ?? undefined;
    try {
      await sendMediaByType(chatId, m.file_type, m.file_id, caption ? { caption } : {}, lovableKey, telegramKey);
    } catch (e) {
      console.error('staff instruction media send failed', e);
    }
  }
}

// Xodim shikoyat yozganda
export async function handleStaffComplaint(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const data = (patient.state_data as Record<string, any>) ?? {};
  const staffId = data.staff_id as string | undefined;

  let prefix = '[XODIM] ';
  let isCoord = false;
  if (staffId) {
    const { data: s } = await supabase.from('staff').select('full_name, position').eq('id', staffId).maybeSingle();
    if (s) {
      const posLabel = t.staffPositions[s.position as StaffPosition]?.uz ?? s.position;
      prefix = `[XODIM: ${s.full_name} — ${posLabel}] `;
      if (s.position === 'koordinator') isCoord = true;
    }
  }

  const { data: created } = await supabase.from('complaints').insert({
    patient_id: patient.id,
    type: 'staff_feedback',
    message: prefix + text,
  }).select('*').single();

  await setState(supabase, patient.id, 'staff:menu', { staff_id: staffId });
  await sendMessage(
    chatId,
    t.staffComplaintSaved[lang],
    { replyKeyboard: staffMenuKeyboard(lang, isCoord) },
    lovableKey,
    telegramKey,
  );

  // Adminlarga bildirishnoma
  if (created) {
    try {
      const { notifyAdminsAboutComplaint } = await import('./notifications.ts');
      await notifyAdminsAboutComplaint(supabase, created, lovableKey, telegramKey);
    } catch (e) {
      console.error('Notify staff complaint failed', e);
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
