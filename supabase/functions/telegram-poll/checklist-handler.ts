// Cheklistlar — admin boshqaruv + xodim portali + statistika
import { sendMessage, escapeHtml, type InlineKeyboard } from './telegram-api.ts';
import { t, type Lang } from './i18n.ts';
import { type StaffPosition } from './staff-handler.ts';
import { periodRange, type Period } from './stats.ts';

type Patient = {
  id: string;
  telegram_id: number;
  language: Lang;
  state: string | null;
  state_data: Record<string, unknown> | null;
};

type Checklist = {
  id: string;
  staff_id: string;
  title: string;
  is_daily_required: boolean;
  sort_order: number;
};

type ChecklistItem = {
  id: string;
  checklist_id: string;
  text: string;
  sort_order: number;
};

async function setState(supabase: any, patientId: string, state: string | null, stateData: any = null) {
  await supabase.from('patients').update({ state, state_data: stateData }).eq('id', patientId);
}

function todayDate(): string {
  // Asia/Tashkent (UTC+5)
  const now = new Date(Date.now() + 5 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

// ============= ADMIN: bitta xodim cheklistlari =============

export async function showStaffChecklistsAdmin(
  supabase: any,
  patient: Patient,
  chatId: number,
  staffId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: staff } = await supabase
    .from('staff')
    .select('id, full_name, position')
    .eq('id', staffId)
    .maybeSingle();
  if (!staff) return;

  const posLabel = t.staffPositions[staff.position as StaffPosition]?.[lang] ?? staff.position;
  const { data: lists } = await supabase
    .from('staff_checklists')
    .select('id, title, is_daily_required, sort_order')
    .eq('staff_id', staffId)
    .order('is_daily_required', { ascending: false })
    .order('sort_order')
    .order('created_at');

  const hasDaily = (lists ?? []).some((l: Checklist) => l.is_daily_required);

  let text = t.chkAdminTitle[lang]
    .replace('{name}', escapeHtml(staff.full_name))
    .replace('{position}', escapeHtml(posLabel)) + '\n\n';

  if (!lists || lists.length === 0) {
    text += t.chkAdminEmpty[lang];
  } else {
    for (const l of lists as Checklist[]) {
      const badge = l.is_daily_required ? t.chkDailyBadge[lang] : t.chkExtraBadge[lang];
      text += `• ${badge} <b>${escapeHtml(l.title)}</b>\n`;
    }
  }

  const buttons: InlineKeyboard = [];
  if (!hasDaily) {
    buttons.push([{ text: t.chkAddDailyBtn[lang], callback_data: `chk:add:d:${staffId}` }]);
  }
  buttons.push([{ text: t.chkAddExtraBtn[lang], callback_data: `chk:add:e:${staffId}` }]);
  for (const l of (lists ?? []) as Checklist[]) {
    const badge = l.is_daily_required ? '⭐' : '📌';
    buttons.push([
      { text: `${badge} ${l.title.slice(0, 25)}`, callback_data: `chk:v:${l.id}` },
      { text: '🗑', callback_data: `chk:del:${l.id}` },
    ]);
  }
  buttons.push([{ text: t.chkStatsBtn[lang], callback_data: `chk:stats:${staffId}:today` }]);
  buttons.push([{ text: '⬅️', callback_data: `stf:back:${staffId}` }]);

  await setState(supabase, patient.id, 'admin:chk', { staff_id: staffId });
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

export async function viewChecklistAdmin(
  supabase: any,
  patient: Patient,
  chatId: number,
  checklistId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: cl } = await supabase
    .from('staff_checklists')
    .select('id, staff_id, title, is_daily_required')
    .eq('id', checklistId)
    .maybeSingle();
  if (!cl) return;

  const { data: items } = await supabase
    .from('checklist_items')
    .select('id, text, sort_order')
    .eq('checklist_id', checklistId)
    .order('sort_order')
    .order('created_at');

  const itemsText = (items && items.length > 0)
    ? (items as ChecklistItem[]).map((it, i) => `${i + 1}. ${escapeHtml(it.text)}`).join('\n')
    : '—';

  const text = t.chkOneChecklist[lang]
    .replace('{title}', escapeHtml(cl.title))
    .replace('{items}', itemsText);

  const buttons: InlineKeyboard = [
    [{ text: t.chkAddItemsBtn[lang], callback_data: `chk:addi:${checklistId}` }],
    [{ text: t.chkDeleteBtn[lang], callback_data: `chk:del:${checklistId}` }],
    [{ text: '⬅️', callback_data: `chk:s:${cl.staff_id}` }],
  ];
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

// ============= ADMIN: yangi cheklist qo'shish =============

export async function startAddChecklist(
  supabase: any,
  patient: Patient,
  chatId: number,
  staffId: string,
  isDaily: boolean,
  lovableKey: string,
  telegramKey: string,
): Promise<{ ok: boolean; reason?: string }> {
  const lang = patient.language;
  if (isDaily) {
    const { data: existing } = await supabase
      .from('staff_checklists')
      .select('id')
      .eq('staff_id', staffId)
      .eq('is_daily_required', true)
      .maybeSingle();
    if (existing) {
      await sendMessage(chatId, t.chkAlreadyHasDaily[lang], {}, lovableKey, telegramKey);
      return { ok: false, reason: 'has_daily' };
    }
  }
  await setState(supabase, patient.id, 'admin:chk:title', {
    staff_id: staffId,
    is_daily: isDaily,
  });
  await sendMessage(chatId, t.chkAskTitle[lang], { removeKeyboard: true }, lovableKey, telegramKey);
  return { ok: true };
}

export async function startAddItems(
  supabase: any,
  patient: Patient,
  chatId: number,
  checklistId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await setState(supabase, patient.id, 'admin:chk:items', {
    checklist_id: checklistId,
    added: 0,
  });
  await sendMessage(chatId, t.chkTitleSaved[lang], { removeKeyboard: true }, lovableKey, telegramKey);
}

export async function handleChecklistStep(
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

  if (state === 'admin:chk:title') {
    const title = text.trim();
    if (title.length < 2 || title.length > 200) {
      await sendMessage(
        chatId,
        lang === 'uz' ? '⚠️ 2-200 belgi orasida kiriting.' : '⚠️ Введите от 2 до 200 символов.',
        {}, lovableKey, telegramKey,
      );
      return true;
    }
    const { data: created, error } = await supabase
      .from('staff_checklists')
      .insert({
        staff_id: data.staff_id,
        title,
        is_daily_required: !!data.is_daily,
      })
      .select('id')
      .single();
    if (error || !created) {
      await sendMessage(chatId, `⚠️ ${error?.message ?? 'Xato'}`, {}, lovableKey, telegramKey);
      return true;
    }
    await setState(supabase, patient.id, 'admin:chk:items', {
      checklist_id: created.id,
      added: 0,
      staff_id: data.staff_id,
    });
    await sendMessage(chatId, t.chkTitleSaved[lang], {}, lovableKey, telegramKey);
    return true;
  }

  if (state === 'admin:chk:items') {
    const checklistId = data.checklist_id as string;
    const added = (data.added as number) ?? 0;

    if (text.trim() === '/done') {
      if (added === 0) {
        await sendMessage(chatId, t.chkNeedAtLeastOne[lang], {}, lovableKey, telegramKey);
        return true;
      }
      const { data: cl } = await supabase
        .from('staff_checklists')
        .select('staff_id')
        .eq('id', checklistId)
        .maybeSingle();
      await sendMessage(
        chatId,
        t.chkItemsDone[lang].replace('{n}', String(added)),
        {}, lovableKey, telegramKey,
      );
      if (cl?.staff_id) {
        await showStaffChecklistsAdmin(supabase, patient, chatId, cl.staff_id, lovableKey, telegramKey);
      }
      return true;
    }

    const itemText = text.trim();
    if (itemText.length < 1 || itemText.length > 500) {
      await sendMessage(
        chatId,
        lang === 'uz' ? '⚠️ 1-500 belgi.' : '⚠️ 1-500 символов.',
        {}, lovableKey, telegramKey,
      );
      return true;
    }
    const { error } = await supabase.from('checklist_items').insert({
      checklist_id: checklistId,
      text: itemText,
      sort_order: added,
    });
    if (error) {
      await sendMessage(chatId, `⚠️ ${error.message}`, {}, lovableKey, telegramKey);
      return true;
    }
    const newAdded = added + 1;
    await setState(supabase, patient.id, 'admin:chk:items', {
      ...data,
      added: newAdded,
    });
    await sendMessage(
      chatId,
      `${t.chkItemAdded[lang]}${newAdded})\n\n<i>/done — ${lang === 'uz' ? 'tugatish' : 'закончить'}</i>`,
      {}, lovableKey, telegramKey,
    );
    return true;
  }

  return false;
}

export async function deleteChecklist(
  supabase: any,
  patient: Patient,
  chatId: number,
  checklistId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: cl } = await supabase
    .from('staff_checklists')
    .select('staff_id')
    .eq('id', checklistId)
    .maybeSingle();
  await supabase.from('staff_checklists').delete().eq('id', checklistId);
  await sendMessage(chatId, t.chkDeleted[lang], {}, lovableKey, telegramKey);
  if (cl?.staff_id) {
    await showStaffChecklistsAdmin(supabase, patient, chatId, cl.staff_id, lovableKey, telegramKey);
  }
}

// ============= XODIM: cheklistlar ro'yxati =============

async function getStaffByTgId(supabase: any, telegramId: number) {
  const { data } = await supabase
    .from('staff')
    .select('id, full_name, position, is_active')
    .eq('telegram_id', telegramId)
    .eq('is_active', true)
    .maybeSingle();
  return data;
}

export async function showStaffChecklistsList(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const staff = await getStaffByTgId(supabase, patient.telegram_id);
  if (!staff) return;

  const { data: lists } = await supabase
    .from('staff_checklists')
    .select('id, title, is_daily_required')
    .eq('staff_id', staff.id)
    .order('is_daily_required', { ascending: false })
    .order('sort_order')
    .order('created_at');

  if (!lists || lists.length === 0) {
    await sendMessage(chatId, t.chkUserEmpty[lang], {}, lovableKey, telegramKey);
    return;
  }

  const buttons: InlineKeyboard = (lists as Checklist[]).map((l) => {
    const badge = l.is_daily_required ? '⭐' : '📌';
    return [{ text: `${badge} ${l.title}`, callback_data: `chk:open:${l.id}` }];
  });

  await sendMessage(chatId, t.chkUserTitle[lang], { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

// Bitta cheklistni xodim ko'rishi — punktlar + ✅/❌ tugmalar
export async function showChecklistForStaff(
  supabase: any,
  patient: Patient,
  chatId: number,
  checklistId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const staff = await getStaffByTgId(supabase, patient.telegram_id);
  if (!staff) return;

  const { data: cl } = await supabase
    .from('staff_checklists')
    .select('id, title, is_daily_required, staff_id')
    .eq('id', checklistId)
    .maybeSingle();
  if (!cl || cl.staff_id !== staff.id) return;

  const { data: items } = await supabase
    .from('checklist_items')
    .select('id, text, sort_order')
    .eq('checklist_id', checklistId)
    .order('sort_order')
    .order('created_at');

  if (!items || items.length === 0) {
    await sendMessage(chatId, t.chkNoItems[lang], {}, lovableKey, telegramKey);
    return;
  }

  const date = todayDate();
  const { data: completions } = await supabase
    .from('checklist_completions')
    .select('item_id, is_done')
    .eq('staff_id', staff.id)
    .eq('completion_date', date);

  const status = new Map<string, boolean>();
  for (const c of completions ?? []) status.set(c.item_id, c.is_done);

  // Bugungi tekshiruv holati
  const { data: review } = await supabase
    .from('checklist_reviews')
    .select('status')
    .eq('staff_id', staff.id)
    .eq('checklist_id', checklistId)
    .eq('review_date', date)
    .maybeSingle();

  const badge = cl.is_daily_required ? '⭐' : '📌';
  let text = `${badge} <b>${escapeHtml(cl.title)}</b>\n<i>${todayDateLabel(lang)}</i>\n\n`;
  let doneCount = 0;
  (items as ChecklistItem[]).forEach((it, i) => {
    const s = status.get(it.id);
    const icon = s === true ? '✅' : s === false ? '❌' : '⬜️';
    if (s === true) doneCount++;
    text += `${icon} ${i + 1}. ${escapeHtml(it.text)}\n`;
  });
  text += `\n<b>${t.chkProgress[lang]}:</b> ${doneCount}/${items.length}`;

  // Tekshiruv badge
  if (review?.status === 'pending') text += t.chkSentForReviewBadge[lang];
  else if (review?.status === 'approved') text += t.chkApprovedBadge[lang];
  else if (review?.status === 'rejected') text += t.chkRejectedBadge[lang];

  const buttons: InlineKeyboard = [];
  // Approved bo'lsa — tugmalarni ko'rsatmaymiz (kun yopilgan)
  if (review?.status !== 'approved') {
    for (const it of items as ChecklistItem[]) {
      const s = status.get(it.id);
      const label = it.text.length > 28 ? it.text.slice(0, 28) + '…' : it.text;
      buttons.push([
        { text: `${s === true ? '✅' : '☑️'} ${label}`, callback_data: `cm:${it.id}:1` },
        { text: `${s === false ? '❌' : '✖️'}`, callback_data: `cm:${it.id}:0` },
      ]);
    }
  }
  buttons.push([{ text: t.chkRefreshBtn[lang], callback_data: `chk:open:${checklistId}` }]);
  buttons.push([{ text: t.chkBackToList[lang], callback_data: 'chk:list' }]);

  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

function todayDateLabel(lang: Lang): string {
  const d = new Date(Date.now() + 5 * 60 * 60 * 1000);
  return d.toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export async function markChecklistItem(
  supabase: any,
  patient: Patient,
  chatId: number,
  itemId: string,
  isDone: boolean,
  lovableKey: string,
  telegramKey: string,
) {
  const staff = await getStaffByTgId(supabase, patient.telegram_id);
  if (!staff) return;

  const date = todayDate();
  const { data: item } = await supabase
    .from('checklist_items')
    .select('id, checklist_id')
    .eq('id', itemId)
    .maybeSingle();
  if (!item) return;

  const { data: cl } = await supabase
    .from('staff_checklists')
    .select('id, staff_id, is_daily_required')
    .eq('id', item.checklist_id)
    .maybeSingle();
  if (!cl || cl.staff_id !== staff.id) return;

  await supabase.from('checklist_completions').upsert(
    {
      staff_id: staff.id,
      checklist_id: cl.id,
      item_id: itemId,
      completion_date: date,
      is_done: isDone,
      marked_at: new Date().toISOString(),
    },
    { onConflict: 'staff_id,item_id,completion_date' },
  );

  // Agar majburiy cheklist barcha punktlari belgilangan bo'lsa — koordinatorga yuboramiz
  if (cl.is_daily_required) {
    await maybeSendForReview(supabase, staff.id, cl.id, lovableKey, telegramKey);
  }

  await showChecklistForStaff(supabase, patient, chatId, cl.id, lovableKey, telegramKey);
}

async function maybeSendForReview(
  supabase: any,
  staffId: string,
  checklistId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const date = todayDate();
  const { data: items } = await supabase
    .from('checklist_items')
    .select('id')
    .eq('checklist_id', checklistId);
  const total = (items ?? []).length;
  if (total === 0) return;

  const itemIds = (items ?? []).map((i: any) => i.id);
  const { data: comps } = await supabase
    .from('checklist_completions')
    .select('item_id')
    .eq('staff_id', staffId)
    .eq('completion_date', date)
    .in('item_id', itemIds);

  if ((comps ?? []).length < total) return;

  const { notifyCoordinatorsForReview } = await import('./coordinator-handler.ts');
  await notifyCoordinatorsForReview(supabase, staffId, checklistId, lovableKey, telegramKey);
}

// "Ishni boshlash" — majburiy cheklistni avto chiqarish
export async function startWorkDay(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const staff = await getStaffByTgId(supabase, patient.telegram_id);
  if (!staff) return;

  const date = todayDate();
  // Already started?
  const { data: existing } = await supabase
    .from('staff_day_starts')
    .select('started_at')
    .eq('staff_id', staff.id)
    .eq('start_date', date)
    .maybeSingle();

  let timeStr: string;
  if (existing) {
    timeStr = new Date(existing.started_at).toLocaleString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
      hour: '2-digit', minute: '2-digit',
    });
    await sendMessage(
      chatId,
      t.chkStartDayAlready[lang].replace('{time}', escapeHtml(timeStr)),
      {}, lovableKey, telegramKey,
    );
  } else {
    await supabase.from('staff_day_starts').insert({
      staff_id: staff.id,
      start_date: date,
    });
    timeStr = new Date().toLocaleString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
      hour: '2-digit', minute: '2-digit',
    });
    await sendMessage(
      chatId,
      t.chkStartDayDone[lang].replace('{time}', escapeHtml(timeStr)),
      {}, lovableKey, telegramKey,
    );
  }

  // Majburiy cheklistni topish
  const { data: daily } = await supabase
    .from('staff_checklists')
    .select('id')
    .eq('staff_id', staff.id)
    .eq('is_daily_required', true)
    .maybeSingle();

  if (!daily) {
    await sendMessage(chatId, t.chkNoDailyOnStart[lang], {}, lovableKey, telegramKey);
    return;
  }

  await sendMessage(chatId, t.chkTodayHeader[lang], {}, lovableKey, telegramKey);
  await showChecklistForStaff(supabase, patient, chatId, daily.id, lovableKey, telegramKey);
}

// ============= ADMIN: xodim statistikasi =============

export async function showStaffStats(
  supabase: any,
  patient: Patient,
  chatId: number,
  staffId: string,
  period: Period,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: staff } = await supabase
    .from('staff')
    .select('id, full_name, position')
    .eq('id', staffId)
    .maybeSingle();
  if (!staff) return;

  const posLabel = t.staffPositions[staff.position as StaffPosition]?.[lang] ?? staff.position;
  const { from, label } = periodRange(period);

  // Day starts
  let qDays = supabase
    .from('staff_day_starts')
    .select('start_date, started_at')
    .eq('staff_id', staffId)
    .order('start_date', { ascending: false });
  if (from) qDays = qDays.gte('started_at', from);
  const { data: dayStarts } = await qDays;

  // Completions
  let qComp = supabase
    .from('checklist_completions')
    .select('item_id, is_done, completion_date')
    .eq('staff_id', staffId);
  if (from) qComp = qComp.gte('marked_at', from);
  const { data: comps } = await qComp;

  const totalMarked = (comps ?? []).length;
  const totalDone = (comps ?? []).filter((c: any) => c.is_done).length;
  const rate = totalMarked > 0 ? Math.round((totalDone / totalMarked) * 100) : 0;

  let text = t.chkStatsTitle[lang]
    .replace('{name}', escapeHtml(staff.full_name))
    .replace('{position}', escapeHtml(posLabel))
    .replace('{period}', escapeHtml(label[lang])) + '\n\n';

  text += `🌅 <b>${t.chkStatsDays[lang]}:</b> ${(dayStarts ?? []).length}\n`;
  text += `✅ <b>${t.chkStatsItemsDone[lang]}:</b> ${totalDone}\n`;
  text += `📋 <b>${t.chkStatsItemsTotal[lang]}:</b> ${totalMarked}\n`;
  text += `📊 <b>${t.chkStatsRate[lang]}:</b> ${rate}%\n`;

  if ((dayStarts ?? []).length === 0 && totalMarked === 0) {
    text += `\n<i>${t.chkStatsNoData[lang]}</i>`;
  } else if ((dayStarts ?? []).length > 0) {
    text += `\n<b>${t.chkStatsRecent[lang]}:</b>\n`;
    for (const d of (dayStarts ?? []).slice(0, 7)) {
      const time = new Date(d.started_at).toLocaleString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      });
      text += `• ${time}\n`;
    }
  }

  const buttons: InlineKeyboard = [
    [
      { text: t.statsBtnToday[lang], callback_data: `chk:stats:${staffId}:today` },
      { text: t.statsBtnWeek[lang], callback_data: `chk:stats:${staffId}:week` },
    ],
    [
      { text: t.statsBtnMonth[lang], callback_data: `chk:stats:${staffId}:month` },
      { text: t.statsBtnAll[lang], callback_data: `chk:stats:${staffId}:all` },
    ],
    [{ text: '⬅️', callback_data: `chk:s:${staffId}` }],
  ];

  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

