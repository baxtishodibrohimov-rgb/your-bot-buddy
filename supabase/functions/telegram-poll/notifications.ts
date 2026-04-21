// Bildirishnomalar: broadcast, appointment status, eslatma, complaint adminga
import { sendMessage, sendMediaByType, escapeHtml } from './telegram-api.ts';
import { t, type Lang } from './i18n.ts';

// ============= ADMINGA SHIKOYAT BILDIRISHNOMASI =============

export async function notifyAdminsAboutComplaint(
  supabase: any,
  complaint: any,
  lovableKey: string,
  telegramKey: string,
) {
  const { data: admins } = await supabase.from('admins').select('telegram_id');
  if (!admins) return;

  // Bemor ma'lumotlari (ixtiyoriy)
  let patientLine = '';
  if (complaint.patient_id) {
    const { data: p } = await supabase
      .from('patients')
      .select('first_name, last_name, telegram_username, phone, telegram_id')
      .eq('id', complaint.patient_id)
      .maybeSingle();
    if (p) {
      const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.telegram_username || `ID ${p.telegram_id}`;
      patientLine = `👤 <b>${escapeHtml(name)}</b>`;
      if (p.phone) patientLine += ` — ${escapeHtml(p.phone)}`;
      patientLine += '\n';
    }
  }

  for (const admin of admins) {
    const lang: Lang = 'uz';
    let text = t.cmpNotifyAdmin[lang];
    text += patientLine;
    text += `💬 ${escapeHtml(complaint.message)}\n\n`;
    text += `/admin → ✉️ Shikoyatlar`;
    try {
      await sendMessage(admin.telegram_id, text, {}, lovableKey, telegramKey);
    } catch (e) {
      console.error(`Failed to notify admin ${admin.telegram_id}:`, e);
    }
  }
}

// ============= BEMORGA STATUS BILDIRISHNOMASI =============

export async function notifyPatientAboutAppointmentStatus(
  supabase: any,
  appointment: any,
  newStatus: string,
  lovableKey: string,
  telegramKey: string,
) {
  if (!appointment.patient_id) return;

  const { data: p } = await supabase
    .from('patients')
    .select('telegram_id, language')
    .eq('id', appointment.patient_id)
    .maybeSingle();
  if (!p) return;

  const lang: Lang = (p.language as Lang) ?? 'uz';
  const statusKey = newStatus as 'called' | 'done' | 'cancelled';
  const statusMsg = (t.apptStatusUserNotif as any)[statusKey]?.[lang];
  if (!statusMsg) return;

  let text = statusMsg + '\n\n';
  text += `👤 <b>${escapeHtml(appointment.full_name)}</b>\n`;
  text += `📞 ${escapeHtml(appointment.phone)}\n`;
  if (appointment.appointment_at) {
    const dt = new Date(appointment.appointment_at);
    text += `📅 ${dt.toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })}\n`;
  }
  if (appointment.admin_note) text += `\n<i>${escapeHtml(appointment.admin_note)}</i>`;

  try {
    await sendMessage(p.telegram_id, text, {}, lovableKey, telegramKey);
  } catch (e) {
    console.error(`Failed to notify patient ${p.telegram_id}:`, e);
  }
}

// ============= ESLATMA (24 SOAT OLDIN) =============

