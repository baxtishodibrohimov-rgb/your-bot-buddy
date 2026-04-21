// Admin panel - Telegram bot ichida
import { sendMessage, answerCallbackQuery, escapeHtml, type ReplyKeyboard, type InlineKeyboard } from './telegram-api.ts';
import { t, type Lang } from './i18n.ts';

type Admin = {
  id: string;
  telegram_id: number;
  full_name: string | null;
  is_super_admin: boolean;
};

type Patient = {
  id: string;
  telegram_id: number;
  language: Lang;
  state: string | null;
  state_data: Record<string, unknown> | null;
};

export async function isAdmin(supabase: any, tgId: number): Promise<Admin | null> {
  const { data } = await supabase
    .from('admins')
    .select('*')
    .eq('telegram_id', tgId)
    .maybeSingle();
  return (data as Admin) ?? null;
}

export function adminMainKeyboard(lang: Lang, isSuper: boolean): ReplyKeyboard {
  const rows: ReplyKeyboard = [
    [{ text: t.adminMenuAppointments[lang] }, { text: t.adminMenu.complaints[lang] }],
    [{ text: t.adminMenu.clinic[lang] }, { text: t.adminMenu.services[lang] }],
    [{ text: t.adminMenu.doctors[lang] }, { text: t.adminMenu.patients[lang] }],
    [{ text: t.adminMenu.stats[lang] }],
  ];
  if (isSuper) rows.push([{ text: t.adminMenu.admins[lang] }]);
  rows.push([{ text: t.adminMenu.exit[lang] }]);
  return rows;
}

async function setState(supabase: any, patientId: string, state: string | null, stateData: any = null) {
  await supabase
    .from('patients')
    .update({ state, state_data: stateData })
    .eq('id', patientId);
}

export async function showAdminMenu(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const admin = await isAdmin(supabase, patient.telegram_id);
  if (!admin) {
    await sendMessage(chatId, t.adminNotAuthorized[patient.language], {}, lovableKey, telegramKey);
    return;
  }
  await setState(supabase, patient.id, 'admin:menu', null);
  await sendMessage(
    chatId,
    t.adminWelcome[patient.language],
    { replyKeyboard: adminMainKeyboard(patient.language, admin.is_super_admin) },
    lovableKey,
    telegramKey,
  );
}

// ============= KLINIKA MA'LUMOTLARI =============

const CLINIC_FIELDS: Array<keyof typeof t.clinicFields> = [
  'name_uz', 'name_ru', 'about_uz', 'about_ru',
  'address_uz', 'address_ru', 'working_hours_uz', 'working_hours_ru',
  'phone', 'instagram', 'telegram_channel', 'location_url',
];

// Wizard tartibi (eng muhimlari avval)
const WIZARD_FIELDS: Array<keyof typeof t.clinicWizQ> = [
  'name_uz', 'name_ru',
  'address_uz', 'address_ru',
  'phone',
  'working_hours_uz', 'working_hours_ru',
  'about_uz', 'about_ru',
  'instagram', 'telegram_channel', 'location_url',
];

async function showClinicInfo(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data } = await supabase.from('clinic_info').select('*').eq('id', 1).single();
  let text = '🏥 <b>Klinika ma\'lumotlari</b>\n\n';
  for (const f of CLINIC_FIELDS) {
    const label = t.clinicFields[f][lang];
    const val = (data?.[f] as string | null) ?? '—';
    text += `<b>${escapeHtml(label)}:</b> ${escapeHtml(String(val))}\n`;
  }

  const buttons: InlineKeyboard = [
    [{ text: t.clinicWizardBtn[lang], callback_data: 'cli:wiz:start' }],
  ];
  // 2 tadan tugma joylash
  for (let i = 0; i < CLINIC_FIELDS.length; i += 2) {
    const row = [
      { text: '✏️ ' + t.clinicFields[CLINIC_FIELDS[i]][lang], callback_data: `cli:edit:${CLINIC_FIELDS[i]}` },
    ];
    if (i + 1 < CLINIC_FIELDS.length) {
      row.push({ text: '✏️ ' + t.clinicFields[CLINIC_FIELDS[i + 1]][lang], callback_data: `cli:edit:${CLINIC_FIELDS[i + 1]}` });
    }
    buttons.push(row);
  }
  await setState(supabase, patient.id, 'admin:clinic', null);
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

