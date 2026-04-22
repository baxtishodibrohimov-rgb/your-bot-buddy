// Bot xabarlarini qayta ishlash
import { sendMessage, answerCallbackQuery, escapeHtml, type ReplyKeyboard, type InlineKeyboard } from './telegram-api.ts';
import { t, tr, type Lang } from './i18n.ts';
import { handleAdminMessage, handleAdminCallback, isAdmin } from './admin-handler.ts';
import { handleAdminMediaUpload, sendEntityMediaToUser } from './media-handler.ts';
import { saveAdminMedia } from './media-handler.ts';
import { bcAddMedia } from './admin-handler.ts';
import { notifyAdminsAboutComplaint } from './notifications.ts';
import {
  isResident,
  showResidentHome,
  handleResidentMessage,
  handleResidentCallback,
  handleAdminResidentMediaUpload,
} from './resident-handler.ts';
import {
  isLabWorker,
  handleLaboratoryCommand,
  handleLabPortalMessage,
  handleLabCallback,
  handleLabRejectReason,
  handleCoordLabStep,
  handleCoordLabCallback,
  handleCoordLabMedia,
} from './lab-handler.ts';

type Patient = {
  id: string;
  telegram_id: number;
  language: Lang;
  state: string | null;
  state_data: Record<string, unknown> | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  telegram_username?: string | null;
};

function mainKeyboard(lang: Lang): ReplyKeyboard {
  return [
    [{ text: t.menu.services[lang] }, { text: t.menu.doctors[lang] }],
    [{ text: t.menu.address[lang] }, { text: t.menu.contact[lang] }],
    [{ text: t.menu.complaint[lang] }],
    [{ text: t.menu.changeLang[lang] }],
  ];
}

// Ro'yxatdan o'tganmi tekshirish: ism va telefon bo'lsa — ro'yxatda
function isRegistered(p: Patient): boolean {
  return Boolean(p.first_name && p.first_name.trim().length > 0 && p.phone && p.phone.trim().length > 0);
}

async function showRegisterPrompt(chatId: number, lang: Lang, lovableKey: string, telegramKey: string) {
  await sendMessage(
    chatId,
    t.registerPrompt[lang],
    {
      inlineKeyboard: [[{ text: t.registerBtn[lang], callback_data: 'reg:start' }]],
    },
    lovableKey,
    telegramKey,
  );
}

async function startRegistration(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await setState(supabase, patient.id, 'reg:name', {});
  await sendMessage(chatId, t.registerAskName[lang], { removeKeyboard: true }, lovableKey, telegramKey);
}

async function handleRegistrationStep(
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

  if (state === 'reg:name') {
    const name = text.trim();
    if (name.length < 2 || name.length > 200) {
      await sendMessage(chatId, t.registerInvalidName[lang], {}, lovableKey, telegramKey);
      return;
    }
    // Ism va familiyani ajratamiz (oxirgi so'z — familiya)
    const parts = name.split(/\s+/);
    const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : name;
    const lastName = parts.length > 1 ? parts[parts.length - 1] : null;
    data.first_name = firstName;
    data.last_name = lastName;
    await setState(supabase, patient.id, 'reg:phone', data);
    await sendMessage(chatId, t.registerAskPhone[lang], {}, lovableKey, telegramKey);
    return;
  }

  if (state === 'reg:phone') {
    const phone = normalizePhone(text);
    if (!phone) {
      await sendMessage(chatId, t.registerInvalidPhone[lang], {}, lovableKey, telegramKey);
      return;
    }
    // Bemorni yangilaymiz
    await supabase
      .from('patients')
      .update({
        first_name: data.first_name ?? null,
        last_name: data.last_name ?? null,
        phone,
      })
      .eq('id', patient.id);
    await setState(supabase, patient.id, null, null);
    await sendMessage(
      chatId,
      t.registerDone[lang],
      { replyKeyboard: mainKeyboard(lang) },
      lovableKey,
      telegramKey,
    );
  }
}

