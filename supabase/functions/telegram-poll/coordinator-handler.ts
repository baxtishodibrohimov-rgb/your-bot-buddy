// Koordinator tizimi:
// 1) Admin koordinatorlarni qo'shadi/o'chiradi
// 2) Koordinator /coordinator buyrug'i orqali panelga kiradi
// 3) Xodim cheklistni tugatganda koordinatorlarga avto xabar boradi
// 4) Koordinator ✅/❌ orqali tasdiqlaydi yoki rad etadi
import { sendMessage, escapeHtml, type InlineKeyboard, type ReplyKeyboard } from './telegram-api.ts';
import { t, type Lang } from './i18n.ts';
import { type StaffPosition } from './staff-handler.ts';

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

export async function isCoordinator(supabase: any, telegramId: number): Promise<{ id: string; full_name: string | null } | null> {
  const { data } = await supabase
    .from('coordinators')
    .select('id, full_name')
    .eq('telegram_id', telegramId)
    .maybeSingle();
  return data ?? null;
}

function todayDate(): string {
  const now = new Date(Date.now() + 5 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

function todayDateLabel(lang: Lang): string {
  const d = new Date(Date.now() + 5 * 60 * 60 * 1000);
  return d.toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ============= ADMIN: koordinatorlar ro'yxati =============

export async function showCoordinatorsAdmin(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: list } = await supabase
    .from('coordinators')
    .select('id, telegram_id, full_name')
    .order('created_at');

  let text = t.coordTitle[lang] + '\n\n';
  if (!list || list.length === 0) {
    text += t.coordEmpty[lang];
  } else {
    for (const c of list) {
      text += `🧭 <code>${c.telegram_id}</code>${c.full_name ? ' — ' + escapeHtml(c.full_name) : ''}\n`;
    }
  }

  const buttons: InlineKeyboard = [
    [{ text: t.coordAddBtn[lang], callback_data: 'crd:add' }],
  ];
  if (list) {
    for (const c of list) {
      const label = c.full_name ?? String(c.telegram_id);
      buttons.push([{ text: `🗑 ${label.slice(0, 25)}`, callback_data: `crd:del:${c.id}` }]);
    }
  }

  await setState(supabase, patient.id, 'admin:coord', null);
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

export async function startAddCoordinator(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  await setState(supabase, patient.id, 'admin:crd:tg_id', {});
  await sendMessage(chatId, t.coordAskTgId[patient.language], { removeKeyboard: true }, lovableKey, telegramKey);
}

export async function handleCoordinatorStep(
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

  if (state === 'admin:crd:tg_id') {
    const trimmed = text.trim().replace(/^@/, '');
    if (!/^\d+$/.test(trimmed)) {
      await sendMessage(chatId, t.coordInvalidTgId[lang], {}, lovableKey, telegramKey);
      return true;
    }
    const tgId = Number(trimmed);
    const { data: existing } = await supabase
      .from('coordinators')
      .select('id')
      .eq('telegram_id', tgId)
      .maybeSingle();
    if (existing) {
      await sendMessage(chatId, t.coordDuplicate[lang], {}, lovableKey, telegramKey);
      return true;
    }
    data.telegram_id = tgId;
    await setState(supabase, patient.id, 'admin:crd:name', data);
    await sendMessage(chatId, t.coordAskName[lang], {}, lovableKey, telegramKey);
    return true;
  }

  if (state === 'admin:crd:name') {
    const skip = text.trim() === '—' || text.trim() === '-';
    const fullName = skip ? null : text.trim().slice(0, 200);
    const { error } = await supabase.from('coordinators').insert({
      telegram_id: data.telegram_id,
      full_name: fullName,
    });
    if (error) {
      await sendMessage(chatId, `⚠️ ${error.message}`, {}, lovableKey, telegramKey);
      return true;
    }
    await setState(supabase, patient.id, 'admin:coord', null);
    await sendMessage(chatId, t.coordAdded[lang], {}, lovableKey, telegramKey);
    await showCoordinatorsAdmin(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }

  return false;
}

export async function deleteCoordinator(
  supabase: any,
  patient: Patient,
  chatId: number,
  id: string,
  lovableKey: string,
  telegramKey: string,
) {
  await supabase.from('coordinators').delete().eq('id', id);
  await sendMessage(chatId, t.coordDeleted[patient.language], {}, lovableKey, telegramKey);
  await showCoordinatorsAdmin(supabase, patient, chatId, lovableKey, telegramKey);
}

// ============= /coordinator buyrug'i (koordinator panel) =============

function coordPortalKeyboard(lang: Lang): ReplyKeyboard {
  return [
    [{ text: t.coordMenu.staff[lang] }, { text: t.coordMenu.pending[lang] }],
    [{ text: t.coordMenu.attendance[lang] }],
    [{ text: t.coordMenu.exit[lang] }],
  ];
}

export async function handleCoordinatorCommand(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const coord = await isCoordinator(supabase, patient.telegram_id);
  if (!coord) {
    await sendMessage(
      chatId,
      lang === 'uz'
        ? '⛔️ Siz koordinatorlar ro\'yxatida yo\'qsiz.'
        : '⛔️ Вы не в списке координаторов.',
      {},
      lovableKey,
      telegramKey,
    );
    return;
  }
  const greeting = t.coordGreeting[lang].replace('{name}', escapeHtml(coord.full_name ?? String(patient.telegram_id)));
  await setState(supabase, patient.id, 'coord:menu', { coord_id: coord.id });
  await sendMessage(
    chatId,
    greeting + '\n\n' + t.coordPortalTitle[lang],
    { replyKeyboard: coordPortalKeyboard(lang) },
    lovableKey,
    telegramKey,
  );
}

// Koordinator panelidagi tugmalar (matn)
export async function handleCoordinatorPortalMessage(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const lang = patient.language;
  const coord = await isCoordinator(supabase, patient.telegram_id);
  if (!coord) {
    await setState(supabase, patient.id, null, null);
    return false;
  }

  if (text === t.coordMenu.staff.uz || text === t.coordMenu.staff.ru) {
    const { showStaffPositionsMenu } = await import('./staff-handler.ts');
    await showStaffPositionsMenu(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (text === t.coordMenu.pending.uz || text === t.coordMenu.pending.ru) {
    await showPendingReviews(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (text === t.coordMenu.attendance.uz || text === t.coordMenu.attendance.ru) {
    await showAttendanceToday(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (text === t.coordMenu.exit.uz || text === t.coordMenu.exit.ru) {
    await setState(supabase, patient.id, null, null);
    await sendMessage(chatId, t.coordExited[lang], { removeKeyboard: true }, lovableKey, telegramKey);
    return true;
  }
  return false;
}

async function showPendingReviews(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: pending } = await supabase
    .from('checklist_reviews')
    .select('id, staff_id, checklist_id, review_date, staff:staff_id(full_name, position), checklist:checklist_id(title)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!pending || pending.length === 0) {
    await sendMessage(chatId, t.coordPendingEmpty[lang], {}, lovableKey, telegramKey);
    return;
  }

  await sendMessage(chatId, t.coordPendingTitle[lang], {}, lovableKey, telegramKey);
  for (const r of pending) {
    await sendReviewMessage(supabase, chatId, r.id, lang, lovableKey, telegramKey);
  }
}

async function showAttendanceToday(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const date = todayDate();

  const { data: staff } = await supabase
    .from('staff')
    .select('id, full_name, position')
    .eq('is_active', true)
    .order('position')
    .order('full_name');

  const { data: starts } = await supabase
    .from('staff_day_starts')
    .select('staff_id, started_at')
    .eq('start_date', date);

  const startMap = new Map<string, string>();
  for (const s of starts ?? []) startMap.set(s.staff_id, s.started_at);

  let text = `${t.coordAttendanceTitle[lang]} <i>(${todayDateLabel(lang)})</i>\n\n`;
  if (!staff || staff.length === 0) {
    text += t.coordAttendanceEmpty[lang];
  } else {
    for (const s of staff) {
      const startedAt = startMap.get(s.id);
      const posLabel = t.staffPositions[s.position as StaffPosition]?.[lang] ?? s.position;
      if (startedAt) {
        const time = new Date(startedAt).toLocaleTimeString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
          hour: '2-digit', minute: '2-digit',
        });
        text += `🟢 <b>${escapeHtml(s.full_name)}</b> — ${escapeHtml(posLabel)} <i>(${time})</i>\n`;
      } else {
        text += `⚪ <b>${escapeHtml(s.full_name)}</b> — ${escapeHtml(posLabel)}\n`;
      }
    }
  }
  await sendMessage(chatId, text, {}, lovableKey, telegramKey);
}

// ============= TEKSHIRUV YUBORISH (xodim cheklistni to'ldirgandan keyin) =============

/**
 * Xodim cheklistning barcha punktlarini belgilaganida (✅ yoki ❌) chaqiriladi.
 * Bugungi sana uchun review yaratiladi (yoki yangilanadi) va barcha koordinatorlarga xabar boradi.
 */
export async function notifyCoordinatorsForReview(
  supabase: any,
  staffId: string,
  checklistId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const date = todayDate();

  // Mavjud review topish
  const { data: existing } = await supabase
    .from('checklist_reviews')
    .select('id, status')
    .eq('staff_id', staffId)
    .eq('checklist_id', checklistId)
    .eq('review_date', date)
    .maybeSingle();

  // Agar approved bo'lgan bo'lsa — qaytadan yubormaymiz
  if (existing?.status === 'approved') return;

  let reviewId: string;
  if (existing) {
    // pending yoki rejected => qaytadan pending qilamiz va yangilaymiz
    const { data: upd } = await supabase
      .from('checklist_reviews')
      .update({
        status: 'pending',
        reviewed_at: null,
        reviewed_by_coordinator_id: null,
        reject_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select('id')
      .single();
    reviewId = upd!.id;
  } else {
    const { data: created, error } = await supabase
      .from('checklist_reviews')
      .insert({
        staff_id: staffId,
        checklist_id: checklistId,
        review_date: date,
        status: 'pending',
      })
      .select('id')
      .single();
    if (error || !created) return;
    reviewId = created.id;
  }

  // Barcha koordinatorlarga yuborish
  const { data: coords } = await supabase.from('coordinators').select('telegram_id');
  if (!coords || coords.length === 0) return;

  for (const c of coords) {
    try {
      await sendReviewMessage(supabase, c.telegram_id, reviewId, 'uz', lovableKey, telegramKey);
    } catch (e) {
      console.error('Notify coordinator failed', c.telegram_id, e);
    }
  }
}

async function sendReviewMessage(
  supabase: any,
  chatId: number,
  reviewId: string,
  lang: Lang,
  lovableKey: string,
  telegramKey: string,
) {
  const { data: r } = await supabase
    .from('checklist_reviews')
    .select('id, staff_id, checklist_id, review_date, status')
    .eq('id', reviewId)
    .maybeSingle();
  if (!r) return;

  const { data: staff } = await supabase
    .from('staff')
    .select('full_name, position')
    .eq('id', r.staff_id)
    .maybeSingle();
  const { data: cl } = await supabase
    .from('staff_checklists')
    .select('title')
    .eq('id', r.checklist_id)
    .maybeSingle();
  const { data: items } = await supabase
    .from('checklist_items')
    .select('id, text, sort_order')
    .eq('checklist_id', r.checklist_id)
    .order('sort_order')
    .order('created_at');
  const { data: comps } = await supabase
    .from('checklist_completions')
    .select('item_id, is_done')
    .eq('staff_id', r.staff_id)
    .eq('completion_date', r.review_date);

  const status = new Map<string, boolean>();
  for (const c of comps ?? []) status.set(c.item_id, c.is_done);

  const total = (items ?? []).length;
  const done = (items ?? []).filter((it: any) => status.get(it.id) === true).length;
  const posLabel = t.staffPositions[staff?.position as StaffPosition]?.[lang] ?? staff?.position ?? '—';
  const dateLabel = new Date(r.review_date + 'T00:00:00').toLocaleDateString(
    lang === 'uz' ? 'uz-UZ' : 'ru-RU',
    { day: '2-digit', month: '2-digit', year: 'numeric' },
  );

  let text = t.coordReviewNew[lang]
    .replace('{name}', escapeHtml(staff?.full_name ?? '—'))
    .replace('{position}', escapeHtml(posLabel))
    .replace('{title}', escapeHtml(cl?.title ?? '—'))
    .replace('{done}', String(done))
    .replace('{total}', String(total))
    .replace('{date}', escapeHtml(dateLabel));

  text += t.coordReviewItemsHeader[lang];
  (items ?? []).forEach((it: any, i: number) => {
    const s = status.get(it.id);
    const icon = s === true ? '✅' : s === false ? '❌' : '⬜️';
    text += `\n${icon} ${i + 1}. ${escapeHtml(it.text)}`;
  });

  const buttons: InlineKeyboard = r.status === 'pending'
    ? [[
      { text: t.coordApproveBtn[lang], callback_data: `crv:a:${r.id}` },
      { text: t.coordRejectBtn[lang], callback_data: `crv:r:${r.id}` },
    ]]
    : [];

  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

// ============= TEKSHIRUV NATIJASI (koordinator ✅/❌) =============

export async function handleReviewDecision(
  supabase: any,
  patient: Patient,
  chatId: number,
  reviewId: string,
  approved: boolean,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const coord = await isCoordinator(supabase, patient.telegram_id);
  if (!coord) return;

  const { data: r } = await supabase
    .from('checklist_reviews')
    .select('id, staff_id, checklist_id, status')
    .eq('id', reviewId)
    .maybeSingle();
  if (!r) return;

  if (r.status !== 'pending') {
    await sendMessage(chatId, t.coordReviewAlreadyDone[lang], {}, lovableKey, telegramKey);
    return;
  }

  await supabase.from('checklist_reviews').update({
    status: approved ? 'approved' : 'rejected',
    reviewed_by_coordinator_id: coord.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', reviewId);

  // Xodim haqida ma'lumot
  const { data: staff } = await supabase
    .from('staff')
    .select('telegram_id, full_name')
    .eq('id', r.staff_id)
    .maybeSingle();
  const { data: cl } = await supabase
    .from('staff_checklists')
    .select('title')
    .eq('id', r.checklist_id)
    .maybeSingle();

  // Xodim tilini olamiz (patients orqali)
  let staffLang: Lang = 'uz';
  if (staff?.telegram_id) {
    const { data: sp } = await supabase
      .from('patients')
      .select('language')
      .eq('telegram_id', staff.telegram_id)
      .maybeSingle();
    if (sp?.language === 'ru') staffLang = 'ru';
  }

  // Xodimga xabar
  if (staff?.telegram_id) {
    const msg = approved
      ? t.staffDayClosed[staffLang].replace('{title}', escapeHtml(cl?.title ?? '—'))
      : t.staffChecklistRejected[staffLang].replace('{title}', escapeHtml(cl?.title ?? '—'));
    try {
      await sendMessage(staff.telegram_id, msg, {}, lovableKey, telegramKey);
    } catch (e) {
      console.error('Notify staff about review failed', e);
    }
  }

  // Koordinatorga javob
  await sendMessage(
    chatId,
    approved ? t.coordReviewApproved[lang] : t.coordReviewRejected[lang],
    {},
    lovableKey,
    telegramKey,
  );
}

// ============= CALLBACK ROUTER =============

export async function handleCoordinatorCallback(
  supabase: any,
  patient: Patient,
  chatId: number,
  data: string,
  answerCb: (text?: string) => Promise<void>,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  // Admin: koordinator boshqaruv
  if (data === 'crd:add') {
    await answerCb();
    await startAddCoordinator(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('crd:del:')) {
    const id = data.slice('crd:del:'.length);
    await answerCb('🗑');
    await deleteCoordinator(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }

  // Tekshiruv qarori (faqat koordinatorga)
  if (data.startsWith('crv:')) {
    const parts = data.split(':');
    if (parts.length === 3) {
      const action = parts[1];
      const reviewId = parts[2];
      const coord = await isCoordinator(supabase, patient.telegram_id);
      if (!coord) {
        await answerCb('⛔️');
        return true;
      }
      if (action === 'a') {
        await answerCb('✅');
        await handleReviewDecision(supabase, patient, chatId, reviewId, true, lovableKey, telegramKey);
        return true;
      }
      if (action === 'r') {
        await answerCb('❌');
        await handleReviewDecision(supabase, patient, chatId, reviewId, false, lovableKey, telegramKey);
        return true;
      }
    }
  }

  return false;
}
