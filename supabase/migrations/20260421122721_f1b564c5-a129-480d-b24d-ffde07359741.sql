-- Koordinatorlar (admin tomonidan tanlangan kuzatuvchi xodimlar)
CREATE TABLE public.coordinators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL UNIQUE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;

-- Cheklist tekshiruvi: xodim cheklistni to'ldirgandan keyin koordinator tekshiradi
CREATE TABLE public.checklist_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  checklist_id uuid NOT NULL REFERENCES public.staff_checklists(id) ON DELETE CASCADE,
  review_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Tashkent')::date,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  reviewed_by_coordinator_id uuid REFERENCES public.coordinators(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id, checklist_id, review_date)
);

ALTER TABLE public.checklist_reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_checklist_reviews_status ON public.checklist_reviews(status);
CREATE INDEX idx_checklist_reviews_staff_date ON public.checklist_reviews(staff_id, review_date);

CREATE TRIGGER trg_checklist_reviews_updated_at
BEFORE UPDATE ON public.checklist_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();