// Rezidentura bo'limi
// - Faqat ro'yxatga olingan rezidentlar /rezidentura orqali kira oladi
// - Cheksiz daraxt: bo'lim ichida bo'lim
// - Har bir bo'limga media va testlar qo'shsa bo'ladi
// - Test natijalari saqlanadi
// - Admin tomondan boshqariladi (admin "🎓 Rezidentura" tugmasi orqali)

import {
  sendMessage,
  sendMediaByType,
  answerCallbackQuery,
  escapeHtml,
  type InlineKeyboard,
  type ReplyKeyboard,
} from './telegram-api.ts';
import { type Lang } from './i18n.ts';
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

type Section = {
  id: string;
  parent_id: string | null;
  title: string;
  is_root: boolean;
  sort_order: number;
};

type TestOption = { text: string; is_correct: boolean };

async function setState(supabase: any, patientId: string, state: string | null, stateData: any = null) {
  await supabase.from('patients').update({ state, state_data: stateData }).eq('id', patientId);
}

// ============= RUXSAT =============

export async function isResident(supabase: any, telegramId: number): Promise<{ id: string; full_name: string | null } | null> {
  const { data } = await supabase
    .from('residents')
    .select('id, full_name, is_active')
    .eq('telegram_id', telegramId)
    .maybeSingle();
  if (!data || !data.is_active) return null;
  return { id: data.id, full_name: data.full_name };
}

// ============= REZIDENT MENYUSI (foydalanuvchi tomon) =============

function residentMenuKeyboard(lang: Lang): ReplyKeyboard {
  return [
    [{ text: lang === 'uz' ? '📚 Bo\'limlar' : '📚 Разделы' }],
    [{ text: lang === 'uz' ? '📊 Mening natijalarim' : '📊 Мои результаты' }],
    [{ text: lang === 'uz' ? '🚪 Chiqish' : '🚪 Выход' }],
  ];
}

export async function showResidentHome(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await setState(supabase, patient.id, 'res:home', null);
  const text = lang === 'uz'
    ? '🎓 <b>Rezidentura</b>\n\nXush kelibsiz! Quyidagi bo\'limlardan tanlang.\n\n⚠️ <b>Diqqat:</b> Bu bo\'limdagi barcha materiallar (videolar, rasmlar, matnlar, testlar) <b>maxfiy</b>. Ularni boshqalarga jo\'natish, saqlash va nusxalash <b>taqiqlangan</b> va texnik jihatdan bloklangan.'
    : '🎓 <b>Резидентура</b>\n\nДобро пожаловать! Выберите раздел.\n\n⚠️ <b>Внимание:</b> Все материалы этого раздела (видео, изображения, тексты, тесты) являются <b>конфиденциальными</b>. Их пересылка, сохранение и копирование <b>запрещены</b> и технически заблокированы.';
  await sendMessage(chatId, text, { replyKeyboard: residentMenuKeyboard(lang) }, lovableKey, telegramKey);
  await showSectionsForResident(supabase, patient, chatId, null, lovableKey, telegramKey);
}

async function showSectionsForResident(
  supabase: any,
  patient: Patient,
  chatId: number,
  parentId: string | null,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const query = supabase.from('resident_sections').select('*').order('sort_order').order('created_at');
  const { data: sections } = parentId === null
    ? await query.is('parent_id', null)
    : await query.eq('parent_id', parentId);

  let parent: Section | null = null;
  if (parentId) {
    const { data } = await supabase.from('resident_sections').select('*').eq('id', parentId).maybeSingle();
    parent = data as Section | null;
  }

  const title = parent
    ? `📁 <b>${escapeHtml(parent.title)}</b>`
    : (lang === 'uz' ? '📚 <b>Asosiy bo\'limlar</b>' : '📚 <b>Основные разделы</b>');

  const buttons: InlineKeyboard = [];
  for (const s of (sections ?? []) as Section[]) {
    buttons.push([{ text: `📁 ${s.title}`, callback_data: `res:nav:${s.id}` }]);
  }
  if (parent) {
    const backCb = parent.parent_id ? `res:nav:${parent.parent_id}` : 'res:nav:root';
    buttons.push([{ text: lang === 'uz' ? '⬅️ Orqaga' : '⬅️ Назад', callback_data: backCb }]);
  }

  await sendMessage(chatId, title, { ...(buttons.length ? { inlineKeyboard: buttons } : {}), protectContent: true }, lovableKey, telegramKey);

  // Agar parent bor bo'lsa — uning media va testlarini ko'rsatamiz
  if (parent) {
    await sendSectionContentToResident(supabase, patient, chatId, parent, lovableKey, telegramKey);
  }
}

