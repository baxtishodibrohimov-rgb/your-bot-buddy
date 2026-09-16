-- Phase 5 follow-up: replace the earlier best-effort/draft question seed
-- with the clinic's own confirmed wording for all 13 wizard steps (given
-- verbatim in chat), now that it's available. This supersedes
-- 20260916100100_tp_phase5_analysis_templates_seed.sql entirely — every
-- row from that seed is deleted and replaced here.
--
-- Two occlusal-step questions ("Joy yetishmasligi / qiyshiqlik darajasi")
-- and two frontal-step questions ("agar asimmetrik...", "ko'rinish
-- darajasi") were specified as free text, not a fixed option list —
-- answer_type = 'text' for those.

DELETE FROM public.tp_analysis_templates;

INSERT INTO public.tp_analysis_templates
  (template_name, image_type_id, category, question, answer_type, options, sort_order)
SELECT 'intraoral_frontal_midline', id, 'Frontal', 'Pastki jag'' markaziy chizig''i', 'single_choice',
  '["Norma", "O''ngga siljigan", "Chapga siljigan"]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'intraoral_frontal'
UNION ALL
SELECT 'anterior_bite_type', id, 'Frontal', 'Prikus turi (old, vertikal)', 'single_choice',
  '["Normal", "Ochiq", "Chuqur", "To''g''ri", "Teskari", "Kesishgan"]'::jsonb, 2
FROM public.tp_image_types WHERE code = 'intraoral_frontal'
UNION ALL
SELECT 'posterior_bite', id, 'Frontal', 'Orqa prikus', 'single_choice',
  '["Norma", "Kesishgan"]'::jsonb, 3
FROM public.tp_image_types WHERE code = 'intraoral_frontal'

UNION ALL
SELECT 'angle_molar_right', id, 'Buccal', 'Angle klassi, molyar (6-tish), o''ng', 'single_choice',
  '["I", "II", "III"]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'intraoral_right_buccal'
UNION ALL
SELECT 'angle_canine_right', id, 'Buccal', 'Angle klassi, klyk (3-tish), o''ng', 'single_choice',
  '["I", "II", "III"]'::jsonb, 2
FROM public.tp_image_types WHERE code = 'intraoral_right_buccal'

UNION ALL
SELECT 'angle_molar_left', id, 'Buccal', 'Angle klassi, molyar (6-tish), chap', 'single_choice',
  '["I", "II", "III"]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'intraoral_left_buccal'
UNION ALL
SELECT 'angle_canine_left', id, 'Buccal', 'Angle klassi, klyk (3-tish), chap', 'single_choice',
  '["I", "II", "III"]'::jsonb, 2
FROM public.tp_image_types WHERE code = 'intraoral_left_buccal'

UNION ALL
SELECT 'overjet_status', id, 'Overjet', 'Overjet holati', 'single_choice',
  '["Normal", "Ko''p", "Kam"]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'overjet'

UNION ALL
SELECT 'upper_crowding_note', id, 'Okklyuzion', 'Joy yetishmasligi / qiyshiqlik darajasi', 'text',
  '[]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'intraoral_upper_occlusal'

UNION ALL
SELECT 'lower_crowding_note', id, 'Okklyuzion', 'Joy yetishmasligi / qiyshiqlik darajasi', 'text',
  '[]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'intraoral_lower_occlusal'

UNION ALL
SELECT 'lips_state', id, 'Profil', 'Lablar holati', 'single_choice',
  '["Tinch", "Majburiy yopilgan"]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'face_frontal'
UNION ALL
SELECT 'mandible_symmetry', id, 'Profil', 'Pastki jag'' holati (simmetriya)', 'single_choice',
  '["Simmetrik", "Asimmetrik"]'::jsonb, 2
FROM public.tp_image_types WHERE code = 'face_frontal'
UNION ALL
SELECT 'mandible_asymmetry_side', id, 'Profil', 'Agar asimmetrik bo''lsa — tomonini yozing', 'text',
  '[]'::jsonb, 3
FROM public.tp_image_types WHERE code = 'face_frontal'

UNION ALL
SELECT 'upper_incisor_exposure_m', id, 'Profil', 'Yuqori kurak tishlarning ko''rinish darajasi', 'text',
  '[]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'face_frontal_m'

UNION ALL
SELECT 'smile_exposure', id, 'Tabassum', 'Ekspozitsiya darajasi', 'single_choice',
  '["Normal", "Ko''p", "Kam"]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'face_frontal_smile'
UNION ALL
SELECT 'gummy_smile', id, 'Tabassum', 'Milk holati (gummy smile)', 'single_choice',
  '["Yo''q", "Kam", "Ko''p"]'::jsonb, 2
FROM public.tp_image_types WHERE code = 'face_frontal_smile'
UNION ALL
SELECT 'smile_midline', id, 'Tabassum', 'Markaziy chiziq (yuzga nisbatan)', 'single_choice',
  '["Norma", "O''ngga siljigan", "Chapga siljigan"]'::jsonb, 3
FROM public.tp_image_types WHERE code = 'face_frontal_smile'

UNION ALL
SELECT 'smile_arc', id, 'Tabassum', 'Arka (smile arc) holati', 'single_choice',
  '["Norma", "Ko''p", "Kam"]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'face_45_smile'

UNION ALL
SELECT 'profile_type_90_rest', id, 'Profil 90°', 'Profil turi', 'single_choice',
  '["Protrusion", "Retrusion"]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'face_profile_90_rest'
UNION ALL
SELECT 'class_tendency_90_rest', id, 'Profil 90°', 'Klass moyilligi', 'single_choice',
  '["Norma", "2-klassga moyillik", "3-klassga moyillik"]'::jsonb, 2
FROM public.tp_image_types WHERE code = 'face_profile_90_rest'

UNION ALL
SELECT 'teeth_state_90_m', id, 'Profil 90°', 'Tishlar holati', 'single_choice',
  '["Norma", "Protrusiya", "Retrusiya"]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'face_profile_90_m'

UNION ALL
SELECT 'teeth_state_90_smile', id, 'Profil 90°', 'Tishlar holati', 'single_choice',
  '["Norma", "Protrusiya", "Retrusiya"]'::jsonb, 1
FROM public.tp_image_types WHERE code = 'face_profile_90_smile';