async function clinicAskField(
  supabase: any,
  patient: Patient,
  chatId: number,
  field: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await setState(supabase, patient.id, 'admin:clinic:edit', { field });
  const label = (t.clinicFields as any)[field]?.[lang] ?? field;
  await sendMessage(
    chatId,
    `<b>${escapeHtml(label)}</b>\n\n${t.adminEnterValue[lang]}\n\n/cancel — ${t.adminCancel[lang]}`,
    { removeKeyboard: true },
    lovableKey,
    telegramKey,
  );
}

async function clinicSaveField(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
) {
  const data = (patient.state_data as any) ?? {};
  const field = data.field as string;
  if (!field) return;
  await supabase.from('clinic_info').update({ [field]: text, updated_at: new Date().toISOString() }).eq('id', 1);
  await sendMessage(chatId, t.adminSaved[patient.language], {}, lovableKey, telegramKey);
  await showClinicInfo(supabase, patient, chatId, lovableKey, telegramKey);
}

// ============= KLINIKA SEHRGARI (WIZARD) =============

async function clinicWizardStart(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await setState(supabase, patient.id, 'admin:clinic:wiz:confirm', { step: 0, values: {} });
  await sendMessage(
    chatId,
    t.clinicWizardStart[lang],
    {
      inlineKeyboard: [
        [{ text: t.clinicWizardStartBtn[lang], callback_data: 'cli:wiz:go' }],
        [{ text: t.clinicWizardCancel[lang], callback_data: 'cli:wiz:cancel' }],
      ],
    },
    lovableKey,
    telegramKey,
  );
}

async function clinicWizardAsk(
  supabase: any,
  patient: Patient,
  chatId: number,
  step: number,
  values: Record<string, string | null>,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const total = WIZARD_FIELDS.length;
  if (step >= total) {
    return clinicWizardReview(supabase, patient, chatId, values, lovableKey, telegramKey);
  }
  const field = WIZARD_FIELDS[step];
  await setState(supabase, patient.id, 'admin:clinic:wiz:step', { step, values });
  const header = `<i>${t.clinicWizardStep[lang]} ${step + 1}/${total}</i>\n\n`;
  await sendMessage(
    chatId,
    header + t.clinicWizQ[field][lang] + `\n\n/cancel — ${t.adminCancel[lang]}`,
    { removeKeyboard: true },
    lovableKey,
    telegramKey,
  );
}

async function clinicWizardHandleStep(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
) {
  const data = (patient.state_data as any) ?? { step: 0, values: {} };
  const step: number = data.step ?? 0;
  const values: Record<string, string | null> = data.values ?? {};
  const field = WIZARD_FIELDS[step];
  if (!field) return;
  const trimmed = text.trim();
  const skip = trimmed === '—' || trimmed === '-';
  // Majburiy maydonlar (skip qilib bo'lmaydi)
  const required: Array<string> = ['name_uz', 'name_ru', 'phone'];
  if (skip && required.includes(field)) {
    const lang = patient.language;
    await sendMessage(
      chatId,
      lang === 'uz' ? '⚠️ Bu maydon majburiy. Iltimos, qiymat kiriting.' : '⚠️ Это поле обязательно. Введите значение.',
      {},
      lovableKey,
      telegramKey,
    );
    return;
  }
  values[field] = skip ? null : trimmed;
  await clinicWizardAsk(supabase, patient, chatId, step + 1, values, lovableKey, telegramKey);
}

async function clinicWizardReview(
  supabase: any,
  patient: Patient,
  chatId: number,
  values: Record<string, string | null>,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  await setState(supabase, patient.id, 'admin:clinic:wiz:review', { values });
  let text = t.clinicWizardReview[lang] + '\n\n';
  for (const f of WIZARD_FIELDS) {
    const label = t.clinicFields[f][lang];
    const val = values[f] ?? '—';
    text += `<b>${escapeHtml(label)}:</b> ${escapeHtml(String(val))}\n`;
  }
  await sendMessage(
    chatId,
    text,
    {
      inlineKeyboard: [
        [{ text: t.clinicWizardSave[lang], callback_data: 'cli:wiz:save' }],
        [{ text: t.clinicWizardRestart[lang], callback_data: 'cli:wiz:start' }],
        [{ text: t.clinicWizardCancel[lang], callback_data: 'cli:wiz:cancel' }],
      ],
    },
    lovableKey,
    telegramKey,
  );
}