async function sendSectionContentToResident(
  supabase: any,
  patient: Patient,
  chatId: number,
  section: Section,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;

  // Media
  const { data: mediaRows } = await supabase
    .from('resident_section_media')
    .select('caption_override, media:media_library(file_id, file_type, caption)')
    .eq('section_id', section.id)
    .order('sort_order');

  // Testlar mavjudligi
  const { data: tests } = await supabase
    .from('resident_tests')
    .select('id, question')
    .eq('section_id', section.id)
    .order('sort_order')
    .order('created_at');

  const hasTests = (tests ?? []).length > 0;
  const testKb: InlineKeyboard | undefined = hasTests
    ? [[{
        text: lang === 'uz' ? '📝 Shu mavzu bo\'yicha test' : '📝 Тест по этой теме',
        callback_data: `res:tstart:${section.id}`,
      }]]
    : undefined;

  if (!mediaRows || mediaRows.length === 0) {
    if (testKb) {
      await sendMessage(
        chatId,
        lang === 'uz' ? '📝 Bu bo\'lim uchun test mavjud.' : '📝 По этому разделу есть тест.',
        { inlineKeyboard: testKb },
        lovableKey,
        telegramKey,
      );
    }
    return;
  }

  for (let i = 0; i < mediaRows.length; i++) {
    const row: any = mediaRows[i];
    if (!row.media) continue;
    const caption = row.caption_override ?? row.media.caption ?? undefined;
    const isLast = i === mediaRows.length - 1;
    try {
      await sendMediaByType(
        chatId,
        row.media.file_type,
        row.media.file_id,
        {
          caption,
          // Test tugmasi faqat oxirgi mediaga biriktiriladi
          inlineKeyboard: isLast && testKb ? testKb : undefined,
        },
        lovableKey,
        telegramKey,
      );
    } catch (e) {
      console.error('resident media send failed', e);
    }
  }
}

// ============= TESTLAR (foydalanuvchi tomon) =============

async function startTestForResident(
  supabase: any,
  patient: Patient,
  chatId: number,
  sectionId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const { data: tests } = await supabase
    .from('resident_tests')
    .select('id')
    .eq('section_id', sectionId)
    .order('sort_order')
    .order('created_at');

  if (!tests || tests.length === 0) {
    const lang = patient.language;
    await sendMessage(
      chatId,
      lang === 'uz' ? '⚠️ Test topilmadi.' : '⚠️ Тест не найден.',
      {},
      lovableKey,
      telegramKey,
    );
    return;
  }

  await sendNextTest(supabase, patient, chatId, sectionId, 0, { correct: 0, total: 0 }, lovableKey, telegramKey);
}

