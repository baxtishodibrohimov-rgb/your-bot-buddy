// Koordinator uchun maxsus statistika:
// 1) Xodimlar davomati (bugun)
// 2) Majburiy cheklistlar holati (bugun)
// 3) Bemorlar ro'yxati (eng yangi 50 ta)
import { sendMessage, escapeHtml, type ReplyKeyboard } from './telegram-api.ts';
import { t, type Lang } from './i18n.ts';
import { type StaffPosition } from './staff-handler.ts';

type Patient = {
  id: string;
  telegram_id: number;
  language: Lang;
  state: string | null;
  state_data: Record<string, unknown> | null;
};

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

export function coordStatsKeyboard(lang: Lang): ReplyKeyboard {
  return [
    [{ text: t.coordStatsAttendance[lang] }],
    [{ text: t.coordStatsChecklists[lang] }],
    [{ text: t.coordStatsPatients[lang] }],
    [{ text: t.staffMenu.exit[lang] }],
  ];
}

export async function showCoordStatsMenu(
  chatId: number,
  lang: Lang,
  lovableKey: string,
  telegramKey: string,
) {
  await sendMessage(
    chatId,
    t.coordStatsTitle[lang],
    { replyKeyboard: coordStatsKeyboard(lang) },
    lovableKey,
    telegramKey,
  );
}

// ============= 1) DAVOMAT =============

export async function showAttendanceReport(
  supabase: any,
  chatId: number,
  lang: Lang,
  lovableKey: string,
  telegramKey: string,
) {
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
    let came = 0;
    let missing = 0;
    for (const s of staff) {
      const startedAt = startMap.get(s.id);
      const posLabel = t.staffPositions[s.position as StaffPosition]?.[lang] ?? s.position;
      if (startedAt) {
        came++;
        const time = new Date(startedAt).toLocaleTimeString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
          hour: '2-digit', minute: '2-digit',
        });
        text += `🟢 <b>${escapeHtml(s.full_name)}</b> — ${escapeHtml(posLabel)} <i>(${time})</i>\n`;
      } else {
        missing++;
        text += `⚪ <b>${escapeHtml(s.full_name)}</b> — ${escapeHtml(posLabel)}\n`;
      }
    }
    text += `\n<b>📊 Jami:</b> ${staff.length}   🟢 ${came}   ⚪ ${missing}`;
  }
  await sendMessage(chatId, text, {}, lovableKey, telegramKey);
}

// ============= 2) MAJBURIY CHEKLISTLAR HOLATI =============

