-- Appointments: vaqt va eslatma maydonlari
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS appointment_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_appointments_appointment_at
  ON public.appointments (appointment_at)
  WHERE appointment_at IS NOT NULL AND status IN ('new', 'confirmed');

-- Broadcasts jadvali
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by_admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  sent_by_telegram_id BIGINT NOT NULL,
  message_text TEXT NOT NULL,
  language_filter TEXT,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at ON public.broadcasts (created_at DESC);

-- Broadcast media biriktirish uchun media_attachments'dagi entity_type='broadcast' ishlatiladi