// Telefon raqamini tozalash va validatsiya
// Qabul qiladi: +998901234567, 998901234567, 90 123 45 67 va h.k.
function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 15) return null;
  if (digits.length === 9 && digits.startsWith('9')) return '+998' + digits;
  if (digits.length === 12 && digits.startsWith('998')) return '+' + digits;
  return '+' + digits;
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

  await sendMessage(chatId, t.servicesTitle[lang], {}, lovableKey, telegramKey);
  for (const s of data) {
    const name = lang === 'uz' ? s.name_uz : s.name_ru;
    const desc = lang === 'uz' ? s.description_uz : s.description_ru;
    let text = `🔹 <b>${escapeHtml(name)}</b>\n`;
    if (desc) text += `${escapeHtml(desc)}\n`;
    if (s.price_from) {
      const priceText = s.price_to
        ? `${s.price_from.toLocaleString()} - ${s.price_to.toLocaleString()}`
        : `${s.price_from.toLocaleString()}+`;
      text += `💰 ${priceText} ${t.sum[lang]}\n`;
    }
    await sendMessage(chatId, text, {}, lovableKey, telegramKey);
    await sendEntityMediaToUser(supabase, chatId, 'service', s.id, lovableKey, telegramKey);
  }
}

async function showDoctors(supabase: any, chatId: number, lang: Lang, lovableKey: string, telegramKey: string) {
  const { data } = await supabase
    .from('staff')
    .select('*')
    .eq('is_active', true)
    .eq('position', 'shifokor')
    .order('sort_order');

  if (!data || data.length === 0) {
    await sendMessage(chatId, t.noDoctors[lang], {}, lovableKey, telegramKey);
    return;
  }

  await sendMessage(chatId, t.doctorsTitle[lang], {}, lovableKey, telegramKey);
  for (const d of data) {
    const spec = lang === 'uz' ? (d.specialty_uz ?? '') : (d.specialty_ru ?? '');
    const bio = lang === 'uz' ? d.bio_uz : d.bio_ru;
    let text = `👨‍⚕️ <b>${escapeHtml(d.full_name)}</b>\n${escapeHtml(spec)}\n`;
    if (d.experience_years) text += `📅 ${d.experience_years} ${t.yearsExperience[lang]}\n`;
    if (bio) text += `${escapeHtml(bio)}\n`;
    await sendMessage(chatId, text, {}, lovableKey, telegramKey);
    await sendEntityMediaToUser(supabase, chatId, 'staff', d.id, lovableKey, telegramKey);
  }
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
    const fields: Array<keyof typeof t.mcFields> = [
      'full_name', 'birth_date', 'gender', 'address',
      'allergies', 'chronic_diseases', 'current_medications', 'previous_treatments',
    ];
    for (const f of fields) {
      const label = t.mcFields[f][lang];
      const val = (card as any)[f];
      if (val) text += `<b>${escapeHtml(label)}:</b> ${escapeHtml(String(val))}\n`;
    }

    // Inline tugmalar — har bir maydonni alohida tahrirlash
    const buttons: InlineKeyboard = [];
    for (let i = 0; i < fields.length; i += 2) {
      const row = [
        { text: '✏️ ' + t.mcFields[fields[i]][lang], callback_data: `mc:edit:${fields[i]}` },
      ];
      if (i + 1 < fields.length) {
        row.push({ text: '✏️ ' + t.mcFields[fields[i + 1]][lang], callback_data: `mc:edit:${fields[i + 1]}` });
      }
      buttons.push(row);
    }
    buttons.push([{ text: t.mcRedoAll[lang], callback_data: 'mc:update' }]);

    await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
  } else {
    await setState(supabase, patient.id, 'mc:full_name', {});
    await sendMessage(chatId, t.mcStart[lang], { removeKeyboard: true }, lovableKey, telegramKey);
  }
}

// Bitta tibbiy karta maydonini tahrirlash
async function startMcEdit(
  supabase: any,
  patient: Patient,
  chatId: number,
  field: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const label = (t.mcFields as any)[field]?.[lang] ?? field;
  await setState(supabase, patient.id, 'mc:edit', { field });
  await sendMessage(
    chatId,
    `<b>${escapeHtml(label)}</b>\n\n${t.mcEnterNew[lang]}\n\n/cancel — ${t.cancel[lang]}`,
    { removeKeyboard: true },
    lovableKey,
    telegramKey,
  );
}

