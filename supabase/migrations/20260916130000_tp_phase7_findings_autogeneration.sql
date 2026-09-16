-- Phase 7: Master Problem List auto-generation from Clinical Analysis Wizard
-- answers. Rules below were confirmed answer-by-answer with the clinic (see
-- chat) — do NOT extend this CASE with new mappings without the same
-- confirmation; template_names with no case here (e.g. profile_type_90_rest,
-- which has no "normal" baseline option) intentionally produce no finding.
--
-- One question, "Profil turi" (Protrusion/Retrusion), has no normal baseline
-- to compare against, so it is deliberately left out — flagging it always
-- requires clinical judgement, not a mechanical rule.

CREATE OR REPLACE FUNCTION public.tp_finding_description(p_template_name TEXT, p_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_value IS NULL OR btrim(p_value) = '' THEN
    RETURN NULL;
  END IF;

  CASE p_template_name
    WHEN 'intraoral_frontal_midline' THEN
      IF p_value = 'Norma' THEN RETURN NULL; END IF;
      RETURN 'Pastki jag'' markaziy chizig''i siljigan: ' || p_value;
    WHEN 'anterior_bite_type' THEN
      IF p_value = 'Normal' THEN RETURN NULL; END IF;
      RETURN 'Old prikus: ' || p_value;
    WHEN 'posterior_bite' THEN
      IF p_value = 'Norma' THEN RETURN NULL; END IF;
      RETURN 'Orqa prikus kesishgan';
    WHEN 'angle_molar_right' THEN
      IF p_value = 'I' THEN RETURN NULL; END IF;
      RETURN 'O''ng molyar Angle klassi: ' || p_value;
    WHEN 'angle_canine_right' THEN
      IF p_value = 'I' THEN RETURN NULL; END IF;
      RETURN 'O''ng klyk Angle klassi: ' || p_value;
    WHEN 'angle_molar_left' THEN
      IF p_value = 'I' THEN RETURN NULL; END IF;
      RETURN 'Chap molyar Angle klassi: ' || p_value;
    WHEN 'angle_canine_left' THEN
      IF p_value = 'I' THEN RETURN NULL; END IF;
      RETURN 'Chap klyk Angle klassi: ' || p_value;
    WHEN 'overjet_status' THEN
      IF p_value = 'Normal' THEN RETURN NULL; END IF;
      RETURN 'Overjet: ' || p_value;
    WHEN 'upper_crowding_note' THEN
      RETURN 'Yuqori jag''da joy yetishmasligi/qiyshiqlik: ' || p_value;
    WHEN 'lower_crowding_note' THEN
      RETURN 'Pastki jag''da joy yetishmasligi/qiyshiqlik: ' || p_value;
    WHEN 'lips_state' THEN
      IF p_value = 'Tinch' THEN RETURN NULL; END IF;
      RETURN 'Lablar majburiy yopilgan';
    WHEN 'upper_incisor_exposure_m' THEN
      RETURN 'Yuqori kurak tishlar ko''rinishi: ' || p_value;
    WHEN 'smile_exposure' THEN
      IF p_value = 'Normal' THEN RETURN NULL; END IF;
      RETURN 'Tabassum ekspozitsiyasi: ' || p_value;
    WHEN 'gummy_smile' THEN
      IF p_value = 'Yo''q' THEN RETURN NULL; END IF;
      RETURN 'Gummy smile: ' || p_value;
    WHEN 'smile_midline' THEN
      IF p_value = 'Norma' THEN RETURN NULL; END IF;
      RETURN 'Tabassumda markaziy chiziq siljigan: ' || p_value;
    WHEN 'smile_arc' THEN
      IF p_value = 'Norma' THEN RETURN NULL; END IF;
      RETURN 'Smile arc: ' || p_value;
    WHEN 'class_tendency_90_rest' THEN
      IF p_value = 'Norma' THEN RETURN NULL; END IF;
      RETURN 'Klass moyilligi: ' || p_value;
    WHEN 'teeth_state_90_m' THEN
      IF p_value = 'Norma' THEN RETURN NULL; END IF;
      RETURN 'Tishlar holati (''M''): ' || p_value;
    WHEN 'teeth_state_90_smile' THEN
      IF p_value = 'Norma' THEN RETURN NULL; END IF;
      RETURN 'Tishlar holati (tabassum): ' || p_value;
    ELSE
      RETURN NULL;
  END CASE;
END;
$$;

-- "Pastki jag' holati (simmetriya)" + its free-text side note are two
-- separate templates that describe one clinical fact, so they combine into
-- a single finding keyed off the symmetry answer's id.
CREATE OR REPLACE FUNCTION public.tp_sync_mandible_symmetry_finding(p_case_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_symmetry_id UUID;
  v_symmetry_value TEXT;
  v_category TEXT;
  v_side_value TEXT;
  v_description TEXT;
BEGIN
  SELECT a.id, a.answer_value #>> '{}', t.category
    INTO v_symmetry_id, v_symmetry_value, v_category
  FROM public.tp_analysis_answers a
  JOIN public.tp_analysis_templates t ON t.id = a.template_id
  WHERE a.case_id = p_case_id AND t.template_name = 'mandible_symmetry'
  LIMIT 1;

  IF v_symmetry_id IS NULL OR v_symmetry_value IS DISTINCT FROM 'Asimmetrik' THEN
    DELETE FROM public.tp_findings WHERE source_answer_id = v_symmetry_id;
    RETURN;
  END IF;

  SELECT a.answer_value #>> '{}' INTO v_side_value
  FROM public.tp_analysis_answers a
  JOIN public.tp_analysis_templates t ON t.id = a.template_id
  WHERE a.case_id = p_case_id AND t.template_name = 'mandible_asymmetry_side'
  LIMIT 1;

  v_description := 'Pastki jag'' asimmetrik';
  IF v_side_value IS NOT NULL AND btrim(v_side_value) <> '' THEN
    v_description := v_description || ': ' || btrim(v_side_value);
  END IF;

  UPDATE public.tp_findings
    SET description = v_description, category = v_category, updated_at = now()
    WHERE source_answer_id = v_symmetry_id;
  IF NOT FOUND THEN
    INSERT INTO public.tp_findings (case_id, category, description, source_answer_id)
    VALUES (p_case_id, v_category, v_description, v_symmetry_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.tp_analysis_answer_finding_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_case_id UUID;
  v_template_id UUID;
  v_template RECORD;
  v_value TEXT;
  v_description TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_case_id := OLD.case_id;
    v_template_id := OLD.template_id;
  ELSE
    v_case_id := NEW.case_id;
    v_template_id := NEW.template_id;
  END IF;

  SELECT template_name, category INTO v_template
  FROM public.tp_analysis_templates WHERE id = v_template_id;

  IF v_template.template_name IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF v_template.template_name IN ('mandible_symmetry', 'mandible_asymmetry_side') THEN
    IF TG_OP = 'DELETE' AND v_template.template_name = 'mandible_symmetry' THEN
      DELETE FROM public.tp_findings WHERE source_answer_id = OLD.id;
      RETURN OLD;
    END IF;
    PERFORM public.tp_sync_mandible_symmetry_finding(v_case_id);
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.tp_findings WHERE source_answer_id = OLD.id;
    RETURN OLD;
  END IF;

  v_value := NEW.answer_value #>> '{}';
  v_description := public.tp_finding_description(v_template.template_name, v_value);

  IF v_description IS NULL THEN
    DELETE FROM public.tp_findings WHERE source_answer_id = NEW.id;
  ELSE
    UPDATE public.tp_findings
      SET description = v_description, category = v_template.category, updated_at = now()
      WHERE source_answer_id = NEW.id;
    IF NOT FOUND THEN
      INSERT INTO public.tp_findings (case_id, category, description, source_answer_id)
      VALUES (NEW.case_id, v_template.category, v_description, NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- tp_findings.source_answer_id is ON DELETE SET NULL, and that
-- system-generated FK trigger runs alongside ours on the same table+event;
-- alphabetically "RI_ConstraintTrigger_..." sorts before "trg_...", so on
-- AFTER DELETE the FK action nulls source_answer_id before we'd get to look
-- it up by OLD.id. Handling DELETE as BEFORE instead guarantees we run
-- before that (or any) row-level side effect.
DROP TRIGGER IF EXISTS trg_tp_analysis_answer_finding ON public.tp_analysis_answers;
DROP TRIGGER IF EXISTS trg_tp_analysis_answer_finding_delete ON public.tp_analysis_answers;
CREATE TRIGGER trg_tp_analysis_answer_finding
  AFTER INSERT OR UPDATE OF answer_value ON public.tp_analysis_answers
  FOR EACH ROW EXECUTE FUNCTION public.tp_analysis_answer_finding_trigger();
CREATE TRIGGER trg_tp_analysis_answer_finding_delete
  BEFORE DELETE ON public.tp_analysis_answers
  FOR EACH ROW EXECUTE FUNCTION public.tp_analysis_answer_finding_trigger();

-- Backfill: apply the rules to answers that already exist (demo data,
-- anything answered before this migration). A same-value UPDATE still fires
-- the "UPDATE OF answer_value" trigger above.
UPDATE public.tp_analysis_answers SET answer_value = answer_value WHERE answer_value IS NOT NULL;
