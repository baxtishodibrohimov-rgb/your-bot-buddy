-- Xodim cheklistlari
CREATE TABLE public.staff_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_daily_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Har xodimda faqat 1 ta majburiy kunlik cheklist
CREATE UNIQUE INDEX uniq_daily_required_per_staff
  ON public.staff_checklists (staff_id)
  WHERE is_daily_required = true;

CREATE INDEX idx_staff_checklists_staff ON public.staff_checklists(staff_id);

-- Cheklist punktlari
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.staff_checklists(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_items_checklist ON public.checklist_items(checklist_id);

-- Bajarish hisoboti (kunlik)
CREATE TABLE public.checklist_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES public.staff_checklists(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tashkent')::date,
  is_done BOOLEAN NOT NULL DEFAULT false,
  marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (staff_id, item_id, completion_date)
);

CREATE INDEX idx_completions_staff_date ON public.checklist_completions(staff_id, completion_date);

-- Kunlik ish boshlash logi
CREATE TABLE public.staff_day_starts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tashkent')::date,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (staff_id, start_date)
);

CREATE INDEX idx_day_starts_staff_date ON public.staff_day_starts(staff_id, start_date);

-- RLS (bot service role orqali yozadi, public select yo'q)
ALTER TABLE public.staff_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_day_starts ENABLE ROW LEVEL SECURITY;

-- Triggers
CREATE TRIGGER update_staff_checklists_updated_at
BEFORE UPDATE ON public.staff_checklists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();