async function clinicWizardSave(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const data = (patient.state_data as any) ?? { values: {} };
  const values: Record<string, string | null> = data.values ?? {};
  const payload: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const f of WIZARD_FIELDS) {
    if (values[f] !== undefined) payload[f] = values[f];
  }
  await supabase.from('clinic_info').update(payload).eq('id', 1);
  await sendMessage(chatId, t.clinicWizardDone[lang], {}, lovableKey, telegramKey);
  await showClinicInfo(supabase, patient, chatId, lovableKey, telegramKey);
}

async function clinicWizardCancel(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  await setState(supabase, patient.id, 'admin:menu', null);
  await sendMessage(chatId, t.adminCancelled[patient.language], {}, lovableKey, telegramKey);
  await showClinicInfo(supabase, patient, chatId, lovableKey, telegramKey);
}

// ============= XIZMATLAR =============

async function listServices(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data } = await supabase.from('services').select('*').order('sort_order');
  let text = '🦷 <b>Xizmatlar</b>\n\n';
  if (!data || data.length === 0) {
    text += '—';
  } else {
    for (const s of data) {
      const name = lang === 'uz' ? s.name_uz : s.name_ru;
      const status = s.is_active ? '🟢' : '⚪️';
      text += `${status} <b>${escapeHtml(name)}</b>\n`;
      if (s.price_from) {
        const p = s.price_to ? `${s.price_from}-${s.price_to}` : `${s.price_from}+`;
        text += `   💰 ${p} ${t.sum[lang]}\n`;
      }
    }
  }
  const buttons: InlineKeyboard = [
    [{ text: t.adminAdd[lang], callback_data: 'svc:new' }],
  ];
  if (data && data.length > 0) {
    for (const s of data) {
      const name = lang === 'uz' ? s.name_uz : s.name_ru;
      buttons.push([
        { text: `✏️ ${name.slice(0, 20)}`, callback_data: `svc:edit:${s.id}` },
        { text: '🗑', callback_data: `svc:del:${s.id}` },
      ]);
    }
  }
  await setState(supabase, patient.id, 'admin:services', null);
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

async function startNewService(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  await setState(supabase, patient.id, 'admin:svc:name_uz', { mode: 'new' });
  await sendMessage(
    chatId,
    `${t.svcAskNameUz[patient.language]}\n\n/cancel — ${t.adminCancel[patient.language]}`,
    { removeKeyboard: true },
    lovableKey,
    telegramKey,
  );
}

async function deleteService(
  supabase: any,
  patient: Patient,
  chatId: number,
  id: string,
  lovableKey: string,
  telegramKey: string,
) {
  await supabase.from('services').delete().eq('id', id);
  await sendMessage(chatId, t.adminDeleted[patient.language], {}, lovableKey, telegramKey);
  await listServices(supabase, patient, chatId, lovableKey, telegramKey);
}

async function handleServiceStep(
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
  const skip = (s: string) => s.trim() === '—' || s.trim() === '-';

  if (state === 'admin:svc:name_uz') {
    data.name_uz = text;
    await setState(supabase, patient.id, 'admin:svc:name_ru', data);
    await sendMessage(chatId, t.svcAskNameRu[lang], {}, lovableKey, telegramKey);
  } else if (state === 'admin:svc:name_ru') {
    data.name_ru = text;
    await setState(supabase, patient.id, 'admin:svc:desc_uz', data);
    await sendMessage(chatId, t.svcAskDescUz[lang], {}, lovableKey, telegramKey);
  } else if (state === 'admin:svc:desc_uz') {
    data.description_uz = skip(text) ? null : text;
    await setState(supabase, patient.id, 'admin:svc:desc_ru', data);
    await sendMessage(chatId, t.svcAskDescRu[lang], {}, lovableKey, telegramKey);
  } else if (state === 'admin:svc:desc_ru') {
    data.description_ru = skip(text) ? null : text;
    await setState(supabase, patient.id, 'admin:svc:price_from', data);
    await sendMessage(chatId, t.svcAskPriceFrom[lang], {}, lovableKey, telegramKey);
  } else if (state === 'admin:svc:price_from') {
    data.price_from = skip(text) ? null : Number(text.replace(/\s/g, ''));
    await setState(supabase, patient.id, 'admin:svc:price_to', data);
    await sendMessage(chatId, t.svcAskPriceTo[lang], {}, lovableKey, telegramKey);
  } else if (state === 'admin:svc:price_to') {
    data.price_to = skip(text) ? null : Number(text.replace(/\s/g, ''));
    const payload = {
      name_uz: data.name_uz,
      name_ru: data.name_ru,
      description_uz: data.description_uz,
      description_ru: data.description_ru,
      price_from: data.price_from,
      price_to: data.price_to,
      is_active: true,
    };
    await supabase.from('services').insert(payload);
    await setState(supabase, patient.id, 'admin:menu', null);
    await sendMessage(chatId, t.adminSaved[lang], {}, lovableKey, telegramKey);
    await listServices(supabase, patient, chatId, lovableKey, telegramKey);
  }
}