async function sendNextTest(
  supabase: any,
  patient: Patient,
  chatId: number,
  sectionId: string,
  index: number,
  score: { correct: number; total: number },
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: tests } = await supabase
    .from('resident_tests')
    .select('id, question, options')
    .eq('section_id', sectionId)
    .order('sort_order')
    .order('created_at');

  if (!tests || index >= tests.length) {
    const text = lang === 'uz'
      ? `🎉 <b>Test yakunlandi!</b>\n\n📊 Natija: <b>${score.correct}/${score.total}</b>`
      : `🎉 <b>Тест завершён!</b>\n\n📊 Результат: <b>${score.correct}/${score.total}</b>`;
    await sendMessage(chatId, text, {}, lovableKey, telegramKey);
    await setState(supabase, patient.id, 'res:home', null);
    return;
  }

  const test = tests[index];
  const options = (test.options as TestOption[]) ?? [];
  const buttons: InlineKeyboard = options.map((opt, i) => ([{
    text: opt.text.length > 60 ? opt.text.slice(0, 57) + '...' : opt.text,
    callback_data: `res:tans:${test.id}:${i}:${index}:${sectionId}:${score.correct}:${score.total}`,
  }]));

  const header = lang === 'uz'
    ? `❓ <b>Savol ${index + 1}/${tests.length}</b>\n\n`
    : `❓ <b>Вопрос ${index + 1}/${tests.length}</b>\n\n`;

  await setState(supabase, patient.id, `res:t:${sectionId}`, { index, score });
  await sendMessage(chatId, header + escapeHtml(test.question), { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

async function handleTestAnswer(
  supabase: any,
  patient: Patient,
  chatId: number,
  payload: string,
  lovableKey: string,
  telegramKey: string,
) {
  // testId:optIndex:qIndex:sectionId:correct:total
  const parts = payload.split(':');
  if (parts.length < 6) return;
  const [testId, optIdxStr, qIdxStr, sectionId, correctStr, totalStr] = parts;
  const optIdx = parseInt(optIdxStr, 10);
  const qIdx = parseInt(qIdxStr, 10);
  let correct = parseInt(correctStr, 10);
  let total = parseInt(totalStr, 10);

  const { data: test } = await supabase
    .from('resident_tests')
    .select('options')
    .eq('id', testId)
    .maybeSingle();

  if (!test) return;
  const options = (test.options as TestOption[]) ?? [];
  const chosen = options[optIdx];
  const isCorrect = !!chosen?.is_correct;

  total += 1;
  if (isCorrect) correct += 1;

  // Natijani saqlash
  const { data: resident } = await supabase
    .from('residents')
    .select('id')
    .eq('telegram_id', patient.telegram_id)
    .maybeSingle();
  if (resident) {
    await supabase.from('resident_test_attempts').insert({
      resident_id: resident.id,
      resident_telegram_id: patient.telegram_id,
      section_id: sectionId,
      test_id: testId,
      selected_option_index: optIdx,
      is_correct: isCorrect,
    });
  }

  const lang = patient.language;
  const fb = isCorrect
    ? (lang === 'uz' ? '✅ <b>To\'g\'ri!</b>' : '✅ <b>Верно!</b>')
    : (lang === 'uz' ? '❌ <b>Noto\'g\'ri.</b>' : '❌ <b>Неверно.</b>');
  const correctOpt = options.find((o) => o.is_correct);
  const right = correctOpt
    ? `\n\n${lang === 'uz' ? 'To\'g\'ri javob' : 'Правильный ответ'}: <b>${escapeHtml(correctOpt.text)}</b>`
    : '';
  await sendMessage(chatId, fb + right, {}, lovableKey, telegramKey);

  await sendNextTest(supabase, patient, chatId, sectionId, qIdx + 1, { correct, total }, lovableKey, telegramKey);
}

async function showMyResults(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: attempts } = await supabase
    .from('resident_test_attempts')
    .select('section_id, is_correct, answered_at')
    .eq('resident_telegram_id', patient.telegram_id)
    .order('answered_at', { ascending: false })
    .limit(500);

  if (!attempts || attempts.length === 0) {
    await sendMessage(
      chatId,
      lang === 'uz' ? '📊 Hali test ishlamagansiz.' : '📊 Вы пока не проходили тесты.',
      {},
      lovableKey,
      telegramKey,
    );
    return;
  }

  // Bo'limlar bo'yicha guruhlash
  const bySection = new Map<string, { correct: number; total: number }>();
  for (const a of attempts) {
    const s = bySection.get(a.section_id) ?? { correct: 0, total: 0 };
    s.total += 1;
    if (a.is_correct) s.correct += 1;
    bySection.set(a.section_id, s);
  }

  const sectionIds = Array.from(bySection.keys());
  const { data: sections } = await supabase
    .from('resident_sections')
    .select('id, title')
    .in('id', sectionIds);

  const titleById = new Map<string, string>();
  for (const s of (sections ?? [])) titleById.set(s.id, s.title);

  let text = lang === 'uz' ? '📊 <b>Mening natijalarim</b>\n\n' : '📊 <b>Мои результаты</b>\n\n';
  let totalCorrect = 0;
  let totalCount = 0;
  for (const [sid, s] of bySection.entries()) {
    const name = titleById.get(sid) ?? '—';
    const pct = Math.round((s.correct / s.total) * 100);
    text += `📁 <b>${escapeHtml(name)}</b>\n   ${s.correct}/${s.total} (${pct}%)\n\n`;
    totalCorrect += s.correct;
    totalCount += s.total;
  }
  const pctAll = Math.round((totalCorrect / totalCount) * 100);
  text += lang === 'uz'
    ? `<b>Umumiy:</b> ${totalCorrect}/${totalCount} (${pctAll}%)`
    : `<b>Итого:</b> ${totalCorrect}/${totalCount} (${pctAll}%)`;

  await sendMessage(chatId, text, {}, lovableKey, telegramKey);
}

// ============= REZIDENT XABARLARNI ROUTING =============

export async function handleResidentMessage(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const lang = patient.language;
  if (text === (lang === 'uz' ? '📚 Bo\'limlar' : '📚 Разделы')) {
    await showSectionsForResident(supabase, patient, chatId, null, lovableKey, telegramKey);
    return true;
  }
  if (text === (lang === 'uz' ? '📊 Mening natijalarim' : '📊 Мои результаты')) {
    await showMyResults(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (text === (lang === 'uz' ? '🚪 Chiqish' : '🚪 Выход')) {
    await setState(supabase, patient.id, null, null);
    await sendMessage(
      chatId,
      lang === 'uz' ? '👋 Rezidenturadan chiqdingiz. /rezidentura — qaytib kirish.' : '👋 Вы вышли. /rezidentura — войти снова.',
      {},
      lovableKey,
      telegramKey,
    );
    return true;
  }
  return false;
}

export async function handleResidentCallback(
  supabase: any,
  patient: Patient,
  chatId: number,
  data: string,
  ack: (text?: string) => Promise<void>,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  if (data === 'res:nav:root') {
    await ack();
    await showSectionsForResident(supabase, patient, chatId, null, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('res:nav:')) {
    const id = data.slice('res:nav:'.length);
    await ack();
    await showSectionsForResident(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('res:tstart:')) {
    const sectionId = data.slice('res:tstart:'.length);
    await ack();
    await startTestForResident(supabase, patient, chatId, sectionId, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('res:tans:')) {
    await ack();
    await handleTestAnswer(supabase, patient, chatId, data.slice('res:tans:'.length), lovableKey, telegramKey);
    return true;
  }
  return false;
}

// ============================================================
// ============= ADMIN TOMONIDAN BOSHQARISH ===================
// ============================================================

export async function showAdminResidentMenu(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await setState(supabase, patient.id, 'admin:res:menu', null);
  const buttons: InlineKeyboard = [
    [{ text: lang === 'uz' ? '📚 Bo\'limlar' : '📚 Разделы', callback_data: 'ares:sec:root' }],
    [{ text: lang === 'uz' ? '👥 Rezidentlar' : '👥 Резиденты', callback_data: 'ares:resi:list' }],
    [{ text: lang === 'uz' ? '📊 Natijalar' : '📊 Результаты', callback_data: 'ares:stats' }],
  ];
  await sendMessage(
    chatId,
    lang === 'uz' ? '🎓 <b>Rezidentura — Admin</b>' : '🎓 <b>Резидентура — Админ</b>',
    { inlineKeyboard: buttons },
    lovableKey,
    telegramKey,
  );
}

async function showAdminSection(
  supabase: any,
  patient: Patient,
  chatId: number,
  sectionId: string | null, // null = root ko'rinish
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;

  let section: Section | null = null;
  if (sectionId) {
    const { data } = await supabase.from('resident_sections').select('*').eq('id', sectionId).maybeSingle();
    section = data as Section | null;
  }

  const query = supabase.from('resident_sections').select('*').order('sort_order').order('created_at');
  const { data: children } = section
    ? await query.eq('parent_id', section.id)
    : await query.is('parent_id', null);

  let header: string;
  if (section) {
    header = `📁 <b>${escapeHtml(section.title)}</b>`;
  } else {
    header = lang === 'uz' ? '📚 <b>Asosiy bo\'limlar</b>' : '📚 <b>Основные разделы</b>';
  }

  const buttons: InlineKeyboard = [];
  for (const c of (children ?? []) as Section[]) {
    buttons.push([{ text: `📁 ${c.title}`, callback_data: `ares:sec:${c.id}` }]);
  }

  // Bu bo'limga oid amallar
  buttons.push([{
    text: lang === 'uz' ? '➕ Ichki bo\'lim qo\'shish' : '➕ Добавить подраздел',
    callback_data: `ares:newsec:${section ? section.id : 'root'}`,
  }]);

  if (section) {
    // Media va test ro'yxati va qo'shish tugmalari
    const { data: mediaRows } = await supabase
      .from('resident_section_media')
      .select('id, media:media_library(file_type, caption)')
      .eq('section_id', section.id)
      .order('sort_order');
    const { data: tests } = await supabase
      .from('resident_tests')
      .select('id, question')
      .eq('section_id', section.id)
      .order('sort_order')
      .order('created_at');

    buttons.push([
      { text: lang === 'uz' ? '📎 Media qo\'shish' : '📎 Добавить медиа', callback_data: `ares:addmed:${section.id}` },
      { text: lang === 'uz' ? '📝 Test qo\'shish' : '📝 Добавить тест', callback_data: `ares:newt:${section.id}` },
    ]);

    if (mediaRows && mediaRows.length > 0) {
      header += lang === 'uz' ? `\n\n📎 Media: ${mediaRows.length} ta` : `\n\n📎 Медиа: ${mediaRows.length}`;
      for (const m of mediaRows.slice(0, 10)) {
        const ft = (m as any).media?.file_type ?? '?';
        buttons.push([{ text: `🗑 ${ft}`, callback_data: `ares:delmed:${m.id}:${section.id}` }]);
      }
    }
    if (tests && tests.length > 0) {
      header += lang === 'uz' ? `\n📝 Testlar: ${tests.length} ta` : `\n📝 Тесты: ${tests.length}`;
      for (const tst of tests.slice(0, 10)) {
        const q = tst.question.length > 40 ? tst.question.slice(0, 37) + '...' : tst.question;
        buttons.push([{ text: `🗑 ${q}`, callback_data: `ares:delt:${tst.id}:${section.id}` }]);
      }
    }

    buttons.push([
      { text: lang === 'uz' ? '✏️ Nomini o\'zgartirish' : '✏️ Изменить название', callback_data: `ares:rn:${section.id}` },
    ]);
    if (!section.is_root) {
      buttons.push([{ text: lang === 'uz' ? '🗑 Bo\'limni o\'chirish' : '🗑 Удалить раздел', callback_data: `ares:delsec:${section.id}` }]);
    }
    const backCb = section.parent_id ? `ares:sec:${section.parent_id}` : 'ares:sec:root';
    buttons.push([{ text: lang === 'uz' ? '⬅️ Orqaga' : '⬅️ Назад', callback_data: backCb }]);
  } else {
    buttons.push([{ text: lang === 'uz' ? '⬅️ Rezidentura menyu' : '⬅️ Меню резидентуры', callback_data: 'ares:home' }]);
  }

  await setState(supabase, patient.id, 'admin:res:sec', { sectionId: section?.id ?? null });
  await sendMessage(chatId, header, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

// ----- Rezidentlar ro'yxati -----

async function listResidents(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: residents } = await supabase
    .from('residents')
    .select('*')
    .order('created_at', { ascending: false });

  let text = lang === 'uz' ? '👥 <b>Rezidentlar</b>\n\n' : '👥 <b>Резиденты</b>\n\n';
  if (!residents || residents.length === 0) {
    text += lang === 'uz' ? 'Hali rezident qo\'shilmagan.' : 'Резиденты ещё не добавлены.';
  } else {
    for (const r of residents) {
      const status = r.is_active ? '🟢' : '⚪';
      text += `${status} <code>${r.telegram_id}</code>${r.full_name ? ' — ' + escapeHtml(r.full_name) : ''}\n`;
    }
  }

  const buttons: InlineKeyboard = [
    [{ text: lang === 'uz' ? '➕ Yangi rezident' : '➕ Новый резидент', callback_data: 'ares:resi:new' }],
  ];
  if (residents) {
    for (const r of residents.slice(0, 20)) {
      buttons.push([{
        text: `🗑 ${r.telegram_id}${r.full_name ? ' — ' + r.full_name.slice(0, 20) : ''}`,
        callback_data: `ares:resi:del:${r.id}`,
      }]);
    }
  }
  buttons.push([{ text: lang === 'uz' ? '⬅️ Rezidentura menyu' : '⬅️ Меню', callback_data: 'ares:home' }]);

  await setState(supabase, patient.id, 'admin:res:resi', null);
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

async function startNewResident(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await setState(supabase, patient.id, 'admin:res:resi:tg', {});
  await sendMessage(
    chatId,
    lang === 'uz'
      ? '👤 Yangi rezidentning <b>Telegram ID</b> sini kiriting (raqam):\n\n/cancel — bekor qilish'
      : '👤 Введите <b>Telegram ID</b> нового резидента (число):\n\n/cancel — отмена',
    {},
    lovableKey,
    telegramKey,
  );
}

// ----- Statistika (admin) -----

async function showAdminStats(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: residents } = await supabase
    .from('residents')
    .select('id, telegram_id, full_name')
    .eq('is_active', true);

  if (!residents || residents.length === 0) {
    await sendMessage(
      chatId,
      lang === 'uz' ? '📊 Hozircha rezident yo\'q.' : '📊 Резидентов пока нет.',
      {},
      lovableKey,
      telegramKey,
    );
    return;
  }

  const ids = residents.map((r: any) => r.id);
  const { data: attempts } = await supabase
    .from('resident_test_attempts')
    .select('resident_id, is_correct')
    .in('resident_id', ids);

  const stats = new Map<string, { correct: number; total: number }>();
  for (const a of (attempts ?? [])) {
    const s = stats.get(a.resident_id) ?? { correct: 0, total: 0 };
    s.total += 1;
    if (a.is_correct) s.correct += 1;
    stats.set(a.resident_id, s);
  }

  let text = lang === 'uz' ? '📊 <b>Rezidentlar natijasi</b>\n\n' : '📊 <b>Результаты резидентов</b>\n\n';
  for (const r of residents) {
    const s = stats.get(r.id) ?? { correct: 0, total: 0 };
    const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    const name = r.full_name ?? `ID ${r.telegram_id}`;
    text += `👤 <b>${escapeHtml(name)}</b>\n   ${s.correct}/${s.total} (${pct}%)\n\n`;
  }

  await sendMessage(
    chatId,
    text,
    { inlineKeyboard: [[{ text: lang === 'uz' ? '⬅️ Orqaga' : '⬅️ Назад', callback_data: 'ares:home' }]] },
    lovableKey,
    telegramKey,
  );
}

// ============= ADMIN MESSAGE/STATE ROUTER =============

export async function handleAdminResidentMessage(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const state = patient.state ?? '';
  const lang = patient.language;
  const sd = (patient.state_data as any) ?? {};

  if (state === 'admin:res:rename') {
    const sectionId = sd.sectionId as string;
    const newTitle = text.trim().slice(0, 200);
    if (!newTitle) return true;
    await supabase.from('resident_sections').update({ title: newTitle }).eq('id', sectionId);
    await sendMessage(chatId, lang === 'uz' ? '✅ Saqlandi.' : '✅ Сохранено.', {}, lovableKey, telegramKey);
    await showAdminSection(supabase, patient, chatId, sectionId, lovableKey, telegramKey);
    return true;
  }

  if (state === 'admin:res:newsec') {
    const parentId = (sd.parentId as string | null) ?? null;
    const title = text.trim().slice(0, 200);
    if (!title) return true;
    const { data: created } = await supabase
      .from('resident_sections')
      .insert({ parent_id: parentId, title, is_root: false })
      .select('id')
      .single();
    await sendMessage(chatId, lang === 'uz' ? '✅ Bo\'lim qo\'shildi.' : '✅ Раздел добавлен.', {}, lovableKey, telegramKey);
    await showAdminSection(supabase, patient, chatId, created?.id ?? parentId, lovableKey, telegramKey);
    return true;
  }

  if (state === 'admin:res:newt:q') {
    const sectionId = sd.sectionId as string;
    const question = text.trim().slice(0, 1000);
    if (!question) return true;
    await setState(supabase, patient.id, 'admin:res:newt:opts', { sectionId, question });
    await sendMessage(
      chatId,
      lang === 'uz'
        ? '📝 Endi variantlarni yuboring.\n\nHar bir qatorga 1 ta variant.\nTo\'g\'ri javobni <code>*</code> bilan boshlang.\n\nMisol:\n<code>*Karies\nGingivit\nPulpit\nPeriodontit</code>'
        : '📝 Теперь отправьте варианты.\n\nКаждый вариант на новой строке.\nПравильный ответ начните с <code>*</code>.\n\nПример:\n<code>*Кариес\nГингивит\nПульпит\nПериодонтит</code>',
      {},
      lovableKey,
      telegramKey,
    );
    return true;
  }

  if (state === 'admin:res:newt:opts') {
    const sectionId = sd.sectionId as string;
    const question = sd.question as string;
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) {
      await sendMessage(
        chatId,
        lang === 'uz' ? '⚠️ Kamida 2 ta variant kerak.' : '⚠️ Нужно минимум 2 варианта.',
        {},
        lovableKey,
        telegramKey,
      );
      return true;
    }
    const options: TestOption[] = lines.map((l) => {
      if (l.startsWith('*')) return { text: l.slice(1).trim(), is_correct: true };
      return { text: l, is_correct: false };
    });
    if (!options.some((o) => o.is_correct)) {
      await sendMessage(
        chatId,
        lang === 'uz' ? '⚠️ Kamida bitta to\'g\'ri javob (* bilan) kerak.' : '⚠️ Нужен хотя бы один правильный ответ (с *).',
        {},
        lovableKey,
        telegramKey,
      );
      return true;
    }
    await supabase.from('resident_tests').insert({
      section_id: sectionId,
      question,
      options,
    });
    await sendMessage(chatId, lang === 'uz' ? '✅ Test qo\'shildi.' : '✅ Тест добавлен.', {}, lovableKey, telegramKey);
    await showAdminSection(supabase, patient, chatId, sectionId, lovableKey, telegramKey);
    return true;
  }

  if (state === 'admin:res:resi:tg') {
    const id = Number(text.trim());
    if (!id || isNaN(id)) {
      await sendMessage(
        chatId,
        lang === 'uz' ? '⚠️ Telegram ID raqam bo\'lishi kerak.' : '⚠️ Telegram ID должен быть числом.',
        {},
        lovableKey,
        telegramKey,
      );
      return true;
    }
    await setState(supabase, patient.id, 'admin:res:resi:name', { telegram_id: id });
    await sendMessage(
      chatId,
      lang === 'uz' ? '👤 Rezidentning ism-familiyasi (yoki "—" — o\'tkazib yuborish):' : '👤 ФИО резидента (или "—" — пропустить):',
      {},
      lovableKey,
      telegramKey,
    );
    return true;
  }

  if (state === 'admin:res:resi:name') {
    const tgId = sd.telegram_id as number;
    const skip = text.trim() === '—' || text.trim() === '-';
    const fullName = skip ? null : text.trim().slice(0, 200);
    const { error } = await supabase.from('residents').upsert({
      telegram_id: tgId,
      full_name: fullName,
      is_active: true,
    }, { onConflict: 'telegram_id' });
    if (error) {
      await sendMessage(chatId, `⚠️ ${error.message}`, {}, lovableKey, telegramKey);
    } else {
      await sendMessage(
        chatId,
        lang === 'uz' ? '✅ Rezident qo\'shildi.' : '✅ Резидент добавлен.',
        {},
        lovableKey,
        telegramKey,
      );
    }
    await listResidents(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }

  return false;
}

// Admin rezidenturada media yuklamoqda (state: admin:res:addmed)
export async function handleAdminResidentMediaUpload(
  supabase: any,
  patient: Patient,
  admin: Admin,
  chatId: number,
  msg: any,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const state = patient.state ?? '';
  if (state !== 'admin:res:addmed') return false;
  const sd = (patient.state_data as any) ?? {};
  const sectionId = sd.sectionId as string;
  if (!sectionId) return false;

  const saved = await saveAdminMedia(supabase, admin, msg);
  if (!saved) return false;

  // Eng katta sort_order ni topib +1 qilish
  const { data: maxRow } = await supabase
    .from('resident_section_media')
    .select('sort_order')
    .eq('section_id', sectionId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  await supabase.from('resident_section_media').insert({
    section_id: sectionId,
    media_id: saved.id,
    sort_order: nextOrder,
  });

  const lang = patient.language;
  await sendMessage(
    chatId,
    lang === 'uz'
      ? '✅ Media bo\'limga biriktirildi. Yana yuborishingiz mumkin yoki "Tayyor"ni bosing.'
      : '✅ Медиа прикреплено. Можете отправить ещё или нажать "Готово".',
    {
      inlineKeyboard: [[{
        text: lang === 'uz' ? '✅ Tayyor' : '✅ Готово',
        callback_data: `ares:sec:${sectionId}`,
      }]],
    },
    lovableKey,
    telegramKey,
  );
  return true;
}

// ============= ADMIN CALLBACK ROUTER =============

export async function handleAdminResidentCallback(
  supabase: any,
  patient: Patient,
  chatId: number,
  data: string,
  ack: (text?: string) => Promise<void>,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  if (data === 'ares:home') {
    await ack();
    await showAdminResidentMenu(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }

  if (data === 'ares:sec:root') {
    await ack();
    await showAdminSection(supabase, patient, chatId, null, lovableKey, telegramKey);
    return true;
  }

  if (data.startsWith('ares:sec:')) {
    const id = data.slice('ares:sec:'.length);
    await ack();
    await showAdminSection(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }

  if (data.startsWith('ares:newsec:')) {
    const parent = data.slice('ares:newsec:'.length);
    const parentId = parent === 'root' ? null : parent;
    await setState(supabase, patient.id, 'admin:res:newsec', { parentId });
    await ack();
    const lang = patient.language;
    await sendMessage(
      chatId,
      lang === 'uz' ? '📁 Yangi bo\'lim nomini kiriting:\n\n/cancel — bekor qilish' : '📁 Введите название нового раздела:\n\n/cancel — отмена',
      {},
      lovableKey,
      telegramKey,
    );
    return true;
  }

  if (data.startsWith('ares:rn:')) {
    const sectionId = data.slice('ares:rn:'.length);
    await setState(supabase, patient.id, 'admin:res:rename', { sectionId });
    await ack();
    const lang = patient.language;
    await sendMessage(
      chatId,
      lang === 'uz' ? '✏️ Yangi nom kiriting:\n\n/cancel — bekor qilish' : '✏️ Введите новое название:\n\n/cancel — отмена',
      {},
      lovableKey,
      telegramKey,
    );
    return true;
  }

  if (data.startsWith('ares:delsec:')) {
    const sectionId = data.slice('ares:delsec:'.length);
    const { data: sec } = await supabase.from('resident_sections').select('parent_id, is_root').eq('id', sectionId).maybeSingle();
    if (sec?.is_root) {
      await ack('⚠️');
      return true;
    }
    await supabase.from('resident_sections').delete().eq('id', sectionId);
    await ack('🗑');
    await showAdminSection(supabase, patient, chatId, sec?.parent_id ?? null, lovableKey, telegramKey);
    return true;
  }

  if (data.startsWith('ares:addmed:')) {
    const sectionId = data.slice('ares:addmed:'.length);
    await setState(supabase, patient.id, 'admin:res:addmed', { sectionId });
    await ack();
    const lang = patient.language;
    await sendMessage(
      chatId,
      lang === 'uz'
        ? '📎 Endi rasm/video/fayl yuboring. Bir nechta yuborishingiz mumkin.\n\n/cancel — to\'xtatish'
        : '📎 Отправьте фото/видео/файл. Можно несколько.\n\n/cancel — остановить',
      {},
      lovableKey,
      telegramKey,
    );
    return true;
  }

  if (data.startsWith('ares:delmed:')) {
    const rest = data.slice('ares:delmed:'.length);
    const [mediaRowId, sectionId] = rest.split(':');
    await supabase.from('resident_section_media').delete().eq('id', mediaRowId);
    await ack('🗑');
    await showAdminSection(supabase, patient, chatId, sectionId, lovableKey, telegramKey);
    return true;
  }

  if (data.startsWith('ares:newt:')) {
    const sectionId = data.slice('ares:newt:'.length);
    await setState(supabase, patient.id, 'admin:res:newt:q', { sectionId });
    await ack();
    const lang = patient.language;
    await sendMessage(
      chatId,
      lang === 'uz' ? '📝 Test savolini kiriting:\n\n/cancel — bekor' : '📝 Введите вопрос теста:\n\n/cancel — отмена',
      {},
      lovableKey,
      telegramKey,
    );
    return true;
  }

  if (data.startsWith('ares:delt:')) {
    const rest = data.slice('ares:delt:'.length);
    const [testId, sectionId] = rest.split(':');
    await supabase.from('resident_tests').delete().eq('id', testId);
    await ack('🗑');
    await showAdminSection(supabase, patient, chatId, sectionId, lovableKey, telegramKey);
    return true;
  }

  if (data === 'ares:resi:list') {
    await ack();
    await listResidents(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }

  if (data === 'ares:resi:new') {
    await ack();
    await startNewResident(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }

  if (data.startsWith('ares:resi:del:')) {
    const id = data.slice('ares:resi:del:'.length);
    await supabase.from('residents').delete().eq('id', id);
    await ack('🗑');
    await listResidents(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }

  if (data === 'ares:stats') {
    await ack();
    await showAdminStats(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }

  return false;
}
