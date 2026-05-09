// Laboratoriya moduli
// - Lab xodimlari /laboratoriya orqali kiradi (admin ro'yxatga oladi)
// - Koordinator yangi apparat qo'shadi va lab xodimlariga yetkaziladi
// - Lab xodimi qabul qiladi -> tayyorlanmoqda (1 hafta) -> tayyor
// - Admin: lab xodimlari, apparat nomlari, shifokorlar va barcha ishlarni boshqaradi

import {
  sendMessage,
  sendMediaByType,
  escapeHtml,
  type InlineKeyboard,
  type ReplyKeyboard,
} from './telegram-api.ts';
import { t, type Lang } from './i18n.ts';
import { extractMediaFromMessage, saveAdminMedia } from './media-handler.ts';

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

type LabWorker = { id: string; full_name: string; telegram_id: number; is_active: boolean };
type LabOrder = {
  id: string;
  patient_full_name: string;
  appliance_name: string;
  doctor_name: string;
  notes: string | null;
  status: string;
  ready_due_date: string | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  reject_reason: string | null;
  created_by_telegram_id: number;
  accepted_by_lab_worker_id: string | null;
};

async function setState(supabase: any, patientId: string, state: string | null, stateData: any = null) {
  await supabase.from('patients').update({ state, state_data: stateData }).eq('id', patientId);
}