// ============= SHIFOKORLAR =============

async function listDoctors(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data } = await supabase.from('doctors').select('*').order('sort_order');
  let text = '👨‍⚕️ <b>Shifokorlar</b>\n\n';
  if (!data || data.length === 0) {
    text += '—';
  } else {
    for (const d of data) {
      const spec = lang === 'uz' ? d.specialty_uz : d.specialty_ru;
      const status = d.is_active ? '🟢' : '⚪️';
      text += `${status} <b>${escapeHtml(d.full_name)}</b> — ${escapeHtml(spec)}\n`;
    }
  }
  const buttons: InlineKeyboard = [
    [{ text: t.adminAdd[lang], callback_data: 'doc:new' }],
  ];
  if (data && data.length > 0) {
    for (const d of data) {
      buttons.push([
        { text: `✏️ ${d.full_name.slice(0, 20)}`, callback_data: `doc:edit:${d.id}` },
        { text: '🗑', callback_data: `doc:del:${d.id}` },
      ]);
    }
  }
  await setState(supabase, patient.id, 'admin:doctors', null);
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

async function startNewDoctor(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  await setState(supabase, patient.id, 'admin:doc:name', { mode: 'new' });
  await sendMessage(
    chatId,
    `${t.docAskName[patient.language]}\n\n/cancel — ${t.adminCancel[patient.language]}`,
    { removeKeyboard: true },
    lovableKey,
    telegramKey,
  );
}

async function deleteDoctor(
  supabase: any,
  patient: Patient,
  chatId: number,
  id: string,
  lovableKey: string,
  telegramKey: string,
) {
  await supabase.from('doctors').delete().eq('id', id);
  await sendMessage(chatId, t.adminDeleted[patient.language], {}, lovableKey, telegramKey);
  await listDoctors(supabase, patient, chatId, lovableKey, telegramKey);
}

async function handleDoctorStep(
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
  const skip = (s: string) => s.trim() === '—' || s.trim() === '-';

  if (state === 'admin:doc:name') {
    data.full_name = text;
    await setState(supabase, patient.id, 'admin:doc:spec_uz', data);
    await sendMessage(chatId, t.docAskSpecUz[lang], {}, lovableKey, telegramKey);
  } else if (state === 'admin:doc:spec_uz') {
    data.specialty_uz = text;
    await setState(supabase, patient.id, 'admin:doc:spec_ru', data);
    await sendMessage(chatId, t.docAskSpecRu[lang], {}, lovableKey, telegramKey);
  } else if (state === 'admin:doc:spec_ru') {
    data.specialty_ru = text;
    await setState(supabase, patient.id, 'admin:doc:exp', data);
    await sendMessage(chatId, t.docAskExp[lang], {}, lovableKey, telegramKey);
  } else if (state === 'admin:doc:exp') {
    data.experience_years = skip(text) ? null : Number(text);
    await setState(supabase, patient.id, 'admin:doc:bio_uz', data);
    await sendMessage(chatId, t.docAskBioUz[lang], {}, lovableKey, telegramKey);
  } else if (state === 'admin:doc:bio_uz') {
    data.bio_uz = skip(text) ? null : text;
    await setState(supabase, patient.id, 'admin:doc:bio_ru', data);
    await sendMessage(chatId, t.docAskBioRu[lang], {}, lovableKey, telegramKey);
  } else if (state === 'admin:doc:bio_ru') {
    data.bio_ru = skip(text) ? null : text;
    const payload = {
      full_name: data.full_name,
      specialty_uz: data.specialty_uz,
      specialty_ru: data.specialty_ru,
      experience_years: data.experience_years,
      bio_uz: data.bio_uz,
      bio_ru: data.bio_ru,
      is_active: true,
    };
    await supabase.from('doctors').insert(payload);
    await setState(supabase, patient.id, 'admin:menu', null);
    await sendMessage(chatId, t.adminSaved[lang], {}, lovableKey, telegramKey);
    await listDoctors(supabase, patient, chatId, lovableKey, telegramKey);
  }
}

