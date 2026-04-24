
-- 1) admins jadvaliga user_id ustuni
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE;

-- 2) Admin tekshirish funksiyasi (security definer — RLS recursionni oldini oladi)
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = _user_id
  )
$$;

-- 3) RLS yoqish va admin policy'lar
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'admins','patients','medical_cards','appointments','complaints',
    'staff','staff_checklists','checklist_items','checklist_completions','checklist_reviews','staff_day_starts',
    'lab_orders','lab_workers','lab_doctors','lab_appliance_types','lab_order_media',
    'residents','resident_sections','resident_tests','resident_test_attempts','resident_section_media',
    'services','clinic_info','broadcasts','media_library','media_attachments',
    'telegram_messages','telegram_bot_state'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins full access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Admins full access" ON public.%I FOR ALL TO authenticated USING (public.has_admin_role(auth.uid())) WITH CHECK (public.has_admin_role(auth.uid()))',
      t
    );
  END LOOP;
END $$;
