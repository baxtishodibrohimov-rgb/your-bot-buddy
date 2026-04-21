-- Media kutubxonasi: admin yuklagan barcha media (rasm, video, hujjat)
CREATE TABLE public.media_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uploaded_by_admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
  uploaded_by_telegram_id BIGINT NOT NULL,
  file_id TEXT NOT NULL,             -- Telegram file_id (qayta yuborish uchun)
  file_unique_id TEXT,               -- Telegram file_unique_id (deduplikatsiya)
  file_type TEXT NOT NULL,           -- 'photo' | 'video' | 'document' | 'audio' | 'voice' | 'animation'
  mime_type TEXT,
  file_size BIGINT,
  file_name TEXT,                    -- hujjat uchun original ism
  caption TEXT,                      -- admin qo'shgan izoh (ixtiyoriy)
  width INTEGER,                     -- rasm/video uchun
  height INTEGER,
  duration INTEGER,                  -- video/audio uchun (sekund)
  thumbnail_file_id TEXT,            -- video/document uchun preview
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_library_admin ON public.media_library(uploaded_by_admin_id);
CREATE INDEX idx_media_library_type ON public.media_library(file_type);
CREATE INDEX idx_media_library_created ON public.media_library(created_at DESC);

-- Media biriktirmalari: bir media bir nechta entity'ga biriktirilishi mumkin
CREATE TABLE public.media_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID NOT NULL REFERENCES public.media_library(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,         -- 'doctor' | 'service' | 'clinic' | 'broadcast'
  entity_id TEXT,                    -- UUID matn ko'rinishida (clinic uchun NULL)
  caption_override TEXT,             -- shu kontekstda boshqa caption
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(media_id, entity_type, entity_id)
);

CREATE INDEX idx_media_attachments_entity ON public.media_attachments(entity_type, entity_id);
CREATE INDEX idx_media_attachments_media ON public.media_attachments(media_id);

-- RLS: bot service_role bilan ishlaydi, jamoatchilik uchun ochiq emas
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_attachments ENABLE ROW LEVEL SECURITY;

-- Hech qanday public policy — faqat service_role (bot) ishlaydi