// ============= BEMORLAR =============

async function listPatients(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data } = await supabase
    .from('patients')
    .select('id, telegram_id, telegram_username, first_name, last_name, phone, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  let text = t.patientsTitle[lang];
  if (!data || data.length === 0) {
    text += t.patientsEmpty[lang];
    await sendMessage(chatId, text, {}, lovableKey, telegramKey);
    return;
  }

  const buttons: InlineKeyboard = [];
  for (const p of data) {
    const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.telegram_username || `ID ${p.telegram_id}`;
    text += `• <b>${escapeHtml(name)}</b>${p.phone ? ' — ' + escapeHtml(p.phone) : ''}\n`;
    buttons.push([{ text: `📋 ${name.slice(0, 30)}`, callback_data: `pat:card:${p.id}` }]);
  }
  await setState(supabase, patient.id, 'admin:patients', null);
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

async function showPatientCard(
  supabase: any,
  patient: Patient,
  chatId: number,
  patientId: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data: p } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .maybeSingle();
  const { data: card } = await supabase
    .from('medical_cards')
    .select('*')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (!p) {
    await sendMessage(chatId, '—', {}, lovableKey, telegramKey);
    return;
  }

  const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.telegram_username || `ID ${p.telegram_id}`;
  let text = `👤 <b>${escapeHtml(name)}</b>\n`;
  if (p.telegram_username) text += `@${escapeHtml(p.telegram_username)}\n`;
  if (p.phone) text += `📞 ${escapeHtml(p.phone)}\n`;
  text += `🆔 ${p.telegram_id}\n\n`;

  if (!card || !card.full_name) {
    text += t.patientNoCard[lang];
  } else {
    text += `📋 <b>Tibbiy karta:</b>\n`;
    text += `<b>F.I.SH:</b> ${escapeHtml(card.full_name)}\n`;
    if (card.birth_date) text += `<b>Tug'ilgan:</b> ${card.birth_date}\n`;
    if (card.gender) text += `<b>Jinsi:</b> ${escapeHtml(card.gender)}\n`;
    if (card.address) text += `<b>Manzil:</b> ${escapeHtml(card.address)}\n`;
    if (card.allergies) text += `<b>Allergiya:</b> ${escapeHtml(card.allergies)}\n`;
    if (card.chronic_diseases) text += `<b>Surunkali:</b> ${escapeHtml(card.chronic_diseases)}\n`;
    if (card.current_medications) text += `<b>Dorilar:</b> ${escapeHtml(card.current_medications)}\n`;
    if (card.previous_treatments) text += `<b>Avvalgi:</b> ${escapeHtml(card.previous_treatments)}\n`;
  }
  await sendMessage(chatId, text, {}, lovableKey, telegramKey);
}

// ============= SHIKOYATLAR =============

async function listComplaints(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data } = await supabase
    .from('complaints')
    .select('*, patients(first_name, last_name, telegram_id, telegram_username)')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!data || data.length === 0) {
    await sendMessage(chatId, t.complaintsEmpty[lang], {}, lovableKey, telegramKey);
    return;
  }

  await setState(supabase, patient.id, 'admin:complaints', null);
  for (const c of data) {
    const p = c.patients;
    const name = p
      ? ([p.first_name, p.last_name].filter(Boolean).join(' ') || p.telegram_username || `ID ${p.telegram_id}`)
      : '—';
    const statusKey = (c.status as 'new' | 'in_progress' | 'resolved') ?? 'new';
    const statusLabel = (t.complaintStatus as any)[statusKey]?.[lang] ?? c.status;
    const date = new Date(c.created_at).toLocaleString('ru-RU');

    let text = `${statusLabel}\n`;
    text += `<b>${escapeHtml(name)}</b> • ${date}\n\n`;
    text += escapeHtml(c.message);
    if (c.admin_response) {
      text += `\n\n<b>Javob:</b> ${escapeHtml(c.admin_response)}`;
    }

    const buttons: InlineKeyboard = [];
    if (c.status !== 'resolved') {
      buttons.push([
        { text: t.complaintReply[lang], callback_data: `cmp:reply:${c.id}` },
        { text: t.complaintMarkResolved[lang], callback_data: `cmp:done:${c.id}` },
      ]);
    }
    await sendMessage(chatId, text, { inlineKeyboard: buttons.length ? buttons : undefined }, lovableKey, telegramKey);
  }
}