function fmtDate(iso: string | null, lang: Lang): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function fmtDateOnly(d: string | null, lang: Lang): string {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function todayPlusDays(days: number): string {
  // Asia/Tashkent (UTC+5)
  const d = new Date(Date.now() + 5 * 60 * 60 * 1000 + days * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

// ============= RUXSAT =============

export async function isLabWorker(supabase: any, telegramId: number): Promise<LabWorker | null> {
  const { data } = await supabase
    .from('lab_workers')
    .select('id, full_name, telegram_id, is_active')
    .eq('telegram_id', telegramId)
    .eq('is_active', true)
    .maybeSingle();
  return (data as LabWorker) ?? null;
}

// ============= LAB XODIM PORTALI (/laboratoriya) =============

function labMenuKeyboard(lang: Lang): ReplyKeyboard {
  return [
    [{ text: t.labMenuNew[lang] }, { text: t.labMenuInProgress[lang] }],
    [{ text: t.labMenuDone[lang] }],
    [{ text: t.labMenuExit[lang] }],
  ];
}

export async function handleLaboratoryCommand(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const worker = await isLabWorker(supabase, patient.telegram_id);
  if (!worker) {
    await sendMessage(chatId, t.labNotAuthorized[lang], {}, lovableKey, telegramKey);
    return;
  }
  await setState(supabase, patient.id, 'lab:menu', { worker_id: worker.id });
  await sendMessage(
    chatId,
    t.labGreeting[lang].replace('{name}', escapeHtml(worker.full_name)),
    { replyKeyboard: labMenuKeyboard(lang) },
    lovableKey,
    telegramKey,
  );
}

async function showLabOrdersList(
  supabase: any,
  chatId: number,
  lang: Lang,
  status: 'new' | 'in_progress' | 'done',
  lovableKey: string,
  telegramKey: string,
) {
  // 'done' uchun: laboratoriya tugatgan barcha ishlar (koordinator qabul qilgan 'received' ham shu ro'yxatda qoladi)
  const query = supabase
    .from('lab_orders')
    .select('id, patient_full_name, appliance_name, status')
    .order('created_at', { ascending: false });
  const { data: orders } = status === 'done'
    ? await query.in('status', ['done', 'received'])
    : await query.eq('status', status);

  const titleMap = {
    new: t.labListNewTitle[lang],
    in_progress: t.labListInProgressTitle[lang],
    done: t.labListDoneTitle[lang],
  };
  const title = titleMap[status];

  if (!orders || orders.length === 0) {
    await sendMessage(chatId, `${title}\n\n${t.labListEmpty[lang]}`, {}, lovableKey, telegramKey);
    return;
  }

  const buttons: InlineKeyboard = orders.map((o: any) => [{
    text: `${o.status === 'received' ? '📬' : '👤'} ${o.patient_full_name} — ${o.appliance_name}`,
    callback_data: `lab:o:${o.id}`,
  }]);

  await sendMessage(chatId, title, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

async function showLabOrderDetail(
  supabase: any,
  chatId: number,
  lang: Lang,
  orderId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const { data: order } = await supabase
    .from('lab_orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) {
    await sendMessage(chatId, t.labListEmpty[lang], {}, lovableKey, telegramKey);
    return;
  }
  const o = order as LabOrder;

  let header: string;
  if (o.status === 'new') {
    header = t.labOrderCardNew[lang]
      .replace('{patient}', escapeHtml(o.patient_full_name))
      .replace('{appliance}', escapeHtml(o.appliance_name))
      .replace('{doctor}', escapeHtml(o.doctor_name))
      .replace('{created}', fmtDate(o.created_at, lang));
  } else if (o.status === 'in_progress') {
    header = t.labOrderCardInProgress[lang]
      .replace('{patient}', escapeHtml(o.patient_full_name))
      .replace('{appliance}', escapeHtml(o.appliance_name))
      .replace('{doctor}', escapeHtml(o.doctor_name))
      .replace('{accepted}', fmtDate(o.accepted_at, lang))
      .replace('{due}', fmtDateOnly(o.ready_due_date, lang));
  } else {
    header = t.labOrderCardDone[lang]
      .replace('{patient}', escapeHtml(o.patient_full_name))
      .replace('{appliance}', escapeHtml(o.appliance_name))
      .replace('{doctor}', escapeHtml(o.doctor_name))
      .replace('{completed}', fmtDate(o.completed_at, lang));
  }
  if (o.notes) header += `\n\n${t.labOrderNotesLabel[lang]}: ${escapeHtml(o.notes)}`;

  await sendMessage(chatId, header, {}, lovableKey, telegramKey);

  // Media biriktirmalari (xray, scanner, note)
  await sendOrderMediaByKind(supabase, chatId, o.id, 'xray3d', t.labOrderXrayLabel[lang], lovableKey, telegramKey);
  await sendOrderMediaByKind(supabase, chatId, o.id, 'scanner', t.labOrderScannerLabel[lang], lovableKey, telegramKey);
  await sendOrderMediaByKind(supabase, chatId, o.id, 'note', t.labOrderNotesLabel[lang], lovableKey, telegramKey);

  // Amal tugmalari
  let actionKb: InlineKeyboard | undefined;
  if (o.status === 'new') {
    actionKb = [[
      { text: t.labAcceptBtn[lang], callback_data: `lab:acc:${o.id}` },
      { text: t.labRejectBtn[lang], callback_data: `lab:rej:${o.id}` },
    ]];
  } else if (o.status === 'in_progress') {
    actionKb = [[{ text: t.labReadyBtn[lang], callback_data: `lab:rdy:${o.id}` }]];
  }
  if (actionKb) {
    await sendMessage(chatId, '👇', { inlineKeyboard: actionKb }, lovableKey, telegramKey);
  }
}

async function sendOrderMediaByKind(
  supabase: any,
  chatId: number,
  orderId: string,
  kind: string,
  label: string,
  lovableKey: string,
  telegramKey: string,
) {
  const { data: rows } = await supabase
    .from('lab_order_media')
    .select('caption_override, media:media_library(file_type, file_id, caption)')
    .eq('order_id', orderId)
    .eq('kind', kind)
    .order('sort_order');
  if (!rows || rows.length === 0) return;
  await sendMessage(chatId, `<b>${label}</b>`, {}, lovableKey, telegramKey);
  for (const r of rows) {
    const m = (r as any).media;
    if (!m) continue;
    const caption = r.caption_override ?? m.caption ?? undefined;
    try {
      await sendMediaByType(chatId, m.file_type, m.file_id, caption ? { caption } : {}, lovableKey, telegramKey);
    } catch (e) {
      console.error('lab order media send failed', e);
    }
  }
}

// ============= LAB XODIM AMALLARI =============

async function acceptLabOrder(
  supabase: any,
  patient: Patient,
  chatId: number,
  orderId: string,
  worker: LabWorker,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const due = todayPlusDays(7);
  const { data: updated } = await supabase
    .from('lab_orders')
    .update({
      status: 'in_progress',
      accepted_by_lab_worker_id: worker.id,
      accepted_at: new Date().toISOString(),
      ready_due_date: due,
    })
    .eq('id', orderId)
    .eq('status', 'new')
    .select('*')
    .maybeSingle();

  if (!updated) {
    await sendMessage(chatId, t.labListEmpty[lang], {}, lovableKey, telegramKey);
    return;
  }
  await sendMessage(
    chatId,
    t.labAcceptedMsg[lang].replace('{due}', fmtDateOnly(due, lang)),
    {},
    lovableKey,
    telegramKey,
  );
  // Koordinatorni xabardor qilamiz
  await notifyCoordinator(
    supabase,
    updated.created_by_telegram_id,
    t.labNotifyAcceptedToCoord[lang]
      .replace('{patient}', escapeHtml(updated.patient_full_name))
      .replace('{appliance}', escapeHtml(updated.appliance_name))
      .replace('{worker}', escapeHtml(worker.full_name))
      .replace('{due}', fmtDateOnly(due, lang)),
    lovableKey,
    telegramKey,
  );
  await notifyAdminsLab(
    supabase,
    `✅ <b>Lab qabul qildi</b>\n👤 ${escapeHtml(updated.patient_full_name)}\n🦷 ${escapeHtml(updated.appliance_name)}\n🧑‍🔧 ${escapeHtml(worker.full_name)}`,
    lovableKey,
    telegramKey,
  );
}

async function startRejectLabOrder(
  supabase: any,
  patient: Patient,
  chatId: number,
  orderId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await setState(supabase, patient.id, 'lab:rej:reason', { order_id: orderId });
  await sendMessage(chatId, t.labRejectAskReason[lang], {}, lovableKey, telegramKey);
}

export async function handleLabRejectReason(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const sd = (patient.state_data as any) ?? {};
  const orderId = sd.order_id as string;
  if (!orderId) {
    await setState(supabase, patient.id, 'lab:menu', null);
    return;
  }
  const reason = text.trim().slice(0, 500);
  const worker = await isLabWorker(supabase, patient.telegram_id);

  const { data: updated } = await supabase
    .from('lab_orders')
    .update({
      status: 'rejected',
      reject_reason: reason,
      accepted_by_lab_worker_id: worker?.id ?? null,
    })
    .eq('id', orderId)
    .eq('status', 'new')
    .select('*')
    .maybeSingle();

  await setState(supabase, patient.id, 'lab:menu', { worker_id: worker?.id });
  await sendMessage(
    chatId,
    t.labRejectedMsg[lang],
    { replyKeyboard: labMenuKeyboard(lang) },
    lovableKey,
    telegramKey,
  );

  if (updated) {
    await notifyCoordinator(
      supabase,
      updated.created_by_telegram_id,
      t.labNotifyRejectedToCoord[lang]
        .replace('{patient}', escapeHtml(updated.patient_full_name))
        .replace('{appliance}', escapeHtml(updated.appliance_name))
        .replace('{worker}', escapeHtml(worker?.full_name ?? '—'))
        .replace('{reason}', escapeHtml(reason)),
      lovableKey,
      telegramKey,
    );
  }
}

async function markLabOrderReady(
  supabase: any,
  patient: Patient,
  chatId: number,
  orderId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const worker = await isLabWorker(supabase, patient.telegram_id);
  const { data: updated } = await supabase
    .from('lab_orders')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'in_progress')
    .select('*')
    .maybeSingle();

  if (!updated) {
    await sendMessage(chatId, t.labListEmpty[lang], {}, lovableKey, telegramKey);
    return;
  }
  await sendMessage(chatId, t.labReadyDoneMsg[lang], {}, lovableKey, telegramKey);
  const doneText = t.labNotifyDoneToCoord[lang]
    .replace('{patient}', escapeHtml(updated.patient_full_name))
    .replace('{appliance}', escapeHtml(updated.appliance_name))
    .replace('{worker}', escapeHtml(worker?.full_name ?? '—'));
  await notifyAllCoordinators(supabase, doneText, lovableKey, telegramKey);
  await notifyAdminsLab(
    supabase,
    `🎉 <b>Apparat tayyor!</b>\n👤 ${escapeHtml(updated.patient_full_name)}\n🦷 ${escapeHtml(updated.appliance_name)}\n🧑‍🔧 ${escapeHtml(worker?.full_name ?? '—')}`,
    lovableKey,
    telegramKey,
  );
}

// ============= LAB XODIM PORTAL ROUTING =============

export async function handleLabPortalMessage(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const lang = patient.language;
  const worker = await isLabWorker(supabase, patient.telegram_id);
  if (!worker) {
    await setState(supabase, patient.id, null, null);
    return false;
  }

  if (text === t.labMenuNew.uz || text === t.labMenuNew.ru) {
    await showLabOrdersList(supabase, chatId, lang, 'new', lovableKey, telegramKey);
    return true;
  }
  if (text === t.labMenuInProgress.uz || text === t.labMenuInProgress.ru) {
    await showLabOrdersList(supabase, chatId, lang, 'in_progress', lovableKey, telegramKey);
    return true;
  }
  if (text === t.labMenuDone.uz || text === t.labMenuDone.ru) {
    await showLabOrdersList(supabase, chatId, lang, 'done', lovableKey, telegramKey);
    return true;
  }
  if (text === t.labMenuExit.uz || text === t.labMenuExit.ru) {
    await setState(supabase, patient.id, null, null);
    await sendMessage(chatId, t.labExited[lang], { removeKeyboard: true }, lovableKey, telegramKey);
    return true;
  }
  return false;
}

export async function handleLabCallback(
  supabase: any,
  patient: Patient,
  chatId: number,
  data: string,
  ack: (text?: string) => Promise<void>,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const lang = patient.language;

  if (data.startsWith('lab:o:')) {
    const id = data.slice('lab:o:'.length);
    await ack();
    await showLabOrderDetail(supabase, chatId, lang, id, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('lab:acc:')) {
    const id = data.slice('lab:acc:'.length);
    const worker = await isLabWorker(supabase, patient.telegram_id);
    if (!worker) { await ack('⛔️'); return true; }
    await ack('✅');
    await acceptLabOrder(supabase, patient, chatId, id, worker, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('lab:rej:')) {
    const id = data.slice('lab:rej:'.length);
    await ack();
    await startRejectLabOrder(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('lab:rdy:')) {
    const id = data.slice('lab:rdy:'.length);
    await ack('✅');
    await markLabOrderReady(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }
  return false;
}

// ============= BILDIRISHNOMALAR =============

async function notifyCoordinator(
  supabase: any,
  coordTgId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
) {
  if (!coordTgId) return;
  try {
    await sendMessage(coordTgId, text, {}, lovableKey, telegramKey);
  } catch (e) {
    console.error('notifyCoordinator failed', e);
  }
}

async function notifyAdminsLab(
  supabase: any,
  text: string,
  lovableKey: string,
  telegramKey: string,
) {
  const { data: admins } = await supabase.from('admins').select('telegram_id');
  for (const a of (admins ?? [])) {
    try {
      await sendMessage(a.telegram_id, text, {}, lovableKey, telegramKey);
    } catch (e) {
      console.error('notifyAdminsLab failed', e);
    }
  }
}

async function notifyAllLabWorkers(
  supabase: any,
  text: string,
  lovableKey: string,
  telegramKey: string,
) {
  const { data: workers } = await supabase
    .from('lab_workers')
    .select('telegram_id')
    .eq('is_active', true);
  for (const w of (workers ?? [])) {
    try {
      await sendMessage(w.telegram_id, text, {}, lovableKey, telegramKey);
    } catch (e) {
      console.error('notifyAllLabWorkers failed', e);
    }
  }
}

async function notifyAllCoordinators(
  supabase: any,
  text: string,
  lovableKey: string,
  telegramKey: string,
) {
  const { data: coords } = await supabase
    .from('staff')
    .select('telegram_id')
    .eq('position', 'koordinator')
    .eq('is_active', true);
  const seen = new Set<number>();
  for (const c of (coords ?? [])) {
    if (!c.telegram_id || seen.has(c.telegram_id)) continue;
    seen.add(c.telegram_id);
    try {
      await sendMessage(c.telegram_id, text, {}, lovableKey, telegramKey);
    } catch (e) {
      console.error('notifyAllCoordinators failed', e);
    }
  }
}

// ===========================================================
// ============= KOORDINATOR LAB BO'LIMI =====================
// ===========================================================

export async function showCoordLabMenu(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await setState(supabase, patient.id, 'coord:lab', null);
  const buttons: InlineKeyboard = [
    [{ text: t.coordLabAddBtn[lang], callback_data: 'clab:add' }],
    [{ text: t.coordLabInProgressBtn[lang], callback_data: 'clab:inprog' }],
    [{ text: t.coordLabIncomingBtn[lang], callback_data: 'clab:incoming' }],
    [{ text: t.coordLabCompletedBtn[lang], callback_data: 'clab:completed' }],
  ];
  await sendMessage(chatId, t.coordLabTitle[lang], { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

async function startCoordAddOrder(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await setState(supabase, patient.id, 'clab:add:patient', { media: { xray3d: [], scanner: [], note: [] } });
  await sendMessage(chatId, t.labAskPatient[lang], { removeKeyboard: true }, lovableKey, telegramKey);
}

// Tayyorlashda: koordinator yuborgan, hali tayyor bo'lmagan (new + in_progress)
async function showCoordInProgressOrders(
  supabase: any,
  chatId: number,
  lang: Lang,
  lovableKey: string,
  telegramKey: string,
) {
  const { data: orders } = await supabase
    .from('lab_orders')
    .select('id, patient_full_name, appliance_name, doctor_name, status, ready_due_date, created_at')
    .in('status', ['new', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (!orders || orders.length === 0) {
    await sendMessage(chatId, `${t.coordLabInProgressTitle[lang]}\n\n${t.coordLabListEmpty[lang]}`, {}, lovableKey, telegramKey);
    return;
  }
  await sendMessage(chatId, t.coordLabInProgressTitle[lang], {}, lovableKey, telegramKey);
  for (const o of orders) {
    const stIcon = o.status === 'new' ? '🆕' : '⚙️';
    let text = `${stIcon} <b>${escapeHtml(o.patient_full_name)}</b> — ${escapeHtml(o.appliance_name)}\n   👨‍⚕️ ${escapeHtml(o.doctor_name)}`;
    if (o.status === 'in_progress' && o.ready_due_date) {
      text += `\n   ⏰ ${fmtDateOnly(o.ready_due_date, lang)}`;
    }
    // Faqat 'new' (lab hali qabul qilmagan) buyurtmalarni tahrirlash mumkin
    const buttons: InlineKeyboard | undefined = o.status === 'new'
      ? [[{ text: lang === 'uz' ? '✏️ Tahrirlash' : '✏️ Редактировать', callback_data: `clab:e:${o.id}` }]]
      : undefined;
    await sendMessage(chatId, text, buttons ? { inlineKeyboard: buttons } : {}, lovableKey, telegramKey);
  }
}

// ===== KOORDINATOR: BUYURTMANI TAHRIRLASH =====
async function showCoordEditMenu(
  supabase: any,
  patient: Patient,
  chatId: number,
  orderId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: o } = await supabase
    .from('lab_orders')
    .select('id, status, patient_full_name, appliance_name, doctor_name, notes')
    .eq('id', orderId)
    .maybeSingle();
  if (!o) {
    await sendMessage(chatId, t.coordLabListEmpty[lang], {}, lovableKey, telegramKey);
    return;
  }
  if (o.status !== 'new') {
    await sendMessage(
      chatId,
      lang === 'uz'
        ? '⚠️ Bu buyurtmani tahrirlab bo\'lmaydi — laboratoriya allaqachon qabul qilgan.'
        : '⚠️ Этот заказ нельзя редактировать — лаборатория уже принял.',
      {}, lovableKey, telegramKey,
    );
    return;
  }
  await setState(supabase, patient.id, 'clab:edit:menu', { order_id: orderId });
  const text = (lang === 'uz' ? '✏️ <b>Tahrirlash</b>' : '✏️ <b>Редактирование</b>')
    + `\n\n👤 ${escapeHtml(o.patient_full_name)}\n🦷 ${escapeHtml(o.appliance_name)}\n👨‍⚕️ ${escapeHtml(o.doctor_name)}`
    + (o.notes ? `\n📝 ${escapeHtml(o.notes)}` : '')
    + `\n\n${lang === 'uz' ? 'Qaysi qismni tahrirlamoqchisiz?' : 'Какую часть редактировать?'}`;
  const buttons: InlineKeyboard = [
    [{ text: lang === 'uz' ? '👤 Bemor ismi' : '👤 ФИО пациента', callback_data: `clab:ef:${orderId}:patient` }],
    [{ text: lang === 'uz' ? '🦷 Apparat turi' : '🦷 Тип аппарата', callback_data: `clab:ef:${orderId}:appliance` }],
    [{ text: lang === 'uz' ? '👨‍⚕️ Shifokor' : '👨‍⚕️ Врач', callback_data: `clab:ef:${orderId}:doctor` }],
    [{ text: lang === 'uz' ? '📝 Izoh' : '📝 Заметка', callback_data: `clab:ef:${orderId}:notes` }],
    [{ text: lang === 'uz' ? '🦴 3D rentgen' : '🦴 3D рентген', callback_data: `clab:ef:${orderId}:xray` }],
    [{ text: lang === 'uz' ? '📡 Skaner' : '📡 Сканер', callback_data: `clab:ef:${orderId}:scanner` }],
  ];
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

async function startEditField(
  supabase: any,
  patient: Patient,
  chatId: number,
  orderId: string,
  field: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const sd: any = { order_id: orderId, media_ids: [] };
  if (field === 'patient') {
    await setState(supabase, patient.id, 'clab:edit:patient', sd);
    await sendMessage(chatId, t.labAskPatient[lang], {}, lovableKey, telegramKey);
    return;
  }
  if (field === 'notes') {
    await setState(supabase, patient.id, 'clab:edit:notes', sd);
    await sendMessage(
      chatId,
      lang === 'uz'
        ? '📝 Yangi izohni yuboring (eski izoh almashtiriladi). Bo\'sh qoldirish uchun: <code>—</code>\n\n/cancel — bekor'
        : '📝 Отправьте новую заметку (старая будет заменена). Для очистки: <code>—</code>\n\n/cancel — отмена',
      {}, lovableKey, telegramKey,
    );
    return;
  }
  if (field === 'appliance') {
    await setState(supabase, patient.id, 'clab:edit:appliance', sd);
    await showApplianceTypePicker(supabase, chatId, lang, lovableKey, telegramKey);
    return;
  }
  if (field === 'doctor') {
    await setState(supabase, patient.id, 'clab:edit:doctor', sd);
    await showDoctorPicker(supabase, chatId, lang, lovableKey, telegramKey);
    return;
  }
  if (field === 'xray' || field === 'scanner') {
    const stateName = field === 'xray' ? 'clab:edit:xray' : 'clab:edit:scanner';
    await setState(supabase, patient.id, stateName, sd);
    const askMsg = field === 'xray' ? t.labAskXray[lang] : t.labAskScanner[lang];
    await sendMessage(
      chatId,
      askMsg + (lang === 'uz' ? '\n\n<i>Tugatish:</i> /done' : '\n\n<i>Завершить:</i> /done'),
      {}, lovableKey, telegramKey,
    );
    return;
  }
}

async function notifyLabOrderUpdated(
  supabase: any,
  order: any,
  lovableKey: string,
  telegramKey: string,
) {
  const text = `🔄 <b>Buyurtma yangilandi</b>\n\n👤 ${escapeHtml(order.patient_full_name)}\n🦷 ${escapeHtml(order.appliance_name)}\n👨‍⚕️ ${escapeHtml(order.doctor_name)}\n\n/laboratoriya — Yangi apparatlar bo'limini qaytadan oching.`;
  await notifyAllLabWorkers(supabase, text, lovableKey, telegramKey);
}

async function finalizeEdit(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const sd = (patient.state_data as any) ?? {};
  const orderId = sd.order_id as string;
  await setState(supabase, patient.id, null, null);
  if (!orderId) return;
  const { data: order } = await supabase.from('lab_orders').select('*').eq('id', orderId).maybeSingle();
  if (!order || order.status !== 'new') {
    await sendMessage(chatId, lang === 'uz' ? '⚠️ Buyurtma topilmadi yoki allaqachon qabul qilingan.' : '⚠️ Заказ не найден или уже принят.', {}, lovableKey, telegramKey);
    return;
  }
  await sendMessage(chatId, lang === 'uz' ? '✅ Saqlandi va laboratoriya xodimlari xabardor qilindi.' : '✅ Сохранено и сотрудники лаборатории уведомлены.', {}, lovableKey, telegramKey);
  await notifyLabOrderUpdated(supabase, order, lovableKey, telegramKey);
}


// Kelgan: laboratoriya tayyor deb belgilagan, hali koordinator qabul qilmagan (status='done')
async function showCoordIncomingOrders(
  supabase: any,
  chatId: number,
  lang: Lang,
  lovableKey: string,
  telegramKey: string,
) {
  const { data: orders } = await supabase
    .from('lab_orders')
    .select('id, patient_full_name, appliance_name, doctor_name, completed_at')
    .eq('status', 'done')
    .order('completed_at', { ascending: false })
    .limit(50);

  if (!orders || orders.length === 0) {
    await sendMessage(chatId, `${t.coordLabIncomingTitle[lang]}\n\n${t.coordLabListEmpty[lang]}`, {}, lovableKey, telegramKey);
    return;
  }
  await sendMessage(chatId, t.coordLabIncomingTitle[lang], {}, lovableKey, telegramKey);
  for (const o of orders) {
    const text = `📦 <b>${escapeHtml(o.patient_full_name)}</b>\n🦷 ${escapeHtml(o.appliance_name)}\n👨‍⚕️ ${escapeHtml(o.doctor_name)}\n✅ ${fmtDate(o.completed_at, lang)}`;
    const buttons: InlineKeyboard = [[{ text: t.coordLabReceiveBtn[lang], callback_data: `clab:rcv:${o.id}` }]];
    await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
  }
}

// Tugagan: koordinator qabul qilgan (status='received')
async function showCoordCompletedOrders(
  supabase: any,
  chatId: number,
  lang: Lang,
  lovableKey: string,
  telegramKey: string,
) {
  const { data: orders } = await supabase
    .from('lab_orders')
    .select('id, patient_full_name, appliance_name, doctor_name, completed_at')
    .eq('status', 'received')
    .order('completed_at', { ascending: false })
    .limit(50);

  if (!orders || orders.length === 0) {
    await sendMessage(chatId, `${t.coordLabCompletedTitle[lang]}\n\n${t.coordLabListEmpty[lang]}`, {}, lovableKey, telegramKey);
    return;
  }
  let text = `${t.coordLabCompletedTitle[lang]}\n\n`;
  for (const o of orders) {
    text += `✅ <b>${escapeHtml(o.patient_full_name)}</b> — ${escapeHtml(o.appliance_name)}\n   👨‍⚕️ ${escapeHtml(o.doctor_name)} • ${fmtDate(o.completed_at, lang)}\n\n`;
  }
  await sendMessage(chatId, text, {}, lovableKey, telegramKey);
}

async function markCoordOrderReceived(
  supabase: any,
  patient: Patient,
  chatId: number,
  orderId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: updated } = await supabase
    .from('lab_orders')
    .update({ status: 'received' })
    .eq('id', orderId)
    .eq('status', 'done')
    .select('*')
    .maybeSingle();
  if (!updated) {
    await sendMessage(chatId, t.coordLabListEmpty[lang], {}, lovableKey, telegramKey);
    return;
  }
  await sendMessage(chatId, t.coordLabReceivedMsg[lang], {}, lovableKey, telegramKey);
}

// Koordinator yangi apparat qo'shish: matn xabarlari
export async function handleCoordLabStep(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const lang = patient.language;
  const state = patient.state ?? '';
  const sd = (patient.state_data as any) ?? {};

  // ===== EDIT (text) =====
  if (state === 'clab:edit:patient') {
    const name = text.trim();
    if (name.length < 2 || name.length > 200) {
      await sendMessage(chatId, lang === 'uz' ? '⚠️ Ism 2-200 belgi.' : '⚠️ Имя 2-200 символов.', {}, lovableKey, telegramKey);
      return true;
    }
    const orderId = sd.order_id as string;
    await supabase.from('lab_orders').update({ patient_full_name: name, updated_at: new Date().toISOString() }).eq('id', orderId).eq('status', 'new');
    await finalizeEdit(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (state === 'clab:edit:notes') {
    const orderId = sd.order_id as string;
    const newNotes = text.trim() === '—' ? null : text.trim().slice(0, 2000);
    await supabase.from('lab_orders').update({ notes: newNotes, updated_at: new Date().toISOString() }).eq('id', orderId).eq('status', 'new');
    await finalizeEdit(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (state === 'clab:edit:xray' || state === 'clab:edit:scanner') {
    if (text === '/done' || text === '/skip') {
      const orderId = sd.order_id as string;
      const kind = state === 'clab:edit:xray' ? 'xray3d' : 'scanner';
      const newIds: string[] = sd.media_ids ?? [];
      // Eskilarni o'chiramiz
      await supabase.from('lab_order_media').delete().eq('order_id', orderId).eq('kind', kind);
      // Yangilarni qo'shamiz
      if (newIds.length > 0) {
        await supabase.from('lab_order_media').insert(newIds.map((mid, idx) => ({
          order_id: orderId, media_id: mid, kind, sort_order: idx,
        })));
      }
      await finalizeEdit(supabase, patient, chatId, lovableKey, telegramKey);
      return true;
    }
  }


  if (state === 'clab:add:patient') {
    const name = text.trim();
    if (name.length < 2 || name.length > 200) {
      await sendMessage(chatId, lang === 'uz' ? '⚠️ Ism 2-200 belgi.' : '⚠️ Имя 2-200 символов.', {}, lovableKey, telegramKey);
      return true;
    }
    sd.patient_full_name = name;
    await setState(supabase, patient.id, 'clab:add:appliance', sd);
    await showApplianceTypePicker(supabase, chatId, lang, lovableKey, telegramKey);
    return true;
  }

  if (state === 'clab:add:notes:text') {
    if (text === '/skip' || text === '/next') {
      await finalizeCoordOrder(supabase, patient, chatId, lovableKey, telegramKey);
      return true;
    }
    sd.notes = (sd.notes ?? '') + (sd.notes ? '\n' : '') + text.trim();
    await setState(supabase, patient.id, 'clab:add:notes:text', sd);
    await sendMessage(chatId, t.labFileSaved[lang] + ' ' + t.labMoreFilesHint[lang], {}, lovableKey, telegramKey);
    return true;
  }

  // /next va /skip — qadamdan o'tish (media qadamlarida)
  if (text === '/next' || text === '/skip') {
    if (state === 'clab:add:xray') {
      sd.step = 'scanner';
      await setState(supabase, patient.id, 'clab:add:scanner', sd);
      await sendMessage(chatId, t.labAskScanner[lang], {}, lovableKey, telegramKey);
      return true;
    }
    if (state === 'clab:add:scanner') {
      sd.step = 'note';
      await setState(supabase, patient.id, 'clab:add:notes:text', sd);
      await sendMessage(chatId, t.labAskNotes[lang], {}, lovableKey, telegramKey);
      return true;
    }
    if (state === 'clab:add:notes:text') {
      await finalizeCoordOrder(supabase, patient, chatId, lovableKey, telegramKey);
      return true;
    }
  }

  return false;
}

async function showApplianceTypePicker(
  supabase: any,
  chatId: number,
  lang: Lang,
  lovableKey: string,
  telegramKey: string,
) {
  const { data: items } = await supabase
    .from('lab_appliance_types')
    .select('id, name')
    .eq('is_active', true)
    .order('sort_order');
  const buttons: InlineKeyboard = (items ?? []).map((i: any) => [{ text: `🦷 ${i.name}`, callback_data: `clab:app:${i.id}` }]);
  if (buttons.length === 0) {
    await sendMessage(chatId, lang === 'uz' ? '⚠️ Apparat nomlari yo\'q. Admin qo\'shishi kerak.' : '⚠️ Названий нет. Админ должен добавить.', {}, lovableKey, telegramKey);
    return;
  }
  await sendMessage(chatId, t.labAskAppliance[lang], { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

async function showDoctorPicker(
  supabase: any,
  chatId: number,
  lang: Lang,
  lovableKey: string,
  telegramKey: string,
) {
  const { data: items } = await supabase
    .from('lab_doctors')
    .select('id, full_name')
    .eq('is_active', true)
    .order('sort_order');
  const buttons: InlineKeyboard = (items ?? []).map((i: any) => [{ text: `👨‍⚕️ ${i.full_name}`, callback_data: `clab:doc:${i.id}` }]);
  if (buttons.length === 0) {
    await sendMessage(chatId, lang === 'uz' ? '⚠️ Shifokorlar ro\'yxati yo\'q. Admin qo\'shishi kerak.' : '⚠️ Список врачей пуст. Админ должен добавить.', {}, lovableKey, telegramKey);
    return;
  }
  await sendMessage(chatId, t.labAskDoctor[lang], { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

export async function handleCoordLabCallback(
  supabase: any,
  patient: Patient,
  chatId: number,
  data: string,
  ack: (text?: string) => Promise<void>,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const lang = patient.language;
  const sd = (patient.state_data as any) ?? {};

  if (data === 'clab:add') {
    await ack();
    await startCoordAddOrder(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (data === 'clab:ready' || data === 'clab:incoming') {
    await ack();
    await showCoordIncomingOrders(supabase, chatId, lang, lovableKey, telegramKey);
    return true;
  }
  if (data === 'clab:inprog') {
    await ack();
    await showCoordInProgressOrders(supabase, chatId, lang, lovableKey, telegramKey);
    return true;
  }
  if (data === 'clab:completed') {
    await ack();
    await showCoordCompletedOrders(supabase, chatId, lang, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('clab:rcv:')) {
    const id = data.slice('clab:rcv:'.length);
    await ack('📬');
    await markCoordOrderReceived(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('clab:app:')) {
    const id = data.slice('clab:app:'.length);
    const { data: app } = await supabase.from('lab_appliance_types').select('id, name').eq('id', id).maybeSingle();
    if (!app) { await ack('⚠️'); return true; }
    if ((patient.state ?? '') === 'clab:edit:appliance' && sd.order_id) {
      await supabase.from('lab_orders')
        .update({ appliance_type_id: app.id, appliance_name: app.name, updated_at: new Date().toISOString() })
        .eq('id', sd.order_id).eq('status', 'new');
      await ack('✅');
      await finalizeEdit(supabase, patient, chatId, lovableKey, telegramKey);
      return true;
    }
    sd.appliance_type_id = app.id;
    sd.appliance_name = app.name;
    await setState(supabase, patient.id, 'clab:add:doctor', sd);
    await ack();
    await showDoctorPicker(supabase, chatId, lang, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('clab:doc:')) {
    const id = data.slice('clab:doc:'.length);
    const { data: doc } = await supabase.from('lab_doctors').select('id, full_name').eq('id', id).maybeSingle();
    if (!doc) { await ack('⚠️'); return true; }
    if ((patient.state ?? '') === 'clab:edit:doctor' && sd.order_id) {
      await supabase.from('lab_orders')
        .update({ doctor_id: doc.id, doctor_name: doc.full_name, updated_at: new Date().toISOString() })
        .eq('id', sd.order_id).eq('status', 'new');
      await ack('✅');
      await finalizeEdit(supabase, patient, chatId, lovableKey, telegramKey);
      return true;
    }
    sd.doctor_id = doc.id;
    sd.doctor_name = doc.full_name;
    await setState(supabase, patient.id, 'clab:add:xray', sd);
    await ack();
    await sendMessage(chatId, t.labAskXray[lang], {}, lovableKey, telegramKey);
    return true;
  }
  // Tahrirlash menyusini ochish
  if (data.startsWith('clab:e:')) {
    const id = data.slice('clab:e:'.length);
    await ack();
    await showCoordEditMenu(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }
  // Tahrirlash maydonini boshlash: clab:ef:<orderId>:<field>
  if (data.startsWith('clab:ef:')) {
    const rest = data.slice('clab:ef:'.length);
    const sep = rest.lastIndexOf(':');
    if (sep === -1) { await ack('⚠️'); return true; }
    const orderId = rest.slice(0, sep);
    const field = rest.slice(sep + 1);
    await ack();
    await startEditField(supabase, patient, chatId, orderId, field, lovableKey, telegramKey);
    return true;
  }
  return false;
}

// Koordinator media yuborganda (xray, scanner, note bosqichida)
export async function handleCoordLabMedia(
  supabase: any,
  patient: Patient,
  admin: Admin | null,
  chatId: number,
  msg: any,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const state = patient.state ?? '';
  const lang = patient.language;
  const sd = (patient.state_data as any) ?? {};

  let kind: 'xray3d' | 'scanner' | 'note' | null = null;
  if (state === 'clab:add:xray') kind = 'xray3d';
  else if (state === 'clab:add:scanner') kind = 'scanner';
  else if (state === 'clab:add:notes:text') kind = 'note';
  if (!kind) return false;

  // Mediani saqlash uchun upload qiluvchi sifatida adminni yoki koordinatorni ishlatamiz.
  // Bizning saveAdminMedia admin obyektini talab qiladi — koordinator uchun "soxta" admin obyekti yaratish kerak.
  // Eng oson yo'l: media_library ga to'g'ridan-to'g'ri yozamiz.
  const media = extractMediaFromMessage(msg);
  if (!media) return false;
  const { data: inserted } = await supabase
    .from('media_library')
    .insert({
      uploaded_by_admin_id: admin?.id ?? null,
      uploaded_by_telegram_id: patient.telegram_id,
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

  if (!inserted) {
    await sendMessage(chatId, '⚠️ ' + (lang === 'uz' ? 'Saqlab bo\'lmadi.' : 'Не удалось сохранить.'), {}, lovableKey, telegramKey);
    return true;
  }

  const list: string[] = sd.media?.[kind] ?? [];
  list.push(inserted.id);
  sd.media = sd.media ?? { xray3d: [], scanner: [], note: [] };
  sd.media[kind] = list;
  await setState(supabase, patient.id, state, sd);

  await sendMessage(
    chatId,
    `${t.labFileSaved[lang]} (${list.length})\n\n${t.labMoreFilesHint[lang]}`,
    {},
    lovableKey,
    telegramKey,
  );
  return true;
}

async function finalizeCoordOrder(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const sd = (patient.state_data as any) ?? {};
  if (!sd.patient_full_name || !sd.appliance_name || !sd.doctor_name) {
    await sendMessage(chatId, '⚠️', {}, lovableKey, telegramKey);
    return;
  }

  // Koordinator staff.id ni topishga harakat qilamiz
  const { data: coordStaff } = await supabase
    .from('staff')
    .select('id')
    .eq('telegram_id', patient.telegram_id)
    .eq('position', 'koordinator')
    .maybeSingle();

  const { data: order } = await supabase
    .from('lab_orders')
    .insert({
      patient_full_name: sd.patient_full_name,
      appliance_type_id: sd.appliance_type_id ?? null,
      appliance_name: sd.appliance_name,
      doctor_id: sd.doctor_id ?? null,
      doctor_name: sd.doctor_name,
      notes: sd.notes ?? null,
      status: 'new',
      created_by_coord_staff_id: coordStaff?.id ?? null,
      created_by_telegram_id: patient.telegram_id,
    })
    .select('*')
    .single();

  if (!order) {
    await sendMessage(chatId, '⚠️', {}, lovableKey, telegramKey);
    return;
  }

  // Media biriktirmalarini bog'lash
  const allRows: any[] = [];
  for (const kind of ['xray3d', 'scanner', 'note'] as const) {
    const ids: string[] = sd.media?.[kind] ?? [];
    ids.forEach((mid, idx) => allRows.push({
      order_id: order.id,
      media_id: mid,
      kind,
      sort_order: idx,
    }));
  }
  if (allRows.length > 0) {
    await supabase.from('lab_order_media').insert(allRows);
  }

  await setState(supabase, patient.id, null, null);
  await sendMessage(chatId, t.labOrderCreated[lang], {}, lovableKey, telegramKey);

  // Lab xodimlarga xabar
  const notifText = t.labNotifyNewToWorker[lang]
    .replace('{patient}', escapeHtml(order.patient_full_name))
    .replace('{appliance}', escapeHtml(order.appliance_name))
    .replace('{doctor}', escapeHtml(order.doctor_name));
  await notifyAllLabWorkers(supabase, notifText, lovableKey, telegramKey);
  await notifyAdminsLab(
    supabase,
    `🆕 <b>Yangi lab buyurtma</b>\n👤 ${escapeHtml(order.patient_full_name)}\n🦷 ${escapeHtml(order.appliance_name)}\n👨‍⚕️ ${escapeHtml(order.doctor_name)}`,
    lovableKey,
    telegramKey,
  );

  // Koordinator menyusiga qaytamiz (staff portali)
  const { handleStaffCommand } = await import('./staff-handler.ts');
  await handleStaffCommand(supabase, patient, chatId, lovableKey, telegramKey);
}

// ===========================================================
// ============= ADMIN: LABORATORIYA BOSHQARUVI ==============
// ===========================================================

export async function showAdminLabHome(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await setState(supabase, patient.id, 'admin:lab', null);
  const buttons: InlineKeyboard = [
    [{ text: t.adminLabWorkersBtn[lang], callback_data: 'alab:wkr' }],
    [
      { text: t.adminLabAppliancesBtn[lang], callback_data: 'alab:app' },
      { text: t.adminLabDoctorsBtn[lang], callback_data: 'alab:doc' },
    ],
    [{ text: t.adminLabOrdersNewBtn[lang], callback_data: 'alab:ord:new' }],
    [{ text: t.adminLabOrdersInProgressBtn[lang], callback_data: 'alab:ord:in_progress' }],
    [{ text: t.adminLabOrdersDoneBtn[lang], callback_data: 'alab:ord:done' }],
  ];
  await sendMessage(chatId, t.adminLabHomeTitle[lang], { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

// ----- Lab xodimlari -----
async function showAdminLabWorkers(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: list } = await supabase
    .from('lab_workers')
    .select('id, full_name, telegram_id, is_active')
    .order('created_at', { ascending: false });

  let text = `${t.adminLabWorkersTitle[lang]}\n\n`;
  if (!list || list.length === 0) {
    text += t.adminLabWorkersEmpty[lang];
  } else {
    for (const w of list) {
      const s = w.is_active ? '🟢' : '⚪';
      text += `${s} <b>${escapeHtml(w.full_name)}</b> — <code>${w.telegram_id}</code>\n`;
    }
  }
  const buttons: InlineKeyboard = [
    [{ text: t.adminLabWorkerAdd[lang], callback_data: 'alab:wkr:add' }],
  ];
  if (list) {
    for (const w of list.slice(0, 20)) {
      buttons.push([{ text: `🗑 ${w.full_name}`, callback_data: `alab:wkr:del:${w.id}` }]);
    }
  }
  buttons.push([{ text: lang === 'uz' ? '⬅️ Orqaga' : '⬅️ Назад', callback_data: 'alab:home' }]);
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

// ----- Apparat nomlari -----
async function showAdminLabAppliances(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: list } = await supabase
    .from('lab_appliance_types')
    .select('id, name, is_active')
    .order('sort_order')
    .order('created_at');
  let text = `${t.adminLabAppliancesTitle[lang]}\n\n`;
  if (!list || list.length === 0) text += t.adminLabAppliancesEmpty[lang];
  else for (const a of list) text += `${a.is_active ? '🟢' : '⚪'} <b>${escapeHtml(a.name)}</b>\n`;
  const buttons: InlineKeyboard = [[{ text: t.adminLabApplianceAdd[lang], callback_data: 'alab:app:add' }]];
  if (list) for (const a of list) buttons.push([{ text: `🗑 ${a.name}`, callback_data: `alab:app:del:${a.id}` }]);
  buttons.push([{ text: lang === 'uz' ? '⬅️ Orqaga' : '⬅️ Назад', callback_data: 'alab:home' }]);
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

// ----- Shifokorlar -----
async function showAdminLabDoctors(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: list } = await supabase
    .from('lab_doctors')
    .select('id, full_name, is_active')
    .order('sort_order')
    .order('created_at');
  let text = `${t.adminLabDoctorsTitle[lang]}\n\n`;
  if (!list || list.length === 0) text += t.adminLabDoctorsEmpty[lang];
  else for (const d of list) text += `${d.is_active ? '🟢' : '⚪'} <b>${escapeHtml(d.full_name)}</b>\n`;
  const buttons: InlineKeyboard = [[{ text: t.adminLabDoctorAdd[lang], callback_data: 'alab:doc:add' }]];
  if (list) for (const d of list) buttons.push([{ text: `🗑 ${d.full_name}`, callback_data: `alab:doc:del:${d.id}` }]);
  buttons.push([{ text: lang === 'uz' ? '⬅️ Orqaga' : '⬅️ Назад', callback_data: 'alab:home' }]);
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

// ----- Orderlar (ko'rish) -----
async function showAdminLabOrders(
  supabase: any,
  chatId: number,
  lang: Lang,
  status: string,
  lovableKey: string,
  telegramKey: string,
) {
  const titleMap: Record<string, string> = {
    new: t.adminLabOrdersNewBtn[lang],
    in_progress: t.adminLabOrdersInProgressBtn[lang],
    done: t.adminLabOrdersDoneBtn[lang],
  };
  const { data: orders } = await supabase
    .from('lab_orders')
    .select('id, patient_full_name, appliance_name, doctor_name, created_at, ready_due_date, completed_at')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50);

  let text = `<b>${escapeHtml(titleMap[status] ?? status)}</b>\n\n`;
  if (!orders || orders.length === 0) {
    text += t.adminLabOrdersEmpty[lang];
  } else {
    for (const o of orders) {
      text += `👤 <b>${escapeHtml(o.patient_full_name)}</b>\n   🦷 ${escapeHtml(o.appliance_name)} • 👨‍⚕️ ${escapeHtml(o.doctor_name)}\n`;
      if (status === 'new') text += `   📅 ${fmtDate(o.created_at, lang)}\n`;
      if (status === 'in_progress') text += `   ⏰ ${fmtDateOnly(o.ready_due_date, lang)}\n`;
      if (status === 'done') text += `   ✅ ${fmtDate(o.completed_at, lang)}\n`;
      text += '\n';
    }
  }
  await sendMessage(
    chatId,
    text,
    { inlineKeyboard: [[{ text: lang === 'uz' ? '⬅️ Orqaga' : '⬅️ Назад', callback_data: 'alab:home' }]] },
    lovableKey,
    telegramKey,
  );
}

// ----- Admin lab matn xabarlar (state) -----
export async function handleAdminLabMessage(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const lang = patient.language;
  const state = patient.state ?? '';
  const sd = (patient.state_data as any) ?? {};

  if (state === 'admin:lab:wkr:tg') {
    const trimmed = text.trim().replace(/^@/, '');
    if (!/^\d+$/.test(trimmed)) {
      await sendMessage(chatId, t.adminLabWorkerInvalidTg[lang], {}, lovableKey, telegramKey);
      return true;
    }
    const tg = Number(trimmed);
    const { data: existing } = await supabase.from('lab_workers').select('id').eq('telegram_id', tg).maybeSingle();
    if (existing) {
      await sendMessage(chatId, t.adminLabWorkerDuplicate[lang], {}, lovableKey, telegramKey);
      return true;
    }
    sd.telegram_id = tg;
    await setState(supabase, patient.id, 'admin:lab:wkr:name', sd);
    await sendMessage(chatId, t.adminLabAskWorkerName[lang], {}, lovableKey, telegramKey);
    return true;
  }
  if (state === 'admin:lab:wkr:name') {
    const name = text.trim().slice(0, 200);
    if (name.length < 2) return true;
    await supabase.from('lab_workers').insert({
      telegram_id: sd.telegram_id,
      full_name: name,
      is_active: true,
      added_by_telegram_id: patient.telegram_id,
    });
    await setState(supabase, patient.id, 'admin:lab', null);
    await sendMessage(chatId, t.adminLabWorkerAdded[lang], {}, lovableKey, telegramKey);
    await showAdminLabWorkers(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }

  if (state === 'admin:lab:app:add') {
    const name = text.trim().slice(0, 100);
    if (name.length < 2) return true;
    const { data: existing } = await supabase.from('lab_appliance_types').select('id').eq('name', name).maybeSingle();
    if (existing) {
      await sendMessage(chatId, t.adminLabApplianceDuplicate[lang], {}, lovableKey, telegramKey);
      return true;
    }
    await supabase.from('lab_appliance_types').insert({ name, is_active: true });
    await setState(supabase, patient.id, 'admin:lab', null);
    await sendMessage(chatId, t.adminLabApplianceAdded[lang], {}, lovableKey, telegramKey);
    await showAdminLabAppliances(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }

  if (state === 'admin:lab:doc:add') {
    const name = text.trim().slice(0, 200);
    if (name.length < 2) return true;
    const { data: existing } = await supabase.from('lab_doctors').select('id').eq('full_name', name).maybeSingle();
    if (existing) {
      await sendMessage(chatId, t.adminLabDoctorDuplicate[lang], {}, lovableKey, telegramKey);
      return true;
    }
    await supabase.from('lab_doctors').insert({ full_name: name, is_active: true });
    await setState(supabase, patient.id, 'admin:lab', null);
    await sendMessage(chatId, t.adminLabDoctorAdded[lang], {}, lovableKey, telegramKey);
    await showAdminLabDoctors(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }

  return false;
}

export async function handleAdminLabCallback(
  supabase: any,
  patient: Patient,
  chatId: number,
  data: string,
  ack: (text?: string) => Promise<void>,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const lang = patient.language;

  if (data === 'alab:home') {
    await ack();
    await showAdminLabHome(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (data === 'alab:wkr') {
    await ack();
    await showAdminLabWorkers(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (data === 'alab:wkr:add') {
    await ack();
    await setState(supabase, patient.id, 'admin:lab:wkr:tg', {});
    await sendMessage(chatId, t.adminLabAskWorkerTg[lang], {}, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('alab:wkr:del:')) {
    const id = data.slice('alab:wkr:del:'.length);
    await supabase.from('lab_workers').delete().eq('id', id);
    await ack('🗑');
    await sendMessage(chatId, t.adminLabWorkerDeleted[lang], {}, lovableKey, telegramKey);
    await showAdminLabWorkers(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }

  if (data === 'alab:app') {
    await ack();
    await showAdminLabAppliances(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (data === 'alab:app:add') {
    await ack();
    await setState(supabase, patient.id, 'admin:lab:app:add', {});
    await sendMessage(chatId, t.adminLabAskApplianceName[lang], {}, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('alab:app:del:')) {
    const id = data.slice('alab:app:del:'.length);
    await supabase.from('lab_appliance_types').delete().eq('id', id);
    await ack('🗑');
    await sendMessage(chatId, t.adminLabApplianceDeleted[lang], {}, lovableKey, telegramKey);
    await showAdminLabAppliances(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }

  if (data === 'alab:doc') {
    await ack();
    await showAdminLabDoctors(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (data === 'alab:doc:add') {
    await ack();
    await setState(supabase, patient.id, 'admin:lab:doc:add', {});
    await sendMessage(chatId, t.adminLabAskDoctorName[lang], {}, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('alab:doc:del:')) {
    const id = data.slice('alab:doc:del:'.length);
    await supabase.from('lab_doctors').delete().eq('id', id);
    await ack('🗑');
    await sendMessage(chatId, t.adminLabDoctorDeleted[lang], {}, lovableKey, telegramKey);
    await showAdminLabDoctors(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }

  if (data.startsWith('alab:ord:')) {
    const status = data.slice('alab:ord:'.length);
    await ack();
    await showAdminLabOrders(supabase, chatId, lang, status, lovableKey, telegramKey);
    return true;
  }

  return false;
}
