-- Drop old doctors table
DROP TABLE IF EXISTS public.doctors CASCADE;

-- Create staff position enum
CREATE TYPE public.staff_position AS ENUM (
  'registratura',
  'koordinator',
  'shifokor',
  'shifokor_yordamchisi',
  'hisobchi',
  'sterilizatsiya'
);

-- Create staff table
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  position public.staff_position NOT NULL,
  phone TEXT,
  photo_url TEXT,
  bio_uz TEXT,
  bio_ru TEXT,
  specialty_uz TEXT,
  specialty_ru TEXT,
  experience_years INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_position ON public.staff(position) WHERE is_active = true;
CREATE INDEX idx_staff_telegram_id ON public.staff(telegram_id);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Public can view active doctors only (for patient bot)
CREATE POLICY "Anyone can view active doctors"
ON public.staff
FOR SELECT
USING (is_active = true AND position = 'shifokor');

-- Update trigger
CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();