async function startComplaintReply(
  supabase: any,
  patient: Patient,
  chatId: number,
  complaintId: string,
  lovableKey: string,
  telegramKey: string,
) {
  await setState(supabase, patient.id, 'admin:cmp:reply', { complaintId });
  await sendMessage(
    chatId,
    `${t.complaintAskReply[patient.language]}\n\n/cancel — ${t.adminCancel[patient.language]}`,
    { removeKeyboard: true },
    lovableKey,
    telegramKey,
  );
}

async function saveComplaintReply(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const data = (patient.state_data as any) ?? {};
  const complaintId = data.complaintId as string;
  if (!complaintId) return;

  // Shikoyatni yangilash
  const { data: cmp } = await supabase
    .from('complaints')
    .update({ admin_response: text, status: 'resolved', updated_at: new Date().toISOString() })
    .eq('id', complaintId)
    .select('*, patients(telegram_id, language)')
    .single();

  // Bemorga javob yuborish
  if (cmp?.patients?.telegram_id) {
    const pLang = (cmp.patients.language as Lang) ?? 'uz';
    const replyText = t.complaintFromAdmin[pLang] + escapeHtml(text);
    try {
      await sendMessage(cmp.patients.telegram_id, replyText, {}, lovableKey, telegramKey);
    } catch (e) {
      console.error('Reply to patient failed', e);
    }
  }

  await setState(supabase, patient.id, 'admin:menu', null);
  await sendMessage(chatId, t.complaintReplied[lang], {}, lovableKey, telegramKey);
}

async function markComplaintResolved(
  supabase: any,
  patient: Patient,
  chatId: number,
  complaintId: string,
  lovableKey: string,
  telegramKey: string,
) {
  await supabase
    .from('complaints')
    .update({ status: 'resolved', updated_at: new Date().toISOString() })
    .eq('id', complaintId);
  await sendMessage(chatId, t.adminSaved[patient.language], {}, lovableKey, telegramKey);
}

// ============= STATISTIKA =============

async function showStats(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [pat, cards, svc, doc, cNew, cAll, pToday] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('medical_cards').select('*', { count: 'exact', head: true }).not('full_name', 'is', null),
    supabase.from('services').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('complaints').select('*', { count: 'exact', head: true }),
    supabase.from('patients').select('*', { count: 'exact', head: true }).gte('created_at', todayIso),
  ]);

  let text = t.statsTitle[lang];
  text += `👥 ${t.statsPatients[lang]}: <b>${pat.count ?? 0}</b>\n`;
  text += `🆕 ${t.statsToday[lang]}: <b>${pToday.count ?? 0}</b>\n`;
  text += `📋 ${t.statsCards[lang]}: <b>${cards.count ?? 0}</b>\n`;
  text += `🦷 ${t.statsServices[lang]}: <b>${svc.count ?? 0}</b>\n`;
  text += `👨‍⚕️ ${t.statsDoctors[lang]}: <b>${doc.count ?? 0}</b>\n`;
  text += `✉️ ${t.statsComplaintsNew[lang]}: <b>${cNew.count ?? 0}</b>\n`;
  text += `📨 ${t.statsComplaintsTotal[lang]}: <b>${cAll.count ?? 0}</b>\n`;

  await sendMessage(chatId, text, {}, lovableKey, telegramKey);
}

// ============= ADMINLAR (super-admin) =============

