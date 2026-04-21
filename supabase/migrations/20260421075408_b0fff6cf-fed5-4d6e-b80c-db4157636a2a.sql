-- Qo'ng'iroq so'rovlari (call requests / qabul so'rovlari)
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Bot service role orqali ishlaydi, oddiy foydalanuvchilar to'g'ridan-to'g'ri kira olmaydi.
-- Hozircha hech qanday public policy yo'q.

CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_created_at ON public.appointments(created_at DESC);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();