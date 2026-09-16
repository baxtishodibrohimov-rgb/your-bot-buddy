-- Phase 5 (part 1): manual case entry, "bulut" (pool) image upload, and
-- storage for manually-uploaded clinical images.
--
-- Context: Cliniccards is the only intake path so far (Phase 2). The clinic
-- also needs to open a case by hand for a patient who isn't in Cliniccards
-- yet. Manual cases go through the exact same tp_cases / status-machine /
-- audit-log path as a Cliniccards-synced case — they're only distinguished
-- by a synthetic 'MANUAL-...' cliniccards_patient_id/appointment_id and an
-- audit_log detail of `"source": "manual"`. No new patient/case table.
--
-- "Bulut" pool upload: a bulk upload no longer guesses which required-image
-- slot a file belongs to (there is no classifier — see the standing rule in
-- 20260907120000_tp_schema.sql not to invent clinical/business logic that
-- isn't real). Files land with image_type_id = NULL ("in the bulut") and
-- staff assign each one to a slot themselves. Assigning to an already-filled
-- slot returns the previous occupant to the bulut instead of deleting it.

-- ---------------------------------------------------------------------------
-- 1. Manual case creation
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tp_create_manual_case(
  p_full_name TEXT,
  p_birth_date DATE,
  p_phone TEXT,
  p_doctor_name TEXT,
  p_consultation_datetime TIMESTAMPTZ,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_patient_id TEXT := 'MANUAL-' || gen_random_uuid()::text;
  v_appointment_id TEXT := 'MANUAL-' || gen_random_uuid()::text;
  v_doctor_staff_id UUID;
  v_case_id UUID;
BEGIN
  IF NOT public.has_any_tp_role(v_actor) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;
  IF btrim(coalesce(p_full_name, '')) = '' THEN
    RAISE EXCEPTION 'Bemor F.I.SH majburiy';
  END IF;
  IF p_priority NOT IN ('low', 'normal', 'high', 'urgent') THEN
    RAISE EXCEPTION 'Noto''g''ri priority: %', p_priority;
  END IF;

  SELECT s.id INTO v_doctor_staff_id
  FROM public.staff s
  JOIN public.tp_staff_roles r ON r.staff_id = s.id AND r.role = 'doctor'::public.tp_role
  WHERE s.is_active = true AND lower(btrim(s.full_name)) = lower(btrim(coalesce(p_doctor_name, '')))
  LIMIT 1;

  INSERT INTO public.tp_cliniccards_patients (cliniccards_patient_id, full_name, birth_date, phone, raw_payload)
  VALUES (v_patient_id, btrim(p_full_name), p_birth_date, p_phone, jsonb_build_object('manual', true));

  INSERT INTO public.tp_cliniccards_appointments (
    cliniccards_appointment_id, cliniccards_patient_id, appointment_type_code,
    appointment_type_label, doctor_name, scheduled_at, raw_payload
  )
  VALUES (
    v_appointment_id, v_patient_id, 'manual', 'Qo''lda kiritilgan',
    p_doctor_name, p_consultation_datetime, jsonb_build_object('manual', true)
  );

  INSERT INTO public.tp_cases (
    cliniccards_patient_id, cliniccards_appointment_id, consultation_datetime, deadline,
    primary_doctor_staff_id, primary_doctor_name, status, priority
  )
  VALUES (
    v_patient_id, v_appointment_id, p_consultation_datetime, p_consultation_datetime - interval '24 hours',
    v_doctor_staff_id, p_doctor_name, 'WAITING_ASSIGNMENT'::public.tp_case_status, p_priority
  )
  RETURNING id INTO v_case_id;

  INSERT INTO public.tp_audit_log (case_id, actor_staff_id, actor_user_id, action, details)
  VALUES (
    v_case_id, public.tp_current_staff_id(v_actor), v_actor, 'case_created',
    jsonb_build_object('source', 'manual', 'full_name', p_full_name)
  );

  RETURN v_case_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Images progress: was only ever recomputed from the Cliniccards sync
--    Edge Function (recomputeImagesProgress in case-sync.ts). Manual/bulut
--    uploads and pool-assignment write tp_clinical_images directly from the
--    browser (RLS already allows it — see clinical_tables in the Phase 1
--    migration), so recompute needs to also happen on the DB side as a
--    trigger, not just from that one Edge Function code path.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tp_recompute_images_progress(p_case_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_required INT;
  v_have INT;
  v_percent INT;
  v_status public.tp_case_status;
BEGIN
  SELECT count(*) INTO v_required FROM public.tp_image_types WHERE is_active = true AND is_required = true;
  IF v_required = 0 THEN
    RETURN;
  END IF;

  SELECT count(DISTINCT it.id) INTO v_have
  FROM public.tp_image_types it
  JOIN public.tp_clinical_images ci ON ci.image_type_id = it.id AND ci.case_id = p_case_id
  WHERE it.is_active = true AND it.is_required = true;

  v_percent := round((v_have::numeric / v_required) * 100);

  UPDATE public.tp_cases SET images_progress_percent = v_percent WHERE id = p_case_id
  RETURNING status INTO v_status;

  IF v_percent = 100 AND v_status = 'ASSIGNED'::public.tp_case_status THEN
    UPDATE public.tp_cases SET status = 'IMAGES_READY'::public.tp_case_status WHERE id = p_case_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.tp_clinical_images_progress_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.tp_recompute_images_progress(OLD.case_id);
    RETURN OLD;
  ELSE
    PERFORM public.tp_recompute_images_progress(NEW.case_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_tp_clinical_images_progress ON public.tp_clinical_images;
CREATE TRIGGER trg_tp_clinical_images_progress
  AFTER INSERT OR DELETE OR UPDATE OF image_type_id ON public.tp_clinical_images
  FOR EACH ROW EXECUTE FUNCTION public.tp_clinical_images_progress_trigger();

-- ---------------------------------------------------------------------------
-- 3. "Bulut" pool -> slot assignment, atomically swapping any previous
--    occupant of that slot back into the pool instead of deleting it.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tp_assign_pool_image(
  p_case_id UUID,
  p_image_type_id UUID,
  p_pool_image_id UUID
)
RETURNS public.tp_clinical_images
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pool public.tp_clinical_images;
  v_existing public.tp_clinical_images;
BEGIN
  IF NOT public.has_any_tp_role(auth.uid()) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  SELECT * INTO v_pool FROM public.tp_clinical_images
  WHERE id = p_pool_image_id AND case_id = p_case_id
  FOR UPDATE;

  IF v_pool.id IS NULL THEN
    RAISE EXCEPTION 'Bulutda bunday rasm topilmadi';
  END IF;
  IF v_pool.image_type_id IS NOT NULL THEN
    RAISE EXCEPTION 'Bu rasm allaqachon boshqa joyga biriktirilgan';
  END IF;

  SELECT * INTO v_existing FROM public.tp_clinical_images
  WHERE case_id = p_case_id AND image_type_id = p_image_type_id
  FOR UPDATE;

  IF v_existing.id IS NOT NULL AND v_existing.id <> v_pool.id THEN
    UPDATE public.tp_clinical_images SET image_type_id = NULL WHERE id = v_existing.id;
  END IF;

  UPDATE public.tp_clinical_images SET image_type_id = p_image_type_id WHERE id = v_pool.id
  RETURNING * INTO v_pool;

  RETURN v_pool;
END;
$$;

-- Moves a slot's current image back to the pool without picking a
-- replacement (the "+ " control's old behavior needs this when a staff
-- member wants to clear a slot rather than replace it).
CREATE OR REPLACE FUNCTION public.tp_return_image_to_pool(p_case_id UUID, p_image_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_any_tp_role(auth.uid()) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  UPDATE public.tp_clinical_images SET image_type_id = NULL
  WHERE id = p_image_id AND case_id = p_case_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Dental chart: a global default so a case can be set to "child mode"
--    once (default_dentition = 'primary') and only the teeth that have
--    already erupted permanently need an explicit per-tooth override in
--    tp_tooth_status, rather than writing all 32 rows up front.
-- ---------------------------------------------------------------------------

ALTER TABLE public.tp_dental_charts
  ADD COLUMN IF NOT EXISTS default_dentition TEXT NOT NULL DEFAULT 'permanent'
    CHECK (default_dentition IN ('permanent', 'primary'));

-- Manually-uploaded images need a filename/content-type for the pool tray and
-- for serving the right Content-Type back out of Storage; Cliniccards-sourced
-- rows (source = 'cliniccards') never populate these.
ALTER TABLE public.tp_clinical_images
  ADD COLUMN IF NOT EXISTS original_filename TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- ---------------------------------------------------------------------------
-- 5. Storage bucket for manually-uploaded clinical images (Cliniccards-
--    sourced images stay reference-only via external_url, per Phase 1 —
--    this bucket is only ever written to by the manual-upload path).
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('tp-clinical-images', 'tp-clinical-images', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "TP roles can read clinical image files" ON storage.objects;
CREATE POLICY "TP roles can read clinical image files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'tp-clinical-images' AND public.has_any_tp_role(auth.uid()));

DROP POLICY IF EXISTS "TP roles can upload clinical image files" ON storage.objects;
CREATE POLICY "TP roles can upload clinical image files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tp-clinical-images' AND public.has_any_tp_role(auth.uid()));

DROP POLICY IF EXISTS "TP roles can update clinical image files" ON storage.objects;
CREATE POLICY "TP roles can update clinical image files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'tp-clinical-images' AND public.has_any_tp_role(auth.uid()))
  WITH CHECK (bucket_id = 'tp-clinical-images' AND public.has_any_tp_role(auth.uid()));

DROP POLICY IF EXISTS "TP roles can delete clinical image files" ON storage.objects;
CREATE POLICY "TP roles can delete clinical image files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'tp-clinical-images' AND public.has_any_tp_role(auth.uid()));