export async function sendAppointmentReminders(
  supabase: any,
  lovableKey: string,
  telegramKey: string,
): Promise<{ sent: number; failed: number }> {
  // Hozirdan 23-25 soat oraliqda bo'lgan appointmentlar (cron har soatda chaqiriladi → derazani biroz keng tutamiz)
  const now = new Date();
  const from = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const to = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  const { data: appts, error } = await supabase
    .from('appointments')
    .select('*')
    .in('status', ['new', 'called'])
    .is('reminder_sent_at', null)
    .not('appointment_at', 'is', null)
    .gte('appointment_at', from)
    .lte('appointment_at', to);

  if (error) {
    console.error('Reminder query failed:', error);
    return { sent: 0, failed: 0 };
  }
  if (!appts || appts.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  for (const a of appts) {
    if (!a.patient_id) continue;
    const { data: p } = await supabase
      .from('patients')
      .select('telegram_id, language')
      .eq('id', a.patient_id)
      .maybeSingle();
    if (!p) continue;

    const lang: Lang = (p.language as Lang) ?? 'uz';
    const dt = new Date(a.appointment_at);
    const dateStr = dt.toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    let text = t.apptReminder[lang] + '\n\n';
    text += `📅 <b>${dateStr}</b>\n`;
    text += `👤 ${escapeHtml(a.full_name)}\n`;
    text += `📞 ${escapeHtml(a.phone)}\n`;
    if (a.notes) text += `📝 ${escapeHtml(a.notes)}\n`;

    try {
      await sendMessage(p.telegram_id, text, {}, lovableKey, telegramKey);
      sent++;
      await supabase
        .from('appointments')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', a.id);
    } catch (e) {
      failed++;
      console.error(`Reminder failed for appt ${a.id}:`, e);
    }
  }

  return { sent, failed };
}

// ============= BROADCAST =============

type BroadcastInput = {
  adminId: string;
  adminTelegramId: number;
  text: string;
  mediaIds?: string[]; // media_library.id ro'yxati (ixtiyoriy)
};

export async function runBroadcast(
  supabase: any,
  input: BroadcastInput,
  lovableKey: string,
  telegramKey: string,
): Promise<{ broadcastId: string; total: number; sent: number; failed: number }> {
  // 1) Broadcast yozuvini yaratamiz
  const { data: bc, error: bcErr } = await supabase
    .from('broadcasts')
    .insert({
      sent_by_admin_id: input.adminId,
      sent_by_telegram_id: input.adminTelegramId,
      message_text: input.text,
      status: 'sending',
    })
    .select('*')
    .single();

  if (bcErr) throw new Error(`Broadcast create failed: ${bcErr.message}`);

  // 2) Media biriktirish (ixtiyoriy)
  if (input.mediaIds && input.mediaIds.length > 0) {
    const rows = input.mediaIds.map((mid, idx) => ({
      entity_type: 'broadcast',
      entity_id: bc.id,
      media_id: mid,
      sort_order: idx,
    }));
    await supabase.from('media_attachments').insert(rows);
  }

  // 3) Media file_id'larini bir marta o'qib olamiz
  let mediaItems: Array<{ file_id: string; file_type: string }> = [];
  if (input.mediaIds && input.mediaIds.length > 0) {
    const { data: medias } = await supabase
      .from('media_library')
      .select('file_id, file_type')
      .in('id', input.mediaIds);
    mediaItems = (medias as any) ?? [];
  }

  // 4) Barcha bemorlarni olamiz
  const { data: patients } = await supabase
    .from('patients')
    .select('telegram_id');

  const total = patients?.length ?? 0;
  let sent = 0;
  let failed = 0;

  if (patients) {
    for (const p of patients) {
      try {
        // Birinchi: media (agar bor bo'lsa) — birinchi media uchun matn caption sifatida
        if (mediaItems.length > 0) {
          for (let i = 0; i < mediaItems.length; i++) {
            const m = mediaItems[i];
            const caption = i === 0 ? input.text : undefined;
            await sendMediaByType(p.telegram_id, m.file_type, m.file_id, { caption }, lovableKey, telegramKey);
            // Telegram rate limit: ~30 msg/sec. Mediada biroz pauza
            await new Promise((r) => setTimeout(r, 50));
          }
        } else {
          await sendMessage(p.telegram_id, input.text, {}, lovableKey, telegramKey);
        }
        sent++;
      } catch (e) {
        failed++;
        console.error(`Broadcast failed for ${p.telegram_id}:`, e);
      }
      // Asosiy throttle (har xabardan keyin)
      await new Promise((r) => setTimeout(r, 35));
    }
  }

  // 5) Yakuniy holat
  await supabase
    .from('broadcasts')
    .update({
      total_recipients: total,
      sent_count: sent,
      failed_count: failed,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', bc.id);

  return { broadcastId: bc.id, total, sent, failed };
}
