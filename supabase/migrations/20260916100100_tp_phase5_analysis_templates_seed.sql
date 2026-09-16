-- Phase 5 (part 2): clinical analysis questionnaire seed.
--
-- IMPORTANT — read before touching clinical wording elsewhere:
-- tp_analysis_templates is deliberately data, not code (see the Phase 1
-- migration's header comment: "No clinical taxonomy is hardcoded"). The
-- rows below are a best-effort reconstruction of a photo-analysis
-- questionnaire the clinic owner dictated in an earlier working session —
-- the exact wording of that dictation was not available when this seed was
-- written, only a paraphrased summary of it, so the option lists here are a
-- reasonable orthodontic default, NOT a verbatim transcript. Treat every row
-- here as a draft: correct wording/options directly in this table (or via
-- /admin/tp/analysis-templates once built) rather than assuming it is exact.
-- Nothing downstream (findings, treatment plan) is auto-generated from these
-- yet, so editing them freely here is safe.

INSERT INTO public.tp_analysis_templates
  (template_name, image_type_id, category, question, answer_type, options, sort_order)
SELECT 'intraoral_frontal_midline', id, 'Prikus', 'Pastki jag'' markaziy chizig''i (midline)', 'single_choice',
  '["Normal", "O''ngga siljigan", "Chapga siljigan"]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'intraoral_frontal'
UNION ALL
SELECT 'anterior_bite_type', id, 'Prikus', 'Old tishlar prikusi turi', 'single_choice',
  '["Normal (to''g''ri) prikus", "Chuqur prikus (deep bite)", "Ochiq prikus (open bite)", "Ortiqcha overjet (proklinatsiya)", "Teskari prikus (old tishlar crossbite)", "Edge-to-edge prikus"]'::jsonb, 2
FROM public.tp_image_types WHERE code = 'intraoral_frontal'
UNION ALL
SELECT 'posterior_bite_right', id, 'Prikus', 'Orqa tishlar prikusi (o''ng tomon)', 'single_choice',
  '["Normal", "Kesishgan (crossbite)"]'::jsonb, 3
FROM public.tp_image_types WHERE code = 'intraoral_right_buccal'
UNION ALL
SELECT 'posterior_bite_left', id, 'Prikus', 'Orqa tishlar prikusi (chap tomon)', 'single_choice',
  '["Normal", "Kesishgan (crossbite)"]'::jsonb, 3
FROM public.tp_image_types WHERE code = 'intraoral_left_buccal'
UNION ALL
SELECT 'angle_class_right', id, 'Prikus', 'Angle klassifikatsiyasi (o''ng tomon)', 'single_choice',
  '["I klass", "II klass, 1-kichik klass", "II klass, 2-kichik klass", "III klass"]'::jsonb, 4
FROM public.tp_image_types WHERE code = 'intraoral_right_buccal'
UNION ALL
SELECT 'angle_class_left', id, 'Prikus', 'Angle klassifikatsiyasi (chap tomon)', 'single_choice',
  '["I klass", "II klass, 1-kichik klass", "II klass, 2-kichik klass", "III klass"]'::jsonb, 4
FROM public.tp_image_types WHERE code = 'intraoral_left_buccal'
UNION ALL
SELECT 'smile_exposure', id, 'Profil / Tabassum', 'Tabassumda tishlar/milk ko''rinish darajasi (ekspoziya)', 'single_choice',
  '["Normal", "Ko''p (gummy smile)", "Kam"]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'face_frontal_smile'
UNION ALL
SELECT 'profile_protrusion', id, 'Profil', 'Profil holati (lab/jag'' burchagi)', 'single_choice',
  '["Normal", "Protruziya (oldinga chiqib turgan)", "Retruziya (orqaga tortilgan)"]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'face_profile_right';
