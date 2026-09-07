-- =====================================================================================
-- TREATMENT PLAN MANAGER — core schema (Phase 1)
--
-- All new objects for this module are prefixed `tp_` to keep them clearly separated
-- from the existing Biodent reception/bot schema (patients, staff, appointments, ...).
-- See /ARCHITECTURE.md for the full data-model rationale and the phase plan.
--
-- Design rules followed here (do not violate in later migrations):
--   * No clinical taxonomy is hardcoded (finding categories, checklist questions,
--     severities are free text / configured via tp_analysis_templates).
--   * Every case-affecting write is idempotent-safe (unique keys on external ids).
--   * Status changes go through a state-machine table (tp_case_status_transitions).
--   * Nothing here stores Cliniccards API secrets — those live only in Supabase
--     Edge Function secrets (see supabase/functions/_shared/cliniccards).
-- =====================================================================================

-- ---------------------------------------------------------------------------
-- 1. Roles on top of the existing `staff` table
-- ---------------------------------------------------------------------------

-- SUPER_ADMIN / ADMIN continue to be represented by the existing public.admins
-- table (admins.is_super_admin distinguishes the two). PLANNER / DOCTOR / CONSULTANT
-- are module-specific roles assigned to rows in public.staff.
CREATE TYPE public.tp_role AS ENUM ('planner', 'doctor', 'consultant');

ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS max_workload INT;

CREATE TABLE public.tp_staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  role public.tp_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (staff_id, role)
);

CREATE INDEX idx_tp_staff_roles_staff ON public.tp_staff_roles(staff_id);
CREATE INDEX idx_tp_staff_roles_role ON public.tp_staff_roles(role);

