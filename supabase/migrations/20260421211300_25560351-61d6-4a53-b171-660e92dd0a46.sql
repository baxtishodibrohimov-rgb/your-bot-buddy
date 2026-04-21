-- ============= LABORATORIYA MODULI =============

-- 1) Lab xodimlari (alohida jadval, staff bilan aloqasi yo'q — admin bevosita boshqaradi)
CREATE TABLE public.lab_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL UNIQUE,
  full_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  added_by_admin_id uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  added_by_telegram_id bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lab_workers ENABLE ROW LEVEL SECURITY;

-- 2) Apparat nomlari (Twin block, MARPE, Nakladka, Face maska...) — admin boshqaradi
CREATE TABLE public.lab_appliance_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lab_appliance_types ENABLE ROW LEVEL SECURITY;

-- 3) Shifokorlar ro'yxati lab uchun (admin boshqaradi) — staff bilan bog'liq emas
CREATE TABLE public.lab_doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lab_doctors ENABLE ROW LEVEL SECURITY;

-- 4) Lab buyurtmalar (apparatlar)
CREATE TABLE public.lab_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_full_name text NOT NULL,
  appliance_type_id uuid REFERENCES public.lab_appliance_types(id) ON DELETE SET NULL,
  appliance_name text NOT NULL,
  doctor_id uuid REFERENCES public.lab_doctors(id) ON DELETE SET NULL,
  doctor_name text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'new',  -- new | in_progress | done | rejected
  ready_due_date date,
  created_by_coord_staff_id uuid,  -- staff.id (koordinator)
  created_by_telegram_id bigint NOT NULL,
  accepted_by_lab_worker_id uuid REFERENCES public.lab_workers(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  completed_at timestamptz,
  reject_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lab_orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_lab_orders_status ON public.lab_orders(status, created_at DESC);

CREATE TRIGGER trg_lab_orders_updated
  BEFORE UPDATE ON public.lab_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Lab buyurtma media biriktirmalari (3D rentgen, skaner, qo'shimcha izoh media)
-- kind: 'xray3d' | 'scanner' | 'note'
CREATE TABLE public.lab_order_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.lab_orders(id) ON DELETE CASCADE,
  media_id uuid NOT NULL REFERENCES public.media_library(id) ON DELETE CASCADE,
  kind text NOT NULL,
  caption_override text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lab_order_media ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_lab_order_media_order ON public.lab_order_media(order_id, kind, sort_order);

-- Boshlang'ich apparat nomlari va shifokorlar (foydalanuvchi misol bergan)
INSERT INTO public.lab_appliance_types (name, sort_order) VALUES
  ('Twin block', 1),
  ('MARPE', 2),
  ('Nakladka', 3),
  ('Face maska', 4);

INSERT INTO public.lab_doctors (full_name, sort_order) VALUES
  ('Ahrorxon Sobirov', 1),
  ('Abdullatif Rasuljonov', 2);