async function listAdmins(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const { data } = await supabase.from('admins').select('*').order('created_at');
  let text = '🔑 <b>Adminlar</b>\n\n';
  if (!data || data.length === 0) {
    text += t.adminListEmpty[lang];
  } else {
    for (const a of data) {
      const star = a.is_super_admin ? '⭐️ ' : '';
      text += `${star}<code>${a.telegram_id}</code>${a.full_name ? ' — ' + escapeHtml(a.full_name) : ''}\n`;
    }
  }
  const buttons: InlineKeyboard = [
    [{ text: t.adminAdd[lang], callback_data: 'adm:new' }],
  ];
  if (data) {
    for (const a of data) {
      if (!a.is_super_admin) {
        buttons.push([{ text: `🗑 ${a.telegram_id}`, callback_data: `adm:del:${a.id}` }]);
      }
    }
  }
  await setState(supabase, patient.id, 'admin:admins', null);
  await sendMessage(chatId, text, { inlineKeyboard: buttons }, lovableKey, telegramKey);
}

async function startNewAdmin(
  supabase: any,
  patient: Patient,
  chatId: number,
  lovableKey: string,
  telegramKey: string,
) {
  await setState(supabase, patient.id, 'admin:adm:tg_id', { mode: 'new' });
  await sendMessage(
    chatId,
    `${t.adminAskTgId[patient.language]}\n\n/cancel — ${t.adminCancel[patient.language]}`,
    { removeKeyboard: true },
    lovableKey,
    telegramKey,
  );
}

async function handleAdminStep(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
) {
  const lang = patient.language;
  const state = patient.state ?? '';
  const data = (patient.state_data as any) ?? {};

  if (state === 'admin:adm:tg_id') {
    const id = Number(text.trim());
    if (!id || isNaN(id)) {
      await sendMessage(chatId, '⚠️ Telegram ID raqam bo\'lishi kerak.', {}, lovableKey, telegramKey);
      return;
    }
    data.telegram_id = id;
    await setState(supabase, patient.id, 'admin:adm:name', data);
    await sendMessage(chatId, t.adminAskName[lang], {}, lovableKey, telegramKey);
  } else if (state === 'admin:adm:name') {
    const skip = text.trim() === '—' || text.trim() === '-';
    const payload = {
      telegram_id: data.telegram_id,
      full_name: skip ? null : text,
      is_super_admin: false,
    };
    const { error } = await supabase.from('admins').insert(payload);
    if (error) {
      await sendMessage(chatId, `⚠️ ${error.message}`, {}, lovableKey, telegramKey);
    } else {
      await sendMessage(chatId, t.adminSaved[lang], {}, lovableKey, telegramKey);
    }
    await setState(supabase, patient.id, 'admin:menu', null);
    await listAdmins(supabase, patient, chatId, lovableKey, telegramKey);
  }
}

async function deleteAdmin(
  supabase: any,
  patient: Patient,
  chatId: number,
  id: string,
  lovableKey: string,
  telegramKey: string,
) {
  // Super-admin'ni o'chirib bo'lmaydi
  await supabase.from('admins').delete().eq('id', id).eq('is_super_admin', false);
  await sendMessage(chatId, t.adminDeleted[patient.language], {}, lovableKey, telegramKey);
  await listAdmins(supabase, patient, chatId, lovableKey, telegramKey);
}

// ============= PUBLIC ROUTERS =============

/**
 * Adminning matnli xabarini qayta ishlash. Agar handle qilingan bo'lsa true qaytaradi.
 */