-- Security-definer helpers (avoid RLS recursion, mirrors public.has_admin_role)
CREATE OR REPLACE FUNCTION public.has_tp_role(_user_id UUID, _role public.tp_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_admin_role(_user_id) OR EXISTS (
    SELECT 1 FROM public.staff s
    JOIN public.tp_staff_roles r ON r.staff_id = s.id
    WHERE s.user_id = _user_id AND s.is_active = true AND r.role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_any_tp_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.has_admin_role(_user_id) OR EXISTS (
    SELECT 1 FROM public.staff s
    JOIN public.tp_staff_roles r ON r.staff_id = s.id
    WHERE s.user_id = _user_id AND s.is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION public.tp_current_staff_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.staff WHERE user_id = _user_id LIMIT 1
$$;

-- ---------------------------------------------------------------------------
-- 2. Cliniccards cache tables (populated by the sync/webhook edge functions)
-- ---------------------------------------------------------------------------

CREATE TABLE public.tp_cliniccards_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliniccards_patient_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  birth_date DATE,
  phone TEXT,
  raw_payload JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.tp_cliniccards_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliniccards_appointment_id TEXT NOT NULL UNIQUE,
  cliniccards_patient_id TEXT NOT NULL REFERENCES public.tp_cliniccards_patients(cliniccards_patient_id) ON DELETE CASCADE,
  appointment_type_code TEXT,
  appointment_type_label TEXT,
  doctor_name TEXT,
  scheduled_at TIMESTAMPTZ,
  raw_payload JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tp_cc_appt_patient ON public.tp_cliniccards_appointments(cliniccards_patient_id);
CREATE INDEX idx_tp_cc_appt_scheduled ON public.tp_cliniccards_appointments(scheduled_at);

-- ---------------------------------------------------------------------------
-- 3. TreatmentPlanCase + state machine
-- ---------------------------------------------------------------------------

CREATE TYPE public.tp_case_status AS ENUM (
  'NEW',
  'WAITING_ASSIGNMENT',
  'ASSIGNED',
  'IMAGES_READY',
  'ANALYSIS_IN_PROGRESS',
  'PLAN_IN_PROGRESS',
  'REVIEW_REQUIRED',
  'READY',
  'CONSULTATION_COMPLETED',
  'OVERDUE'
);

CREATE TABLE public.tp_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliniccards_patient_id TEXT NOT NULL REFERENCES public.tp_cliniccards_patients(cliniccards_patient_id),
  cliniccards_appointment_id TEXT NOT NULL UNIQUE REFERENCES public.tp_cliniccards_appointments(cliniccards_appointment_id),
  consultation_datetime TIMESTAMPTZ,
  primary_doctor_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  primary_doctor_name TEXT,
  responsible_planner_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  status public.tp_case_status NOT NULL DEFAULT 'NEW',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  deadline TIMESTAMPTZ,
  images_progress_percent INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tp_cases_status ON public.tp_cases(status);
CREATE INDEX idx_tp_cases_planner ON public.tp_cases(responsible_planner_staff_id);
CREATE INDEX idx_tp_cases_consultation ON public.tp_cases(consultation_datetime);
CREATE INDEX idx_tp_cases_patient ON public.tp_cases(cliniccards_patient_id);

CREATE TRIGGER update_tp_cases_updated_at BEFORE UPDATE ON public.tp_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Allowed status transitions (the "state machine"). Any UPDATE that changes
-- tp_cases.status to a value not listed here for the current status is rejected.
CREATE TABLE public.tp_case_status_transitions (
  from_status public.tp_case_status NOT NULL,
  to_status public.tp_case_status NOT NULL,
  PRIMARY KEY (from_status, to_status)
);

INSERT INTO public.tp_case_status_transitions (from_status, to_status) VALUES
  ('NEW', 'WAITING_ASSIGNMENT'),
  ('NEW', 'ASSIGNED'),
  ('NEW', 'OVERDUE'),
  ('WAITING_ASSIGNMENT', 'ASSIGNED'),
  ('WAITING_ASSIGNMENT', 'OVERDUE'),
  ('ASSIGNED', 'IMAGES_READY'),
  ('ASSIGNED', 'OVERDUE'),
  ('IMAGES_READY', 'ANALYSIS_IN_PROGRESS'),
  ('IMAGES_READY', 'OVERDUE'),
  ('ANALYSIS_IN_PROGRESS', 'PLAN_IN_PROGRESS'),
  ('ANALYSIS_IN_PROGRESS', 'OVERDUE'),
  ('PLAN_IN_PROGRESS', 'REVIEW_REQUIRED'),
  ('PLAN_IN_PROGRESS', 'OVERDUE'),
  ('REVIEW_REQUIRED', 'PLAN_IN_PROGRESS'),
  ('REVIEW_REQUIRED', 'READY'),
  ('REVIEW_REQUIRED', 'OVERDUE'),
  ('READY', 'CONSULTATION_COMPLETED'),
  ('OVERDUE', 'ASSIGNED'),
  ('OVERDUE', 'IMAGES_READY'),
  ('OVERDUE', 'ANALYSIS_IN_PROGRESS'),
  ('OVERDUE', 'PLAN_IN_PROGRESS'),
  ('OVERDUE', 'REVIEW_REQUIRED'),
  ('OVERDUE', 'READY');

-- SECURITY DEFINER: the trigger must be able to read tp_case_status_transitions
-- regardless of the caller's role, since that reference table is admin-only for
-- direct client access (see RLS section below).
CREATE OR REPLACE FUNCTION public.tp_check_case_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.tp_case_status_transitions
      WHERE from_status = OLD.status AND to_status = NEW.status
    ) THEN
      RAISE EXCEPTION 'Invalid tp_cases status transition: % -> %', OLD.status, NEW.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tp_cases_status_transition
  BEFORE UPDATE ON public.tp_cases
  FOR EACH ROW EXECUTE FUNCTION public.tp_check_case_status_transition();

-- ---------------------------------------------------------------------------
-- 4. Image types + clinical images
-- ---------------------------------------------------------------------------

CREATE TYPE public.tp_image_category AS ENUM ('extraoral', 'intraoral', 'radiology');

CREATE TABLE public.tp_image_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  category public.tp_image_category NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_tp_image_types_updated_at BEFORE UPDATE ON public.tp_image_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.tp_image_types (code, label, category, is_required, sort_order) VALUES
  ('face_frontal', 'Face frontal', 'extraoral', true, 1),
  ('face_frontal_smile', 'Face frontal smile', 'extraoral', true, 2),
  ('face_profile_right', 'Face profile right', 'extraoral', true, 3),
  ('face_profile_left', 'Face profile left', 'extraoral', true, 4),
  ('face_three_quarter', '3/4 view', 'extraoral', false, 5),
  ('intraoral_frontal', 'Intraoral frontal', 'intraoral', true, 6),
  ('intraoral_right_buccal', 'Right buccal', 'intraoral', true, 7),
  ('intraoral_left_buccal', 'Left buccal', 'intraoral', true, 8),
  ('intraoral_upper_occlusal', 'Upper occlusal', 'intraoral', true, 9),
  ('intraoral_lower_occlusal', 'Lower occlusal', 'intraoral', true, 10),
  ('opg_panoramic', 'OPG / panoramic', 'radiology', true, 11),
  ('lateral_cephalogram', 'Lateral cephalogram', 'radiology', true, 12);

CREATE TABLE public.tp_clinical_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.tp_cases(id) ON DELETE CASCADE,
  image_type_id UUID REFERENCES public.tp_image_types(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'cliniccards' CHECK (source IN ('cliniccards', 'upload')),
  cliniccards_document_id TEXT,
  external_url TEXT,
  storage_path TEXT,
  captured_at TIMESTAMPTZ,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tp_images_case ON public.tp_clinical_images(case_id);
CREATE INDEX idx_tp_images_type ON public.tp_clinical_images(image_type_id);
-- Plain (non-partial) unique constraint: standard SQL NULL semantics already
-- allow multiple NULL cliniccards_document_id rows (e.g. manually uploaded
-- images have no external id), and a plain constraint is required for
-- supabase-js `.upsert(..., { onConflict: "case_id,cliniccards_document_id" })`
-- to be able to target it.
ALTER TABLE public.tp_clinical_images
  ADD CONSTRAINT uniq_tp_images_case_doc UNIQUE (case_id, cliniccards_document_id);

-- ---------------------------------------------------------------------------
-- 5. Flexible clinical template engine (section 14 of the spec — do NOT
--    hardcode clinical rules here; this table is populated by the admin /
--    a future import of the clinical manual, phase 12)
-- ---------------------------------------------------------------------------

CREATE TABLE public.tp_analysis_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  image_type_id UUID REFERENCES public.tp_image_types(id) ON DELETE CASCADE,
  category TEXT,
  question TEXT NOT NULL,
  answer_type TEXT NOT NULL CHECK (answer_type IN ('single_choice', 'multi_choice', 'boolean', 'text', 'measurement')),
  options JSONB NOT NULL DEFAULT '[]',
  measurement_required BOOLEAN NOT NULL DEFAULT false,
  annotation_required BOOLEAN NOT NULL DEFAULT false,
  severity TEXT,
  clinical_priority INT,
  presentation_text_template TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tp_templates_image_type ON public.tp_analysis_templates(image_type_id) WHERE active = true;

CREATE TRIGGER update_tp_analysis_templates_updated_at BEFORE UPDATE ON public.tp_analysis_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tp_analysis_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.tp_cases(id) ON DELETE CASCADE,
  image_id UUID REFERENCES public.tp_clinical_images(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.tp_analysis_templates(id) ON DELETE SET NULL,
  answer_value JSONB,
  measurement_value JSONB,
  note TEXT,
  answered_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  answered_at TIMESTAMPTZ,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tp_answers_case ON public.tp_analysis_answers(case_id);
CREATE INDEX idx_tp_answers_image ON public.tp_analysis_answers(image_id);

CREATE TRIGGER update_tp_analysis_answers_updated_at BEFORE UPDATE ON public.tp_analysis_answers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tp_image_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES public.tp_clinical_images(id) ON DELETE CASCADE,
  annotation_json JSONB NOT NULL DEFAULT '[]',
  version INT NOT NULL DEFAULT 1,
  created_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tp_annotations_image ON public.tp_image_annotations(image_id);

CREATE TRIGGER update_tp_image_annotations_updated_at BEFORE UPDATE ON public.tp_image_annotations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 6. Master problem list, dental chart, treatment plan builder, review
-- ---------------------------------------------------------------------------

CREATE TABLE public.tp_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.tp_cases(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT,
  priority INT,
  source_image_id UUID REFERENCES public.tp_clinical_images(id) ON DELETE SET NULL,
  source_answer_id UUID REFERENCES public.tp_analysis_answers(id) ON DELETE SET NULL,
  doctor_note TEXT,
  is_confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tp_findings_case ON public.tp_findings(case_id);

CREATE TRIGGER update_tp_findings_updated_at BEFORE UPDATE ON public.tp_findings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tp_dental_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL UNIQUE REFERENCES public.tp_cases(id) ON DELETE CASCADE,
  numbering_system TEXT NOT NULL DEFAULT 'FDI',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_tp_dental_charts_updated_at BEFORE UPDATE ON public.tp_dental_charts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- tooth status values are intentionally free text (present/missing/permanent/
-- deciduous/unerupted/impacted/other/...) — kept flexible per section 18.
CREATE TABLE public.tp_tooth_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dental_chart_id UUID NOT NULL REFERENCES public.tp_dental_charts(id) ON DELETE CASCADE,
  tooth_code TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dental_chart_id, tooth_code)
);

CREATE TRIGGER update_tp_tooth_status_updated_at BEFORE UPDATE ON public.tp_tooth_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tp_treatment_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.tp_cases(id) ON DELETE CASCADE,
  finding_id UUID REFERENCES public.tp_findings(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  priority INT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tp_problems_case ON public.tp_treatment_problems(case_id);

CREATE TRIGGER update_tp_treatment_problems_updated_at BEFORE UPDATE ON public.tp_treatment_problems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tp_treatment_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID NOT NULL REFERENCES public.tp_treatment_problems(id) ON DELETE CASCADE,
  objective_text TEXT NOT NULL,
  proposed_action TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tp_objectives_problem ON public.tp_treatment_objectives(problem_id);

CREATE TRIGGER update_tp_treatment_objectives_updated_at BEFORE UPDATE ON public.tp_treatment_objectives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tp_treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.tp_cases(id) ON DELETE CASCADE,
  plan_label TEXT NOT NULL DEFAULT 'A',
  content JSONB,
  is_final BOOLEAN NOT NULL DEFAULT false,
  created_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tp_plans_case ON public.tp_treatment_plans(case_id);

CREATE TRIGGER update_tp_treatment_plans_updated_at BEFORE UPDATE ON public.tp_treatment_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tp_treatment_plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.tp_treatment_plans(id) ON DELETE CASCADE,
  version_no INT NOT NULL,
  snapshot JSONB NOT NULL,
  created_by_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, version_no)
);

CREATE TABLE public.tp_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.tp_cases(id) ON DELETE CASCADE,
  plan_version_id UUID REFERENCES public.tp_treatment_plan_versions(id) ON DELETE SET NULL,
  reviewer_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  decision TEXT CHECK (decision IN ('approve', 'revision_required')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tp_reviews_case ON public.tp_reviews(case_id);

CREATE TABLE public.tp_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.tp_cases(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('pptx', 'pdf')),
  storage_path TEXT,
  template_version TEXT,
  generated_by TEXT NOT NULL DEFAULT 'system',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tp_presentations_case ON public.tp_presentations(case_id);

-- ---------------------------------------------------------------------------
-- 7. Notifications (outbox), reminder rules, audit log, sync log, config
-- ---------------------------------------------------------------------------

CREATE TABLE public.tp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.tp_cases(id) ON DELETE CASCADE,
  recipient_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'telegram',
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_tp_notifications_status ON public.tp_notifications(status, created_at);
CREATE INDEX idx_tp_notifications_case ON public.tp_notifications(case_id);

CREATE TABLE public.tp_reminder_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('on_assignment', 'before_consultation', 'after_deadline')),
  offset_minutes INT,
  notify_roles TEXT[] NOT NULL DEFAULT ARRAY['planner'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_tp_reminder_rules_updated_at BEFORE UPDATE ON public.tp_reminder_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.tp_reminder_rules (name, trigger_type, offset_minutes, notify_roles, sort_order) VALUES
  ('Case biriktirilganda', 'on_assignment', NULL, ARRAY['planner'], 1),
  ('Konsultatsiyaga 24 soat qolganda', 'before_consultation', 1440, ARRAY['planner'], 2),
  ('Konsultatsiyaga 12 soat qolganda', 'before_consultation', 720, ARRAY['planner'], 3),
  ('Konsultatsiyaga 6 soat qolganda', 'before_consultation', 360, ARRAY['planner'], 4),
  ('Konsultatsiyaga 2 soat qolganda', 'before_consultation', 120, ARRAY['planner'], 5),
  ('Deadline o''tganda (OVERDUE)', 'after_deadline', 0, ARRAY['planner', 'admin', 'doctor'], 6);

CREATE TABLE public.tp_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.tp_cases(id) ON DELETE CASCADE,
  actor_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  actor_user_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tp_audit_case ON public.tp_audit_log(case_id, created_at);

CREATE TABLE public.tp_integration_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'cliniccards',
  sync_type TEXT NOT NULL CHECK (sync_type IN ('poll', 'webhook', 'manual')),
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'error')),
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  records_seen INT NOT NULL DEFAULT 0,
  cases_created INT NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tp_sync_log_created ON public.tp_integration_sync_log(created_at DESC);

-- Assignment algorithm configuration (section 5) — mode + strategy are read by
-- the sync edge function; the actual algorithm lives in code, not in SQL, so it
-- stays easy to extend.
CREATE TABLE public.tp_assignment_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  mode TEXT NOT NULL DEFAULT 'manual' CHECK (mode IN ('manual', 'auto')),
  strategy TEXT NOT NULL DEFAULT 'least_workload' CHECK (strategy IN ('least_workload', 'round_robin')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.tp_assignment_config (id) VALUES (1);

CREATE TRIGGER update_tp_assignment_config_updated_at BEFORE UPDATE ON public.tp_assignment_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Free-form non-secret settings (which Cliniccards appointment-type code(s) count
-- as "2nd consultation", sync interval, presentation branding, etc). Secrets
-- (API keys, webhook signing secret, Telegram token) are never stored here —
-- they live only in Supabase Edge Function secrets.
CREATE TABLE public.tp_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.tp_settings (key, value) VALUES
  ('second_consultation_appointment_type_codes', '["consultation_2", "2-konsultatsiya"]'),
  ('sync_interval_minutes', '5'),
  ('default_deadline_hours_before_consultation', '24'),
  ('presentation_clinic_name', '"Biodent"'),
  ('presentation_language', '"uz"');

CREATE TRIGGER update_tp_settings_updated_at BEFORE UPDATE ON public.tp_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- 8. Assignment RPC (atomic assign + status transition + audit + notification)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.tp_assign_case(p_case_id UUID, p_planner_staff_id UUID, p_note TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_old_status public.tp_case_status;
BEGIN
  IF NOT public.has_admin_role(v_actor) THEN
    RAISE EXCEPTION 'Faqat admin case biriktira oladi';
  END IF;

  SELECT status INTO v_old_status FROM public.tp_cases WHERE id = p_case_id FOR UPDATE;
  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'Case topilmadi: %', p_case_id;
  END IF;

  UPDATE public.tp_cases
  SET responsible_planner_staff_id = p_planner_staff_id,
      status = CASE WHEN v_old_status IN ('NEW', 'WAITING_ASSIGNMENT') THEN 'ASSIGNED'::public.tp_case_status ELSE v_old_status END
  WHERE id = p_case_id;

  INSERT INTO public.tp_audit_log (case_id, actor_user_id, action, details)
  VALUES (p_case_id, v_actor, 'assigned', jsonb_build_object('planner_staff_id', p_planner_staff_id, 'note', p_note));

  INSERT INTO public.tp_notifications (case_id, recipient_staff_id, channel, type, payload)
  VALUES (p_case_id, p_planner_staff_id, 'telegram', 'case_assigned', jsonb_build_object('case_id', p_case_id));
END;
$$;

CREATE OR REPLACE FUNCTION public.tp_set_case_status(p_case_id UUID, p_status public.tp_case_status, p_note TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
BEGIN
  IF NOT public.has_any_tp_role(v_actor) THEN
    RAISE EXCEPTION 'Ruxsat yo''q';
  END IF;

  UPDATE public.tp_cases SET status = p_status WHERE id = p_case_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Case topilmadi: %', p_case_id;
  END IF;

  INSERT INTO public.tp_audit_log (case_id, actor_user_id, action, details)
  VALUES (p_case_id, v_actor, 'status_changed', jsonb_build_object('to', p_status, 'note', p_note));
END;
$$;

-- Doctor review (section 23): approve moves the case to READY, revision
-- required sends it back to PLAN_IN_PROGRESS and requires a comment. This is a
-- separate, narrower RPC than tp_set_case_status so only staff with the
-- 'doctor' role can record a review decision.
CREATE OR REPLACE FUNCTION public.tp_submit_review(
  p_case_id UUID,
  p_plan_version_id UUID,
  p_decision TEXT,
  p_comment TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_reviewer_staff_id UUID;
BEGIN
  IF NOT public.has_tp_role(v_actor, 'doctor'::public.tp_role) THEN
    RAISE EXCEPTION 'Faqat shifokor (doctor) review qila oladi';
  END IF;
  IF p_decision NOT IN ('approve', 'revision_required') THEN
    RAISE EXCEPTION 'Noto''g''ri qaror: %', p_decision;
  END IF;
  IF p_decision = 'revision_required' AND (p_comment IS NULL OR btrim(p_comment) = '') THEN
    RAISE EXCEPTION 'Revision uchun izoh majburiy';
  END IF;

  v_reviewer_staff_id := public.tp_current_staff_id(v_actor);

  INSERT INTO public.tp_reviews (case_id, plan_version_id, reviewer_staff_id, decision, comment)
  VALUES (p_case_id, p_plan_version_id, v_reviewer_staff_id, p_decision, p_comment);

  UPDATE public.tp_cases
  SET status = CASE WHEN p_decision = 'approve' THEN 'READY'::public.tp_case_status ELSE 'PLAN_IN_PROGRESS'::public.tp_case_status END
  WHERE id = p_case_id;

  INSERT INTO public.tp_audit_log (case_id, actor_staff_id, actor_user_id, action, details)
  VALUES (p_case_id, v_reviewer_staff_id, v_actor, 'review_submitted', jsonb_build_object('decision', p_decision, 'comment', p_comment));
END;
$$;

-- ---------------------------------------------------------------------------
-- 9. Row Level Security
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  t TEXT;
  admin_only_tables TEXT[] := ARRAY[
    'tp_staff_roles', 'tp_cliniccards_patients', 'tp_cliniccards_appointments',
    'tp_image_types', 'tp_analysis_templates', 'tp_reminder_rules',
    'tp_assignment_config', 'tp_settings', 'tp_case_status_transitions',
    'tp_notifications', 'tp_audit_log', 'tp_integration_sync_log'
  ];
  clinical_tables TEXT[] := ARRAY[
    'tp_cases', 'tp_clinical_images', 'tp_analysis_answers', 'tp_image_annotations',
    'tp_findings', 'tp_dental_charts', 'tp_tooth_status', 'tp_treatment_problems',
    'tp_treatment_objectives', 'tp_treatment_plans', 'tp_treatment_plan_versions',
    'tp_reviews', 'tp_presentations'
  ];
BEGIN
  FOREACH t IN ARRAY admin_only_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins full access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Admins full access" ON public.%I FOR ALL TO authenticated USING (public.has_admin_role(auth.uid())) WITH CHECK (public.has_admin_role(auth.uid()))',
      t
    );
  END LOOP;

  -- Reference tables (image types, analysis templates) and the Cliniccards
  -- cache (patient/appointment names) are also readable by any staff member
  -- with a treatment-plan role — planners/doctors need to see who the patient
  -- is on the dashboard and case page, not just admins.
  FOREACH t IN ARRAY ARRAY['tp_image_types', 'tp_analysis_templates', 'tp_cliniccards_patients', 'tp_cliniccards_appointments'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Any tp role can read" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Any tp role can read" ON public.%I FOR SELECT TO authenticated USING (public.has_any_tp_role(auth.uid()))',
      t
    );
  END LOOP;

  -- Clinical/case tables: admins full access, any planner/doctor/consultant can
  -- read+write (fine-grained per-case scoping for planners/consultants is a
  -- planned hardening step — see ARCHITECTURE.md "Phase 9 — RBAC hardening").
  FOREACH t IN ARRAY clinical_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admins full access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Admins full access" ON public.%I FOR ALL TO authenticated USING (public.has_admin_role(auth.uid())) WITH CHECK (public.has_admin_role(auth.uid()))',
      t
    );
    EXECUTE format('DROP POLICY IF EXISTS "Planner and doctor full access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Planner and doctor full access" ON public.%I FOR ALL TO authenticated USING (public.has_tp_role(auth.uid(), ''planner''::public.tp_role) OR public.has_tp_role(auth.uid(), ''doctor''::public.tp_role)) WITH CHECK (public.has_tp_role(auth.uid(), ''planner''::public.tp_role) OR public.has_tp_role(auth.uid(), ''doctor''::public.tp_role))',
      t
    );
  END LOOP;
END $$;

-- Consultants: read-only, only on cases that are ready for/completed consultation,
-- and only on the tables they actually need (case summary + presentation).
CREATE POLICY "Consultant read-only ready cases" ON public.tp_cases
  FOR SELECT TO authenticated
  USING (public.has_tp_role(auth.uid(), 'consultant'::public.tp_role) AND status IN ('READY', 'CONSULTATION_COMPLETED'));

CREATE POLICY "Consultant read-only presentations" ON public.tp_presentations
  FOR SELECT TO authenticated
  USING (
    public.has_tp_role(auth.uid(), 'consultant'::public.tp_role)
    AND EXISTS (SELECT 1 FROM public.tp_cases c WHERE c.id = case_id AND c.status IN ('READY', 'CONSULTATION_COMPLETED'))
  );

-- tp_audit_log is append-only: no update/delete policy is granted to anyone
-- other than admins (via the "Admins full access" policy above), and even the
-- assignment/status RPCs only ever INSERT into it.
