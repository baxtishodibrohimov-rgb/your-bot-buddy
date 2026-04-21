// Statistika moduli — bemor/appointment/shikoyat/broadcast bo'yicha
import { t, type Lang } from './i18n.ts';

export type Period = 'today' | 'week' | 'month' | 'all';

export function periodRange(period: Period): { from: string | null; label: { uz: string; ru: string } } {
  const now = new Date();
  if (period === 'all') {
    return { from: null, label: { uz: 'Jami (umumiy)', ru: 'Всего' } };
  }
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (period === 'today') {
    return { from: d.toISOString(), label: { uz: 'Bugun', ru: 'Сегодня' } };
  }
  if (period === 'week') {
    d.setDate(d.getDate() - 7);
    return { from: d.toISOString(), label: { uz: 'So\'nggi 7 kun', ru: 'Последние 7 дней' } };
  }
  // month
  d.setDate(d.getDate() - 30);
  return { from: d.toISOString(), label: { uz: 'So\'nggi 30 kun', ru: 'Последние 30 дней' } };
}

async function countWithRange(
  supabase: any,
  table: string,
  from: string | null,
  extra?: (q: any) => any,
): Promise<number> {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  if (from) q = q.gte('created_at', from);
  if (extra) q = extra(q);
  const { count } = await q;
  return count ?? 0;
}

export async function buildStatsReport(
  supabase: any,
  period: Period,
  lang: Lang,
): Promise<string> {
  const { from, label } = periodRange(period);
  const periodLabel = label[lang];

  // Parallel so'rovlar
  const [
    patientsTotal,
    patientsUz,
    patientsRu,
    apptNew,
    apptCalled,
    apptDone,
    apptCancelled,
    complaintsNew,
    complaintsResolved,
    complaintsTotal,
    bcCount,
    bcStats,
  ] = await Promise.all([
    // Bemorlar
    countWithRange(supabase, 'patients', from),
    countWithRange(supabase, 'patients', from, (q: any) => q.eq('language', 'uz')),
    countWithRange(supabase, 'patients', from, (q: any) => q.eq('language', 'ru')),
    // Appointments
    countWithRange(supabase, 'appointments', from, (q: any) => q.eq('status', 'new')),
    countWithRange(supabase, 'appointments', from, (q: any) => q.eq('status', 'called')),
    countWithRange(supabase, 'appointments', from, (q: any) => q.eq('status', 'done')),
    countWithRange(supabase, 'appointments', from, (q: any) => q.eq('status', 'cancelled')),
    // Shikoyatlar
    countWithRange(supabase, 'complaints', from, (q: any) => q.eq('status', 'new')),
    countWithRange(supabase, 'complaints', from, (q: any) => q.eq('status', 'resolved')),
    countWithRange(supabase, 'complaints', from),
    // Broadcastlar
    countWithRange(supabase, 'broadcasts', from),
    // Broadcast natijalarining yig'indisi
    (async () => {
      let q = supabase.from('broadcasts').select('total_recipients, sent_count, failed_count');
      if (from) q = q.gte('created_at', from);
      const { data } = await q;
      let total = 0, sent = 0, failed = 0;
      for (const b of (data ?? [])) {
        total += b.total_recipients ?? 0;
        sent += b.sent_count ?? 0;
        failed += b.failed_count ?? 0;
      }
      return { total, sent, failed };
    })(),
  ]);

  const apptTotal = apptNew + apptCalled + apptDone + apptCancelled;

  let text = `📊 <b>${t.statsTitle2[lang]}</b>\n`;
  text += `<i>${t.statsPeriod[lang]}: ${periodLabel}</i>\n\n`;

  // Bemorlar bloki
  text += `👥 <b>${t.statsSecPatients[lang]}</b>\n`;
  text += `   ${t.statsNewPatients[lang]}: <b>${patientsTotal}</b>\n`;
  text += `   🇺🇿 UZ: <b>${patientsUz}</b>   🇷🇺 RU: <b>${patientsRu}</b>\n\n`;

  // Appointmentlar bloki
  text += `📅 <b>${t.statsSecAppts[lang]}</b>\n`;
  text += `   ${t.statsApptTotal[lang]}: <b>${apptTotal}</b>\n`;
  text += `   🆕 ${t.apptStatusName.new[lang]}: <b>${apptNew}</b>\n`;
  text += `   📞 ${t.apptStatusName.called[lang]}: <b>${apptCalled}</b>\n`;
  text += `   ✅ ${t.apptStatusName.done[lang]}: <b>${apptDone}</b>\n`;
  text += `   ❌ ${t.apptStatusName.cancelled[lang]}: <b>${apptCancelled}</b>\n\n`;

  // Shikoyatlar bloki
  text += `✉️ <b>${t.statsSecComplaints[lang]}</b>\n`;
  text += `   ${t.statsCmpTotal[lang]}: <b>${complaintsTotal}</b>\n`;
  text += `   🆕 ${t.statsCmpNew[lang]}: <b>${complaintsNew}</b>\n`;
  text += `   ✅ ${t.statsCmpResolved[lang]}: <b>${complaintsResolved}</b>\n\n`;

  // Broadcast bloki
  text += `📢 <b>${t.statsSecBroadcast[lang]}</b>\n`;
  text += `   ${t.statsBcCount[lang]}: <b>${bcCount}</b>\n`;
  if (bcStats.total > 0) {
    const successRate = Math.round((bcStats.sent / bcStats.total) * 100);
    text += `   ${t.statsBcRecipients[lang]}: <b>${bcStats.total}</b>\n`;
    text += `   ✅ ${t.statsBcSent[lang]}: <b>${bcStats.sent}</b> (${successRate}%)\n`;
    if (bcStats.failed > 0) {
      text += `   ❌ ${t.statsBcFailed[lang]}: <b>${bcStats.failed}</b>\n`;
    }
  }

  return text;
}
