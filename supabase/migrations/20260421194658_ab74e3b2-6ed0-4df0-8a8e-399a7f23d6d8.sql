-- 1. Rezidenturaga ruxsat berilgan foydalanuvchilar
CREATE TABLE public.residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT NOT NULL UNIQUE,
  full_name TEXT,
  added_by_admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  added_by_telegram_id BIGINT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_residents_telegram_id ON public.residents(telegram_id);

-- 2. Bo'limlar daraxti (cheksiz chuqurlik)
CREATE TABLE public.resident_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.resident_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_root BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resident_sections_parent ON public.resident_sections(parent_id);

CREATE TRIGGER trg_resident_sections_updated
  BEFORE UPDATE ON public.resident_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Bo'limga biriktirilgan media/fayllar
CREATE TABLE public.resident_section_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.resident_sections(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES public.media_library(id) ON DELETE CASCADE,
  caption_override TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resident_section_media_section ON public.resident_section_media(section_id);

-- 4. Testlar (variantlar JSON: [{text, is_correct}])
CREATE TABLE public.resident_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.resident_sections(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resident_tests_section ON public.resident_tests(section_id);

CREATE TRIGGER trg_resident_tests_updated
  BEFORE UPDATE ON public.resident_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Test natijalari
CREATE TABLE public.resident_test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  resident_telegram_id BIGINT NOT NULL,
  section_id UUID NOT NULL REFERENCES public.resident_sections(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.resident_tests(id) ON DELETE CASCADE,
  selected_option_index INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_test_attempts_resident ON public.resident_test_attempts(resident_id);
CREATE INDEX idx_test_attempts_section ON public.resident_test_attempts(section_id);

-- RLS yoqish (bot service role orqali ishlaydi, public access yo'q)
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_section_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_test_attempts ENABLE ROW LEVEL SECURITY;

-- 4 ta asosiy bo'limni yaratish
INSERT INTO public.resident_sections (title, sort_order, is_root) VALUES
  ('Umumiy tushunchalar', 1, true),
  ('Diagnostika', 2, true),
  ('Davolash', 3, true),
  ('Kutubxona', 4, true);