export async function showChecklistsReport(
  supabase: any,
  chatId: number,
  lang: Lang,
  lovableKey: string,
  telegramKey: string,
) {
  const date = todayDate();

  // Faqat majburiy cheklistlar
  const { data: checklists } = await supabase
    .from('staff_checklists')
    .select('id, title, staff_id')
    .eq('is_daily_required', true)
    .order('sort_order');

  if (!checklists || checklists.length === 0) {
    await sendMessage(
      chatId,
      `${t.coordChkReportTitle[lang]} <i>(${todayDateLabel(lang)})</i>\n\n${t.coordChkReportEmpty[lang]}`,
      {},
      lovableKey,
      telegramKey,
    );
    return;
  }

  // Xodimlar
  const staffIds = Array.from(new Set(checklists.map((c: any) => c.staff_id)));
  const { data: staffRows } = await supabase
    .from('staff')
    .select('id, full_name, position')
    .in('id', staffIds);
  const staffMap = new Map<string, { full_name: string; position: string }>();
  for (const s of staffRows ?? []) staffMap.set(s.id, { full_name: s.full_name, position: s.position });

  // Itemlar (har cheklist uchun)
  const checklistIds = checklists.map((c: any) => c.id);
  const { data: items } = await supabase
    .from('checklist_items')
    .select('id, checklist_id')
    .in('checklist_id', checklistIds);
  const itemsByChk = new Map<string, string[]>();
  for (const it of items ?? []) {
    const arr = itemsByChk.get(it.checklist_id) ?? [];
    arr.push(it.id);
    itemsByChk.set(it.checklist_id, arr);
  }

  // Bugungi bajarilishlar
  const { data: completions } = await supabase
    .from('checklist_completions')
    .select('item_id, is_done, staff_id, checklist_id')
    .eq('completion_date', date)
    .in('checklist_id', checklistIds);
  // key: `${staff_id}:${checklist_id}` -> { done, total }
  const compMap = new Map<string, { done: number; marked: number }>();
  for (const c of completions ?? []) {
    const key = `${c.staff_id}:${c.checklist_id}`;
    const cur = compMap.get(key) ?? { done: 0, marked: 0 };
    cur.marked++;
    if (c.is_done) cur.done++;
    compMap.set(key, cur);
  }

  // Reviewlar (bugungi)
  const { data: reviews } = await supabase
    .from('checklist_reviews')
    .select('staff_id, checklist_id, status')
    .eq('review_date', date)
    .in('checklist_id', checklistIds);
  const reviewMap = new Map<string, string>();
  for (const r of reviews ?? []) reviewMap.set(`${r.staff_id}:${r.checklist_id}`, r.status);

  // Lavozim bo'yicha guruhlash
  let text = `${t.coordChkReportTitle[lang]} <i>(${todayDateLabel(lang)})</i>\n\n`;

  // Xodim+cheklist bo'yicha lavozim guruhlash
  type Row = { staffName: string; position: string; title: string; key: string };
  const rows: Row[] = [];
  for (const c of checklists as any[]) {
    const s = staffMap.get(c.staff_id);
    if (!s) continue;
    rows.push({
      staffName: s.full_name,
      position: s.position,
      title: c.title,
      key: `${c.staff_id}:${c.id}`,
    });
  }
  rows.sort((a, b) => (a.position + a.staffName).localeCompare(b.position + b.staffName));

  let lastPos = '';
  let countDone = 0, countPartial = 0, countEmpty = 0;
  for (const row of rows) {
    if (row.position !== lastPos) {
      const posLabel = t.staffPositions[row.position as StaffPosition]?.[lang] ?? row.position;
      text += `\n<b>💼 ${escapeHtml(posLabel)}</b>\n`;
      lastPos = row.position;
    }
    const totalItems = (itemsByChk.get(row.key.split(':')[1]) ?? []).length;
    const comp = compMap.get(row.key);
    const reviewStatus = reviewMap.get(row.key);

    let statusIcon = '⚪';
    let statusLabel = t.coordChkStatusEmpty[lang];

    if (reviewStatus === 'approved') {
      statusIcon = '✅';
      statusLabel = t.coordChkStatusApproved[lang];
      countDone++;
    } else if (reviewStatus === 'pending') {
      statusIcon = '⏳';
      statusLabel = t.coordChkStatusPending[lang];
      countPartial++;
    } else if (reviewStatus === 'rejected') {
      statusIcon = '❌';
      statusLabel = t.coordChkStatusRejected[lang];
      countPartial++;
    } else if (comp && comp.marked > 0) {
      if (totalItems > 0 && comp.marked >= totalItems) {
        statusIcon = '🟡';
        statusLabel = `${t.coordChkStatusPartial[lang]} (${comp.done}/${totalItems})`;
        countPartial++;
      } else {
        statusIcon = '🟡';
        statusLabel = `${t.coordChkStatusPartial[lang]} (${comp.marked}/${totalItems})`;
        countPartial++;
      }
    } else {
      countEmpty++;
    }

    text += `${statusIcon} <b>${escapeHtml(row.staffName)}</b> — ${escapeHtml(row.title)}\n   <i>${statusLabel}</i>\n`;
  }

  text += `\n<b>📊 Jami:</b> ${rows.length}   ✅ ${countDone}   🟡 ${countPartial}   ⚪ ${countEmpty}`;

  await sendMessage(chatId, text, {}, lovableKey, telegramKey);
}

// ============= 3) BEMORLAR RO'YXATI =============

export async function showPatientsList(
  supabase: any,
  chatId: number,
  lang: Lang,
  lovableKey: string,
  telegramKey: string,
) {
  const { data: patients } = await supabase
    .from('patients')
    .select('first_name, last_name, telegram_username, phone, language, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  let text = `${t.coordPatientsTitle[lang]}\n`;

  if (!patients || patients.length === 0) {
    text += `\n${t.coordPatientsEmpty[lang]}`;
    await sendMessage(chatId, text, {}, lovableKey, telegramKey);
    return;
  }

  // Telegram limit ~4096. 50 ta bemor bilan ehtiyot bo'lib uzun bo'lib ketsa bo'lib yuboramiz.
  const chunks: string[] = [];
  let buf = text;
  let i = 0;
  for (const p of patients) {
    i++;
    const name = [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || '—';
    const uname = p.telegram_username ? ` @${p.telegram_username}` : '';
    const phone = p.phone ? ` 📞 <code>${escapeHtml(p.phone)}</code>` : '';
    const lng = p.language === 'ru' ? '🇷🇺' : '🇺🇿';
    const date = new Date(p.created_at).toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', {
      day: '2-digit', month: '2-digit',
    });
    const line = `\n${i}. ${lng} <b>${escapeHtml(name)}</b>${escapeHtml(uname)}${phone} <i>(${date})</i>`;
    if (buf.length + line.length > 3800) {
      chunks.push(buf);
      buf = '';
    }
    buf += line;
  }
  if (buf) chunks.push(buf);

  for (const c of chunks) {
    await sendMessage(chatId, c, {}, lovableKey, telegramKey);
  }
}
