// Bot xabarlarini qayta ishlash
import { sendMessage, answerCallbackQuery, escapeHtml, type ReplyKeyboard } from './telegram-api.ts';
import { t, tr, type Lang } from './i18n.ts';

type Patient = {
  id: string;
  telegram_id: number;
  language: Lang;
  state: string | null;
  state_data: Record<string, unknown> | null;
};

function mainKeyboard(lang: Lang): ReplyKeyboard {
  return [
    [{ text: t.menu.about[lang] }, { text: t.menu.services[lang] }],
    [{ text: t.menu.doctors[lang] }, { text: t.menu.address[lang] }],
    [{ text: t.menu.medicalCard[lang] }, { text: t.menu.contact[lang] }],
    [{ text: t.menu.complaint[lang] }, { text: t.menu.changeLang[lang] }],
  ];
}

async function getOrCreatePatient(
  supabase: any,
  tgUser: { id: number; username?: string; first_name?: string; last_name?: string },
): Promise<Patient> {
  const { data: existing } = await supabase
    .from('patients')
    .select('*')
    .eq('telegram_id', tgUser.id)
    .maybeSingle();

  if (existing) return existing as Patient;

  const { data: created, error } = await supabase
    .from('patients')
    .insert({
      telegram_id: tgUser.id,
      telegram_username: tgUser.username ?? null,
      first_name: tgUser.first_name ?? null,
      last_name: tgUser.last_name ?? null,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Patient create failed: ${error.message}`);
  return created as Patient;
}

async function setState(supabase: any, patientId: string, state: string | null, stateData: any = null) {
  await supabase
    .from('patients')
    .update({ state, state_data: stateData })
    .eq('id', patientId);
}

async function setLanguage(supabase: any, patientId: string, lang: Lang) {
  await supabase.from('patients').update({ language: lang }).eq('id', patientId);
}

async function showMainMenu(
  chatId: number,
  lang: Lang,
  lovableKey: string,
  telegramKey: string,
) {
  await sendMessage(
    chatId,
    t.welcome[lang],
    { replyKeyboard: mainKeyboard(lang) },
    lovableKey,
    telegramKey,
  );
}

async function showLanguagePicker(chatId: number, lovableKey: string, telegramKey: string) {
  await sendMessage(
    chatId,
    t.chooseLanguage.uz,
    {
      inlineKeyboard: [[
        { text: '🇺🇿 O\'zbekcha', callback_data: 'lang:uz' },
        { text: '🇷🇺 Русский', callback_data: 'lang:ru' },
      ]],
    },
    lovableKey,
    telegramKey,
  );
}

async function showAbout(supabase: any, chatId: number, lang: Lang, lovableKey: string, telegramKey: string) {
  const { data } = await supabase.from('clinic_info').select('*').eq('id', 1).single();
  const name = lang === 'uz' ? data.name_uz : data.name_ru;
  const about = lang === 'uz' ? data.about_uz : data.about_ru;
  const hours = lang === 'uz' ? data.working_hours_uz : data.working_hours_ru;

  const text = `<b>${escapeHtml(name)}</b>\n\n${escapeHtml(about)}\n\n🕐 ${escapeHtml(hours)}\n📞 ${escapeHtml(data.phone)}`;
  await sendMessage(chatId, text, {}, lovableKey, telegramKey);
}

async function showServices(supabase: any, chatId: number, lang: Lang, lovableKey: string, telegramKey: string) {
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (!data || data.length === 0) {
    await sendMessage(chatId, t.noServices[lang], {}, lovableKey, telegramKey);
    return;
  }

  let text = t.servicesTitle[lang];
  for (const s of data) {
    const name = lang === 'uz' ? s.name_uz : s.name_ru;
    const desc = lang === 'uz' ? s.description_uz : s.description_ru;
    text += `\n🔹 <b>${escapeHtml(name)}</b>\n`;
    if (desc) text += `${escapeHtml(desc)}\n`;
    if (s.price_from) {
      const priceText = s.price_to
        ? `${s.price_from.toLocaleString()} - ${s.price_to.toLocaleString()}`
        : `${s.price_from.toLocaleString()}+`;
      text += `💰 ${priceText} ${t.sum[lang]}\n`;
    }
  }

  await sendMessage(chatId, text, {}, lovableKey, telegramKey);
}

async function showDoctors(supabase: any, chatId: number, lang: Lang, lovableKey: string, telegramKey: string) {
  const { data } = await supabase
    .from('doctors')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (!data || data.length === 0) {
    await sendMessage(chatId, t.noDoctors[lang], {}, lovableKey, telegramKey);
    return;
  }

  let text = t.doctorsTitle[lang];
  for (const d of data) {
    const spec = lang === 'uz' ? d.specialty_uz : d.specialty_ru;
    const bio = lang === 'uz' ? d.bio_uz : d.bio_ru;
    text += `\n👨‍⚕️ <b>${escapeHtml(d.full_name)}</b>\n${escapeHtml(spec)}\n`;
    if (d.experience_years) text += `📅 ${d.experience_years} ${t.yearsExperience[lang]}\n`;
    if (bio) text += `${escapeHtml(bio)}\n`;
  }

  await sendMessage(chatId, text, {}, lovableKey, telegramKey);
}

async function showAddress(supabase: any, chatId: number, lang: Lang, lovableKey: string, telegramKey: string) {
  const { data } = await supabase.from('clinic_info').select('*').eq('id', 1).single();
  const addr = lang === 'uz' ? data.address_uz : data.address_ru;
  let text = `📍 <b>${escapeHtml(addr)}</b>\n📞 ${escapeHtml(data.phone)}`;
  if (data.location_url) text += `\n\n🗺 ${data.location_url}`;
  await sendMessage(chatId, text, {}, lovableKey, telegramKey);
}

async function showContact(supabase: any, chatId: number, lang: Lang, lovableKey: string, telegramKey: string) {
  const { data } = await supabase.from('clinic_info').select('*').eq('id', 1).single();
  let text = t.contactInfo[lang] + escapeHtml(data.phone);
  if (data.instagram) text += `\n📷 Instagram: ${data.instagram}`;
  if (data.telegram_channel) text += `\n💬 Telegram: ${data.telegram_channel}`;
  await sendMessage(chatId, text, {}, lovableKey, telegramKey);
}

async function showOrStartMedicalCard(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: card } = await supabase
    .from('medical_cards')
    .select('*')
    .eq('patient_id', patient.id)
    .maybeSingle();

  if (card && card.full_name) {
    let text = t.mcExisting[lang];
    text += `<b>${lang === 'uz' ? 'Ism' : 'Имя'}:</b> ${escapeHtml(card.full_name)}\n`;
    if (card.birth_date) text += `<b>${lang === 'uz' ? 'Tug\'ilgan sana' : 'Дата рождения'}:</b> ${card.birth_date}\n`;
    if (card.gender) text += `<b>${lang === 'uz' ? 'Jinsi' : 'Пол'}:</b> ${escapeHtml(card.gender)}\n`;
    if (card.address) text += `<b>${lang === 'uz' ? 'Manzil' : 'Адрес'}:</b> ${escapeHtml(card.address)}\n`;
    if (card.allergies) text += `<b>${lang === 'uz' ? 'Allergiya' : 'Аллергии'}:</b> ${escapeHtml(card.allergies)}\n`;
    if (card.chronic_diseases) text += `<b>${lang === 'uz' ? 'Surunkali kasalliklar' : 'Хронические заболевания'}:</b> ${escapeHtml(card.chronic_diseases)}\n`;
    if (card.current_medications) text += `<b>${lang === 'uz' ? 'Dorilar' : 'Лекарства'}:</b> ${escapeHtml(card.current_medications)}\n`;
    if (card.previous_treatments) text += `<b>${lang === 'uz' ? 'Avvalgi davolanishlar' : 'Предыдущие лечения'}:</b> ${escapeHtml(card.previous_treatments)}\n`;

    await sendMessage(chatId, text, {
      inlineKeyboard: [[{ text: t.mcUpdate[lang], callback_data: 'mc:update' }]],
    }, lovableKey, telegramKey);
  } else {
    await setState(supabase, patient.id, 'mc:full_name', {});
    await sendMessage(chatId, t.mcStart[lang], { removeKeyboard: true }, lovableKey, telegramKey);
  }
}

async function handleMedicalCardStep(
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

  if (state === 'mc:full_name') {
    data.full_name = text;
    await setState(supabase, patient.id, 'mc:birth_date', data);
    await sendMessage(chatId, t.mcAskBirth[lang], {}, lovableKey, telegramKey);
  } else if (state === 'mc:birth_date') {
    data.birth_date = text;
    await setState(supabase, patient.id, 'mc:gender', data);
    await sendMessage(chatId, t.mcAskGender[lang], {}, lovableKey, telegramKey);
  } else if (state === 'mc:gender') {
    data.gender = text;
    await setState(supabase, patient.id, 'mc:phone', data);
    await sendMessage(chatId, t.mcAskPhone[lang], {}, lovableKey, telegramKey);
  } else if (state === 'mc:phone') {
    data.phone = text;
    await supabase.from('patients').update({ phone: text }).eq('id', patient.id);
    await setState(supabase, patient.id, 'mc:address', data);
    await sendMessage(chatId, t.mcAskAddress[lang], {}, lovableKey, telegramKey);
  } else if (state === 'mc:address') {
    data.address = text;
    await setState(supabase, patient.id, 'mc:allergies', data);
    await sendMessage(chatId, t.mcAskAllergies[lang], {}, lovableKey, telegramKey);
  } else if (state === 'mc:allergies') {
    data.allergies = text;
    await setState(supabase, patient.id, 'mc:chronic', data);
    await sendMessage(chatId, t.mcAskChronic[lang], {}, lovableKey, telegramKey);
  } else if (state === 'mc:chronic') {
    data.chronic_diseases = text;
    await setState(supabase, patient.id, 'mc:meds', data);
    await sendMessage(chatId, t.mcAskMeds[lang], {}, lovableKey, telegramKey);
  } else if (state === 'mc:meds') {
    data.current_medications = text;
    await setState(supabase, patient.id, 'mc:prev', data);
    await sendMessage(chatId, t.mcAskPrev[lang], {}, lovableKey, telegramKey);
  } else if (state === 'mc:prev') {
    data.previous_treatments = text;

    // Saqlash (upsert)
    const { data: existing } = await supabase
      .from('medical_cards')
      .select('id')
      .eq('patient_id', patient.id)
      .maybeSingle();

    const payload = {
      patient_id: patient.id,
      full_name: data.full_name,
      birth_date: parseBirthDate(data.birth_date),
      gender: data.gender,
      address: data.address,
      allergies: data.allergies,
      chronic_diseases: data.chronic_diseases,
      current_medications: data.current_medications,
      previous_treatments: data.previous_treatments,
    };

    if (existing) {
      await supabase.from('medical_cards').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('medical_cards').insert(payload);
    }

    await setState(supabase, patient.id, null, null);
    await sendMessage(chatId, t.mcSaved[lang], { replyKeyboard: mainKeyboard(lang) }, lovableKey, telegramKey);
  }
}

function parseBirthDate(s: string): string | null {
  // 15.03.1990 -> 1990-03-15
  const m = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

async function handleComplaintStep(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await supabase.from('complaints').insert({
    patient_id: patient.id,
    type: 'complaint',
    message: text,
  });
  await setState(supabase, patient.id, null, null);
  await sendMessage(chatId, t.complaintSaved[lang], { replyKeyboard: mainKeyboard(lang) }, lovableKey, telegramKey);
}

export async function handleUpdate(
  update: any,
  supabase: any,
  lovableKey: string,
  telegramKey: string,
) {
  // Callback (inline tugmalar)
  if (update.callback_query) {
    const cq = update.callback_query;
    const data: string = cq.data ?? '';
    const chatId = cq.message?.chat?.id;
    if (!chatId) return;

    const patient = await getOrCreatePatient(supabase, cq.from);

    if (data.startsWith('lang:')) {
      const lang = data.split(':')[1] as Lang;
      await setLanguage(supabase, patient.id, lang);
      await answerCallbackQuery(cq.id, undefined, lovableKey, telegramKey);
      await showMainMenu(chatId, lang, lovableKey, telegramKey);
      return;
    }

    if (data === 'mc:update') {
      await answerCallbackQuery(cq.id, undefined, lovableKey, telegramKey);
      await setState(supabase, patient.id, 'mc:full_name', {});
      await sendMessage(chatId, t.mcStart[patient.language], { removeKeyboard: true }, lovableKey, telegramKey);
      return;
    }

    await answerCallbackQuery(cq.id, undefined, lovableKey, telegramKey);
    return;
  }

  // Oddiy xabar
  if (!update.message) return;
  const msg = update.message;
  const chatId = msg.chat.id;
  const text: string = msg.text ?? '';
  if (!msg.from) return;

  const patient = await getOrCreatePatient(supabase, msg.from);
  const lang = patient.language;

  // /start
  if (text === '/start') {
    await setState(supabase, patient.id, null, null);
    // Til tanlanmaganmi tekshirish — yangi yoki avvalgisi
    if (!patient.state && (patient.language === 'uz' || patient.language === 'ru')) {
      // Birinchi marta — har doim til tanlash
      const { count } = await supabase
        .from('telegram_messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId);
      if ((count ?? 0) <= 1) {
        await showLanguagePicker(chatId, lovableKey, telegramKey);
        return;
      }
    }
    await showMainMenu(chatId, lang, lovableKey, telegramKey);
    return;
  }

  // /cancel
  if (text === '/cancel') {
    await setState(supabase, patient.id, null, null);
    await sendMessage(chatId, t.cancelled[lang], { replyKeyboard: mainKeyboard(lang) }, lovableKey, telegramKey);
    return;
  }

  // State'da turgan bo'lsa
  if (patient.state?.startsWith('mc:')) {
    await handleMedicalCardStep(supabase, patient, chatId, text, lovableKey, telegramKey);
    return;
  }
  if (patient.state === 'complaint:wait') {
    await handleComplaintStep(supabase, patient, chatId, text, lovableKey, telegramKey);
    return;
  }

  // Menyu tugmalarini aniqlash (uz va ru)
  const matches = (key: keyof typeof t.menu) =>
    text === t.menu[key].uz || text === t.menu[key].ru;

  if (matches('about')) {
    await showAbout(supabase, chatId, lang, lovableKey, telegramKey);
  } else if (matches('services')) {
    await showServices(supabase, chatId, lang, lovableKey, telegramKey);
  } else if (matches('doctors')) {
    await showDoctors(supabase, chatId, lang, lovableKey, telegramKey);
  } else if (matches('address')) {
    await showAddress(supabase, chatId, lang, lovableKey, telegramKey);
  } else if (matches('contact')) {
    await showContact(supabase, chatId, lang, lovableKey, telegramKey);
  } else if (matches('medicalCard')) {
    await showOrStartMedicalCard(supabase, patient, chatId, lovableKey, telegramKey);
  } else if (matches('complaint')) {
    await setState(supabase, patient.id, 'complaint:wait', {});
    await sendMessage(chatId, t.complaintAsk[lang], { removeKeyboard: true }, lovableKey, telegramKey);
  } else if (matches('changeLang')) {
    await showLanguagePicker(chatId, lovableKey, telegramKey);
  } else {
    await sendMessage(chatId, t.unknownCommand[lang], { replyKeyboard: mainKeyboard(lang) }, lovableKey, telegramKey);
  }
}