// ============= CALLBACK ROUTER =============

export async function handleChecklistCallback(
  supabase: any,
  patient: Patient,
  chatId: number,
  data: string,
  answerCb: (text?: string) => Promise<void>,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  // Admin: xodim cheklistlari ekrani
  if (data.startsWith('chk:s:')) {
    const staffId = data.slice('chk:s:'.length);
    await answerCb();
    await showStaffChecklistsAdmin(supabase, patient, chatId, staffId, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('chk:v:')) {
    const id = data.slice('chk:v:'.length);
    await answerCb();
    await viewChecklistAdmin(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('chk:add:')) {
    // chk:add:d:<staffId> | chk:add:e:<staffId>
    const rest = data.slice('chk:add:'.length);
    const [kind, staffId] = rest.split(':');
    const isDaily = kind === 'd';
    await answerCb();
    await startAddChecklist(supabase, patient, chatId, staffId, isDaily, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('chk:addi:')) {
    const id = data.slice('chk:addi:'.length);
    await answerCb();
    await startAddItems(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('chk:del:')) {
    const id = data.slice('chk:del:'.length);
    await answerCb('🗑');
    await deleteChecklist(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('chk:stats:')) {
    const rest = data.slice('chk:stats:'.length);
    const [staffId, period] = rest.split(':');
    if (['today', 'week', 'month', 'all'].includes(period)) {
      await answerCb();
      await showStaffStats(supabase, patient, chatId, staffId, period as Period, lovableKey, telegramKey);
      return true;
    }
  }

  // Xodim: cheklistlar ro'yxati
  if (data === 'chk:list') {
    await answerCb();
    await showStaffChecklistsList(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('chk:open:')) {
    const id = data.slice('chk:open:'.length);
    await answerCb();
    await showChecklistForStaff(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('cm:')) {
    // cm:<itemId>:<0|1> — qisqa format (Telegram callback_data 64 bayt limiti)
    const rest = data.slice('cm:'.length);
    const parts = rest.split(':');
    if (parts.length === 2) {
      const [itemId, val] = parts;
      await answerCb(val === '1' ? '✅' : '❌');
      await markChecklistItem(supabase, patient, chatId, itemId, val === '1', lovableKey, telegramKey);
      return true;
    }
  }
  if (data.startsWith('chk:m:')) {
    // Eski format — orqaga moslik uchun
    const rest = data.slice('chk:m:'.length);
    const parts = rest.split(':');
    if (parts.length === 3) {
      const [, itemId, val] = parts;
      await answerCb(val === '1' ? '✅' : '❌');
      await markChecklistItem(supabase, patient, chatId, itemId, val === '1', lovableKey, telegramKey);
      return true;
    }
  }
  return false;
}