export async function handleAdminMessage(
  supabase: any,
  patient: Patient,
  chatId: number,
  text: string,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const admin = await isAdmin(supabase, patient.telegram_id);
  if (!admin) return false;
  const lang = patient.language;
  const state = patient.state ?? '';

  // /admin buyrug'i
  if (text === '/admin') {
    await showAdminMenu(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }

  // Admin state'lari (form to'ldirish)
  if (state === 'admin:clinic:wiz:step') {
    await clinicWizardHandleStep(supabase, patient, chatId, text, lovableKey, telegramKey);
    return true;
  }
  if (state === 'admin:clinic:edit') {
    await clinicSaveField(supabase, patient, chatId, text, lovableKey, telegramKey);
    return true;
  }
  if (state.startsWith('admin:svc:')) {
    await handleServiceStep(supabase, patient, chatId, text, lovableKey, telegramKey);
    return true;
  }
  if (state.startsWith('admin:doc:')) {
    await handleDoctorStep(supabase, patient, chatId, text, lovableKey, telegramKey);
    return true;
  }
  if (state === 'admin:cmp:reply') {
    await saveComplaintReply(supabase, patient, chatId, text, lovableKey, telegramKey);
    return true;
  }
  if (state.startsWith('admin:adm:')) {
    await handleAdminStep(supabase, patient, chatId, text, lovableKey, telegramKey);
    return true;
  }

  // Admin menyu tugmalari
  if (!state.startsWith('admin:')) return false;

  const m = (key: keyof typeof t.adminMenu) =>
    text === t.adminMenu[key].uz || text === t.adminMenu[key].ru;

  if (m('clinic')) {
    await showClinicInfo(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (m('services')) {
    await listServices(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (m('doctors')) {
    await listDoctors(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (m('patients')) {
    await listPatients(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (m('complaints')) {
    await listComplaints(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (m('stats')) {
    await showStats(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (m('admins') && admin.is_super_admin) {
    await listAdmins(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (m('exit')) {
    await setState(supabase, patient.id, null, null);
    await sendMessage(chatId, '👋', {}, lovableKey, telegramKey);
    return true;
  }

  // Admin state'da bo'lsa-yu lekin tushunmasak — menyuni qaytaramiz
  await showAdminMenu(supabase, patient, chatId, lovableKey, telegramKey);
  return true;
}

/**
 * Admin callback'ini qayta ishlash. Handle qilingan bo'lsa true.
 */
export async function handleAdminCallback(
  supabase: any,
  patient: Patient,
  chatId: number,
  data: string,
  callbackId: string,
  lovableKey: string,
  telegramKey: string,
): Promise<boolean> {
  const admin = await isAdmin(supabase, patient.telegram_id);
  if (!admin) return false;

  // Klinika sehrgari (wizard)
  if (data === 'cli:wiz:start') {
    await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    await clinicWizardStart(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (data === 'cli:wiz:go') {
    await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    await clinicWizardAsk(supabase, patient, chatId, 0, {}, lovableKey, telegramKey);
    return true;
  }
  if (data === 'cli:wiz:save') {
    await answerCallbackQuery(callbackId, '✅', lovableKey, telegramKey);
    await clinicWizardSave(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (data === 'cli:wiz:cancel') {
    await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    await clinicWizardCancel(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }

  // Klinika (alohida maydon tahriri)
  if (data.startsWith('cli:edit:')) {
    const field = data.slice('cli:edit:'.length);
    await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    await clinicAskField(supabase, patient, chatId, field, lovableKey, telegramKey);
    return true;
  }

  // Xizmatlar
  if (data === 'svc:new') {
    await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    await startNewService(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('svc:del:')) {
    const id = data.slice('svc:del:'.length);
    await answerCallbackQuery(callbackId, '🗑', lovableKey, telegramKey);
    await deleteService(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('svc:edit:')) {
    // Edit = o'chirib qaytadan qo'shish (oddiyligi uchun)
    await answerCallbackQuery(callbackId, 'O\'chirib, qaytadan qo\'shing', lovableKey, telegramKey);
    return true;
  }

  // Shifokorlar
  if (data === 'doc:new') {
    await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    await startNewDoctor(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('doc:del:')) {
    const id = data.slice('doc:del:'.length);
    await answerCallbackQuery(callbackId, '🗑', lovableKey, telegramKey);
    await deleteDoctor(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('doc:edit:')) {
    await answerCallbackQuery(callbackId, 'O\'chirib, qaytadan qo\'shing', lovableKey, telegramKey);
    return true;
  }

  // Bemorlar
  if (data.startsWith('pat:card:')) {
    const id = data.slice('pat:card:'.length);
    await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    await showPatientCard(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }

  // Shikoyatlar
  if (data.startsWith('cmp:reply:')) {
    const id = data.slice('cmp:reply:'.length);
    await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    await startComplaintReply(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('cmp:done:')) {
    const id = data.slice('cmp:done:'.length);
    await answerCallbackQuery(callbackId, '✅', lovableKey, telegramKey);
    await markComplaintResolved(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }

  // Adminlar (faqat super-admin)
  if (data === 'adm:new' && admin.is_super_admin) {
    await answerCallbackQuery(callbackId, undefined, lovableKey, telegramKey);
    await startNewAdmin(supabase, patient, chatId, lovableKey, telegramKey);
    return true;
  }
  if (data.startsWith('adm:del:') && admin.is_super_admin) {
    const id = data.slice('adm:del:'.length);
    await answerCallbackQuery(callbackId, '🗑', lovableKey, telegramKey);
    await deleteAdmin(supabase, patient, chatId, id, lovableKey, telegramKey);
    return true;
  }

  return false;
}