async function saveMcEdit(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const data = (patient.state_data as any) ?? {};
  const field = data.field as string;
  if (!field) return;

  let value: string | null = text.trim();
  if (field === 'birth_date') {
    const parsed = parseBirthDate(text);
    if (!parsed) {
      await sendMessage(
        chatId,
        lang === 'uz'
          ? '⚠️ Sana noto\'g\'ri. Format: <code>kun.oy.yil</code> (masalan: 15.03.1990)'
          : '⚠️ Неверная дата. Формат: <code>день.месяц.год</code> (например: 15.03.1990)',
        {},
        lovableKey,
        telegramKey,
      );
      return;
    }
    value = parsed;
  }

  const { data: existing } = await supabase
    .from('medical_cards')
    .select('id')
    .eq('patient_id', patient.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('medical_cards')
      .update({ [field]: value, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  }

  await setState(supabase, patient.id, null, null);
  await sendMessage(chatId, t.mcFieldSaved[lang], { replyKeyboard: mainKeyboard(lang) }, lovableKey, telegramKey);
  await showOrStartMedicalCard(supabase, patient, chatId, lovableKey, telegramKey);
}

// ============= QABULGA YOZILISH (BEMOR) =============

async function startAppointment(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  // Default qiymatlar (agar bemor avval tibbiy karta to'ldirgan bo'lsa)
  const initial: Record<string, any> = {};
  await setState(supabase, patient.id, 'appt:name', initial);
  await sendMessage(chatId, t.apptStart[lang], { removeKeyboard: true }, lovableKey, telegramKey);
}

async function handleAppointmentStep(
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

  if (state === 'appt:name') {
    const name = text.trim();
    if (name.length < 2 || name.length > 200) {
      await sendMessage(
        chatId,
        lang === 'uz' ? '⚠️ Ismni 2-200 belgi orasida kiriting.' : '⚠️ Введите имя от 2 до 200 символов.',
        {},
        lovableKey,
        telegramKey,
      );
      return;
    }
    data.full_name = name;
    await setState(supabase, patient.id, 'appt:phone', data);
    await sendMessage(chatId, t.apptAskPhone[lang], {}, lovableKey, telegramKey);
    return;
  }

  if (state === 'appt:phone') {
    const phone = normalizePhone(text);
    if (!phone) {
      await sendMessage(chatId, t.apptInvalidPhone[lang], {}, lovableKey, telegramKey);
      return;
    }
    data.phone = phone;
    await setState(supabase, patient.id, 'appt:notes', data);
    await sendMessage(chatId, t.apptAskNotes[lang], {}, lovableKey, telegramKey);
    return;
  }

  if (state === 'appt:notes') {
    const trimmed = text.trim();
    const notes = trimmed === '—' || trimmed === '-' ? null : trimmed.slice(0, 500);
    data.notes = notes;
    await setState(supabase, patient.id, 'appt:review', data);
    await showAppointmentReview(supabase, patient, chatId, data, lovableKey, telegramKey);
    return;
  }
}

async function showAppointmentReview(
  supabase: any,
  patient: Patient,
  chatId: number,
  data: Record<string, any>,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  let text = t.apptReview[lang] + escapeHtml(data.full_name);
  text += t.apptReviewPhone[lang] + escapeHtml(data.phone);
  if (data.notes) text += t.apptReviewNotes[lang] + escapeHtml(data.notes);
  await sendMessage(
    chatId,
    text,
    {
      inlineKeyboard: [
        [{ text: t.apptConfirmBtn[lang], callback_data: 'appt:save' }],
        [{ text: t.apptRestartBtn[lang], callback_data: 'appt:restart' }],
        [{ text: t.apptCancelBtn[lang], callback_data: 'appt:cancel' }],
      ],
    },
    lovableKey,
    telegramKey,
  );
}

async function saveAppointment(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const data = (patient.state_data as Record<string, any>) ?? {};
  if (!data.full_name || !data.phone) return;

  const { data: created } = await supabase
    .from('appointments')
    .insert({
      patient_id: patient.id,
      full_name: data.full_name,
      phone: data.phone,
      notes: data.notes ?? null,
      status: 'new',
    })
    .select('*')
    .single();

  // Bemorning telefon raqamini ham yangilab qo'yamiz
  await supabase.from('patients').update({ phone: data.phone }).eq('id', patient.id);

  await setState(supabase, patient.id, null, null);
  await sendMessage(chatId, t.apptDone[lang], { replyKeyboard: mainKeyboard(lang) }, lovableKey, telegramKey);

  // Adminlarga bildirishnoma yuborish (asinxron, xatoga uchragan bo'lsa ham bemor jarayoni davom etadi)
  notifyAdminsAboutAppointment(supabase, created, lovableKey, telegramKey).catch((e) =>
    console.error('Admin notify failed:', e),
  );
}

async function notifyAdminsAboutAppointment(
  supabase: any,
  appt: any,
  lovableKey: string,
  telegramKey: string,
) {
  const { data: admins } = await supabase.from('admins').select('telegram_id');
  if (!admins) return;
  for (const admin of admins) {
    const adminLang: Lang = 'uz';
    let text = t.apptNotifyAdmin[adminLang];
    text += `👤 <b>${escapeHtml(appt.full_name)}</b>\n`;
    text += `📞 <code>${escapeHtml(appt.phone)}</code>\n`;
    if (appt.notes) text += `📝 ${escapeHtml(appt.notes)}\n`;
    text += `\n/admin → 📞 Qo'ng'iroq so'rovlari`;
    try {
      await sendMessage(admin.telegram_id, text, {}, lovableKey, telegramKey);
    } catch (e) {
      console.error(`Failed to notify admin ${admin.telegram_id}:`, e);
    }
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
  const { data: created } = await supabase.from('complaints').insert({
    patient_id: patient.id,
    type: 'complaint',
    message: text,
  }).select('*').single();
  await setState(supabase, patient.id, null, null);
  await sendMessage(chatId, t.complaintSaved[lang], { replyKeyboard: mainKeyboard(lang) }, lovableKey, telegramKey);

  // Adminlarga bildirishnoma (asinxron)
  if (created) {
    notifyAdminsAboutComplaint(supabase, created, lovableKey, telegramKey).catch((e) =>
      console.error('Notify admins about complaint failed:', e),
    );
  }
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

    if (data.startsWith('mc:edit:')) {
      const field = data.slice('mc:edit:'.length);
      await answerCallbackQuery(cq.id, undefined, lovableKey, telegramKey);
      await startMcEdit(supabase, patient, chatId, field, lovableKey, telegramKey);
      return;
    }

    if (data === 'appt:save') {
      await answerCallbackQuery(cq.id, '✅', lovableKey, telegramKey);
      await saveAppointment(supabase, patient, chatId, lovableKey, telegramKey);
      return;
    }
    if (data === 'appt:restart') {
      await answerCallbackQuery(cq.id, undefined, lovableKey, telegramKey);
      await startAppointment(supabase, patient, chatId, lovableKey, telegramKey);
      return;
    }
    if (data === 'appt:cancel') {
      await answerCallbackQuery(cq.id, undefined, lovableKey, telegramKey);
      await setState(supabase, patient.id, null, null);
      await sendMessage(chatId, t.cancelled[patient.language], { replyKeyboard: mainKeyboard(patient.language) }, lovableKey, telegramKey);
      return;
    }

    // Xodim cheklist callback'lari (admin emas — alohida yo'l)
    if (data === 'chk:list' || data.startsWith('chk:open:') || data.startsWith('cm:') || data.startsWith('chk:m:')) {
      const { handleChecklistCallback } = await import('./checklist-handler.ts');
      const handled = await handleChecklistCallback(
        supabase, patient, chatId, data,
        async (txt?: string) => { await answerCallbackQuery(cq.id, txt, lovableKey, telegramKey); },
        lovableKey, telegramKey,
      );
      if (handled) return;
    }

    // Koordinator tekshiruv tugmalari (crv:)
    // Admin bo'lmagan koordinator ham ishlata olishi uchun adminCallback'dan oldin
    if (data.startsWith('crv:')) {
      const { handleCoordinatorCallback } = await import('./coordinator-handler.ts');
      const handled = await handleCoordinatorCallback(
        supabase, patient, chatId, data,
        async (txt?: string) => { await answerCallbackQuery(cq.id, txt, lovableKey, telegramKey); },
        lovableKey, telegramKey,
      );
      if (handled) return;
    }

    // Rezident callbacks (foydalanuvchi tomon)
    if (data.startsWith('res:')) {
      const handledRes = await handleResidentCallback(
        supabase, patient, chatId, data,
        async (txt?: string) => { await answerCallbackQuery(cq.id, txt, lovableKey, telegramKey); },
        lovableKey, telegramKey,
      );
      if (handledRes) return;
    }

    // Lab xodim callbacks (lab:o:, lab:acc:, lab:rej:, lab:rdy:)
    if (data.startsWith('lab:')) {
      const handledLab = await handleLabCallback(
        supabase, patient, chatId, data,
        async (txt?: string) => { await answerCallbackQuery(cq.id, txt, lovableKey, telegramKey); },
        lovableKey, telegramKey,
      );
      if (handledLab) return;
    }

    // Koordinator lab callbacks (clab:add, clab:ready, clab:app:, clab:doc:)
    if (data.startsWith('clab:')) {
      const handledCLab = await handleCoordLabCallback(
        supabase, patient, chatId, data,
        async (txt?: string) => { await answerCallbackQuery(cq.id, txt, lovableKey, telegramKey); },
        lovableKey, telegramKey,
      );
      if (handledCLab) return;
    }

    // Admin callbacks
    const handled = await handleAdminCallback(supabase, patient, chatId, data, cq.id, lovableKey, telegramKey);
    if (handled) return;

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

  // Admin media yuklash (rasm/video/hujjat) — faqat admin uchun
  const hasMedia = msg.photo || msg.video || msg.document || msg.audio || msg.voice || msg.animation;
  if (hasMedia) {
    const admin = await isAdmin(supabase, patient.telegram_id);

    // Koordinator lab media (xray/scanner/note bosqichlari) — admin emas ham bo'lishi mumkin
    if (patient.state?.startsWith('clab:add:')) {
      const handledLabMedia = await handleCoordLabMedia(supabase, patient, admin, chatId, msg, lovableKey, telegramKey);
      if (handledLabMedia) return;
    }

    if (admin) {
      // Rezidentura bo'limiga media yuklash
      if (patient.state === 'admin:res:addmed') {
        const handled = await handleAdminResidentMediaUpload(supabase, patient, admin, chatId, msg, lovableKey, telegramKey);
        if (handled) return;
      }
      // Agar broadcast oqimida media kutilmoqda bo'lsa — to'g'ridan-to'g'ri broadcastga qo'shamiz
      if (patient.state === 'admin:bc:media') {
        const saved = await saveAdminMedia(supabase, admin, msg);
        if (saved) {
          await bcAddMedia(supabase, patient, chatId, saved.id, lovableKey, telegramKey);
        }
        return;
      }
      await handleAdminMediaUpload(supabase, patient, admin, chatId, msg, lovableKey, telegramKey);
      return;
    }
  }

  // /start
  if (text === '/start') {
    await setState(supabase, patient.id, null, null);

    // Koordinator ham boshqa bemorlar kabi — bemor menyusini ko'radi.
    // Xodim/koordinator portaliga faqat /staff orqali kiradi.

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

  // /staff — xodim portali (koordinator ham shu yerda)
  if (text === '/staff' || text === '/xodim' || text === '/coordinator' || text === '/koordinator') {
    const { handleStaffCommand } = await import('./staff-handler.ts');
    await handleStaffCommand(supabase, patient, chatId, lovableKey, telegramKey);
    return;
  }

  // /rezidentura — rezidentlar uchun
  if (text === '/rezidentura' || text === '/residency' || text === '/rezident') {
    const resident = await isResident(supabase, patient.telegram_id);
    if (!resident) {
      await sendMessage(chatId, t.residencyNotAuthorized[lang], {}, lovableKey, telegramKey);
      return;
    }
    await showResidentHome(supabase, patient, chatId, lovableKey, telegramKey);
    return;
  }

  // /laboratoriya — lab xodimlari uchun
  if (text === '/laboratoriya' || text === '/laboratory' || text === '/lab') {
    await handleLaboratoryCommand(supabase, patient, chatId, lovableKey, telegramKey);
    return;
  }

  // Lab xodim portali state'lari
  if (patient.state === 'lab:menu') {
    const handledLab = await handleLabPortalMessage(supabase, patient, chatId, text, lovableKey, telegramKey);
    if (handledLab) return;
    await handleLaboratoryCommand(supabase, patient, chatId, lovableKey, telegramKey);
    return;
  }
  if (patient.state === 'lab:rej:reason') {
    await handleLabRejectReason(supabase, patient, chatId, text, lovableKey, telegramKey);
    return;
  }

  // Koordinator lab qo'shish state'lari (matn qadamlari)
  if (patient.state?.startsWith('clab:add:')) {
    const handledCLab = await handleCoordLabStep(supabase, patient, chatId, text, lovableKey, telegramKey);
    if (handledCLab) return;
  }

  // Rezident menyusi state'i
  if (patient.state === 'res:home' || patient.state?.startsWith('res:t:')) {
    const handled = await handleResidentMessage(supabase, patient, chatId, text, lovableKey, telegramKey);
    if (handled) return;
  }

  // Koordinator statistika menyusi state'i
  if (patient.state === 'coord:stats') {
    const { handleCoordStatsMessage, handleStaffCommand } = await import('./staff-handler.ts');
    const handled = await handleCoordStatsMessage(supabase, patient, chatId, text, lovableKey, telegramKey);
    if (handled) return;
    // tushunilmagan matn — staff menyuga qaytamiz
    await handleStaffCommand(supabase, patient, chatId, lovableKey, telegramKey);
    return;
  }

  // Xodim portali state'lari (bemor menyusi tushmasin)
  if (patient.state === 'staff:menu') {
    const { handleStaffPortalMessage } = await import('./staff-handler.ts');
    const handled = await handleStaffPortalMessage(supabase, patient, chatId, text, lovableKey, telegramKey);
    if (handled) return;
    // tushunilmagan matn — menyu qayta ko'rsatamiz
    const { handleStaffCommand } = await import('./staff-handler.ts');
    await handleStaffCommand(supabase, patient, chatId, lovableKey, telegramKey);
    return;
  }
  if (patient.state === 'staff:complaint') {
    const { handleStaffComplaint } = await import('./staff-handler.ts');
    await handleStaffComplaint(supabase, patient, chatId, text, lovableKey, telegramKey);
    return;
  }
  // Cheklist admin step (title yoki itemlar) — adminMessage handler ishlatiladi pastda


  // Admin (/admin buyrug'i va admin state/menu xabarlari)
  const isAdminCmd = text === '/admin';
  if (isAdminCmd || patient.state?.startsWith('admin:')) {
    const handled = await handleAdminMessage(supabase, patient, chatId, text, lovableKey, telegramKey);
    if (handled) return;
    if (isAdminCmd) {
      await sendMessage(chatId, t.adminNotAuthorized[lang], {}, lovableKey, telegramKey);
      return;
    }
  }

  // State'da turgan bo'lsa
  if (patient.state === 'mc:edit') {
    await saveMcEdit(supabase, patient, chatId, text, lovableKey, telegramKey);
    return;
  }
  if (patient.state?.startsWith('mc:')) {
    await handleMedicalCardStep(supabase, patient, chatId, text, lovableKey, telegramKey);
    return;
  }
  if (patient.state?.startsWith('appt:')) {
    await handleAppointmentStep(supabase, patient, chatId, text, lovableKey, telegramKey);
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
  } else if (matches('appointment')) {
    await startAppointment(supabase, patient, chatId, lovableKey, telegramKey);
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
