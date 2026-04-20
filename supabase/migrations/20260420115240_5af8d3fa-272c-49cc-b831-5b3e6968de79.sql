
-- Klinika ma'lumotlari (singleton — bitta klinika)
CREATE TABLE public.clinic_info (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name_uz TEXT NOT NULL DEFAULT 'Biodent',
  name_ru TEXT NOT NULL DEFAULT 'Biodent',
  about_uz TEXT NOT NULL DEFAULT 'Biodent — zamonaviy stomatologiya klinikasi.',
  about_ru TEXT NOT NULL DEFAULT 'Biodent — современная стоматологическая клиника.',
  address_uz TEXT NOT NULL DEFAULT 'Manzil keyinroq qo''shiladi',
  address_ru TEXT NOT NULL DEFAULT 'Адрес будет добавлен позже',
  phone TEXT NOT NULL DEFAULT '+998 00 000 00 00',
  working_hours_uz TEXT NOT NULL DEFAULT 'Du-Sha: 9:00 - 19:00',
  working_hours_ru TEXT NOT NULL DEFAULT 'Пн-Сб: 9:00 - 19:00',
  location_url TEXT,
  instagram TEXT,
  telegram_channel TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.clinic_info (id) VALUES (1);

-- Xizmatlar
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_uz TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_uz TEXT,
  description_ru TEXT,
  price_from NUMERIC,
  price_to NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shifokorlar
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  specialty_uz TEXT NOT NULL,
  specialty_ru TEXT NOT NULL,
  experience_years INT,
  bio_uz TEXT,
  bio_ru TEXT,
  photo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bemorlar (Telegram foydalanuvchilari)
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL UNIQUE,
  telegram_username TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  language TEXT NOT NULL DEFAULT 'uz' CHECK (language IN ('uz', 'ru')),
  state TEXT,
  state_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_patients_telegram_id ON public.patients(telegram_id);

-- Tibbiy kartalar
CREATE TABLE public.medical_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  full_name TEXT,
  birth_date DATE,
  gender TEXT,
  address TEXT,
  allergies TEXT,
  chronic_diseases TEXT,
  current_medications TEXT,
  previous_treatments TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medical_cards_patient_id ON public.medical_cards(patient_id);

-- Shikoyatlar va takliflar
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'complaint' CHECK (type IN ('complaint', 'suggestion')),
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adminlar
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL UNIQUE,
  full_name TEXT,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.admins (telegram_id, full_name, is_super_admin) 
VALUES (527846754, 'Super Admin', true);

-- Bot polling holati
CREATE TABLE public.telegram_bot_state (
  id INT PRIMARY KEY CHECK (id = 1),
  update_offset BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.telegram_bot_state (id, update_offset) VALUES (1, 0);

-- Kelgan xom xabarlar (debug uchun)
CREATE TABLE public.telegram_messages (
  update_id BIGINT PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  text TEXT,
  raw_update JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_telegram_messages_chat_id ON public.telegram_messages(chat_id);

-- updated_at trigger funksiyasi
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clinic_info_updated_at BEFORE UPDATE ON public.clinic_info FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medical_cards_updated_at BEFORE UPDATE ON public.medical_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.clinic_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;

-- Publik o'qish (hamma ko'ra oladi)
CREATE POLICY "Anyone can view clinic info" ON public.clinic_info FOR SELECT USING (true);
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can view active doctors" ON public.doctors FOR SELECT USING (is_active = true);

-- Maxfiy jadvallar — hech kim client orqali ko'ra olmaydi (faqat service role / edge functions)
-- patients, medical_cards, complaints, admins, telegram_* — RLS yoqilgan, lekin policy yo'q = block all client access
