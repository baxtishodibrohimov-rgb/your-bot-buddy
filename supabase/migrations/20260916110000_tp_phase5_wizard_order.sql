-- Phase 5 follow-up: the clinic gave an exact, ordered 13-photo capture
-- sequence for the Clinical Analysis Wizard (intraoral frontal -> right
-- buccal -> left buccal -> overjet -> upper occlusal -> lower occlusal ->
-- frontal/closed-mouth -> frontal "M" -> frontal smile -> 45 deg smile ->
-- profile 90 rest -> profile 90 "M" -> profile 90 smile). This aligns
-- tp_image_types with that sequence: existing codes that already match
-- keep their code (only sort_order changes, so nothing that referenced them
-- by id breaks), and the codes that had no equivalent are added new.
--
-- face_profile_right / face_profile_left / face_three_quarter predate this
-- ordered sequence and aren't part of it (the clinic's list distinguishes
-- profile shots by facial *state* — rest/"M"/smile — not by side). They're
-- kept (the mock Cliniccards adapter's demo images still reference them by
-- label) but no longer required or shown in the wizard.

UPDATE public.tp_image_types SET sort_order = 1 WHERE code = 'intraoral_frontal';
UPDATE public.tp_image_types SET sort_order = 2 WHERE code = 'intraoral_right_buccal';
UPDATE public.tp_image_types SET sort_order = 3 WHERE code = 'intraoral_left_buccal';
UPDATE public.tp_image_types SET sort_order = 5 WHERE code = 'intraoral_upper_occlusal';
UPDATE public.tp_image_types SET sort_order = 6 WHERE code = 'intraoral_lower_occlusal';
UPDATE public.tp_image_types SET sort_order = 7 WHERE code = 'face_frontal';
UPDATE public.tp_image_types SET sort_order = 9 WHERE code = 'face_frontal_smile';

UPDATE public.tp_image_types SET is_required = false, sort_order = 90 WHERE code = 'face_profile_right';
UPDATE public.tp_image_types SET is_required = false, sort_order = 91 WHERE code = 'face_profile_left';
UPDATE public.tp_image_types SET is_required = false, sort_order = 92 WHERE code = 'face_three_quarter';

INSERT INTO public.tp_image_types (code, label, category, is_required, sort_order) VALUES
  ('overjet', 'Overjet', 'intraoral', true, 4),
  ('face_frontal_m', 'Frontal — "M" holati', 'extraoral', true, 8),
  ('face_45_smile', '45° — kulgan holat', 'extraoral', true, 10),
  ('face_profile_90_rest', 'Profil 90° — tinch holat', 'extraoral', true, 11),
  ('face_profile_90_m', 'Profil 90° — "M" holati', 'extraoral', true, 12),
  ('face_profile_90_smile', 'Profil 90° — kulgan holat', 'extraoral', true, 13)
ON CONFLICT (code) DO NOTHING;
