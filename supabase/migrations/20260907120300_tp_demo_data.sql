-- Demo data (spec section 38): 3 planners, 2 doctors, 5 Cliniccards patients,
-- 10 TreatmentPlanCases spanning every status so the Kanban/dashboard is
-- fully populated the first time this module is opened.
--
-- Planners are modelled as staff with position='shifokor_yordamchisi' (doctor's
-- assistant) + tp_staff_roles.role='planner'; doctors as position='shifokor' +
-- tp_staff_roles.role='doctor' — see /ARCHITECTURE.md "Roles" for why this
-- reuses the existing `staff` table instead of duplicating it.

INSERT INTO public.staff (telegram_id, full_name, position, phone, is_active, max_workload) VALUES
  (900000001, 'Dilshod Rahimov', 'shifokor_yordamchisi', '+998901112201', true, 6),
  (900000002, 'Kamola Yusupova', 'shifokor_yordamchisi', '+998901112202', true, 6),
  (900000003, 'Bekzod Nazarov', 'shifokor_yordamchisi', '+998901112203', true, 4);

INSERT INTO public.staff (telegram_id, full_name, position, phone, is_active) VALUES
  (900000011, 'Dr. Aziz Karimov', 'shifokor', '+998901112211', true),
  (900000012, 'Dr. Nilufar Rashidova', 'shifokor', '+998901112212', true);

INSERT INTO public.tp_staff_roles (staff_id, role)
SELECT id, 'planner'::public.tp_role FROM public.staff WHERE telegram_id IN (900000001, 900000002, 900000003);

INSERT INTO public.tp_staff_roles (staff_id, role)
SELECT id, 'doctor'::public.tp_role FROM public.staff WHERE telegram_id IN (900000011, 900000012);

INSERT INTO public.tp_cliniccards_patients (cliniccards_patient_id, full_name, birth_date, phone, raw_payload) VALUES
  ('DEMO-P1', 'Dilnoza Yusupova', '2005-03-12', '+998901234501', '{"demo": true}'),
  ('DEMO-P2', 'Sardor Toshev', '1998-11-02', '+998901234502', '{"demo": true}'),
  ('DEMO-P3', 'Madina Alieva', '2010-07-19', '+998901234503', '{"demo": true}'),
  ('DEMO-P4', 'Jasur Nematov', '1995-01-27', '+998901234504', '{"demo": true}'),
  ('DEMO-P5', 'Ozoda Karimova', '2003-09-08', '+998901234505', '{"demo": true}');

INSERT INTO public.tp_cliniccards_appointments (cliniccards_appointment_id, cliniccards_patient_id, appointment_type_code, appointment_type_label, doctor_name, scheduled_at, raw_payload) VALUES
  ('DEMO-A1', 'DEMO-P1', 'consultation_2', '2-konsultatsiya', 'Dr. Aziz Karimov', now() + interval '6 hours', '{"demo": true}'),
  ('DEMO-A2', 'DEMO-P2', 'consultation_2', '2-konsultatsiya', 'Dr. Aziz Karimov', now() + interval '1 day', '{"demo": true}'),
  ('DEMO-A3', 'DEMO-P3', 'consultation_2', '2-konsultatsiya', 'Dr. Nilufar Rashidova', now() + interval '2 days', '{"demo": true}'),
  ('DEMO-A4', 'DEMO-P4', 'consultation_2', '2-konsultatsiya', 'Dr. Nilufar Rashidova', now() + interval '3 days', '{"demo": true}'),
  ('DEMO-A5', 'DEMO-P5', 'consultation_2', '2-konsultatsiya', 'Dr. Aziz Karimov', now() + interval '4 days', '{"demo": true}'),
  ('DEMO-A6', 'DEMO-P1', 'consultation_2', '2-konsultatsiya', 'Dr. Aziz Karimov', now() + interval '5 days', '{"demo": true}'),
  ('DEMO-A7', 'DEMO-P2', 'consultation_2', '2-konsultatsiya', 'Dr. Nilufar Rashidova', now() + interval '6 days', '{"demo": true}'),
  ('DEMO-A8', 'DEMO-P3', 'consultation_2', '2-konsultatsiya', 'Dr. Aziz Karimov', now() + interval '1 hour', '{"demo": true}'),
  ('DEMO-A9', 'DEMO-P4', 'consultation_2', '2-konsultatsiya', 'Dr. Nilufar Rashidova', now() - interval '1 day', '{"demo": true}'),
  ('DEMO-A10', 'DEMO-P5', 'consultation_2', '2-konsultatsiya', 'Dr. Aziz Karimov', now() - interval '3 days', '{"demo": true}');

-- One case per status, in workflow order. Deadlines are set relative to
-- consultation_datetime the same way the sync job computes them (24h before).
INSERT INTO public.tp_cases (
  cliniccards_patient_id, cliniccards_appointment_id, consultation_datetime, deadline,
  primary_doctor_staff_id, primary_doctor_name, responsible_planner_staff_id, status, images_progress_percent
)
SELECT 'DEMO-P1', 'DEMO-A1', now() + interval '6 hours', now() - interval '18 hours',
       (SELECT id FROM public.staff WHERE telegram_id = 900000011), 'Dr. Aziz Karimov', NULL::uuid, 'NEW'::public.tp_case_status, 0
UNION ALL
SELECT 'DEMO-P2', 'DEMO-A2', now() + interval '1 day', now() + interval '1 hour',
       (SELECT id FROM public.staff WHERE telegram_id = 900000011), 'Dr. Aziz Karimov', NULL::uuid, 'WAITING_ASSIGNMENT'::public.tp_case_status, 0
UNION ALL
SELECT 'DEMO-P3', 'DEMO-A3', now() + interval '2 days', now() + interval '1 day',
       (SELECT id FROM public.staff WHERE telegram_id = 900000012), 'Dr. Nilufar Rashidova',
       (SELECT id FROM public.staff WHERE telegram_id = 900000001), 'ASSIGNED'::public.tp_case_status, 20
UNION ALL
SELECT 'DEMO-P4', 'DEMO-A4', now() + interval '3 days', now() + interval '2 days',
       (SELECT id FROM public.staff WHERE telegram_id = 900000012), 'Dr. Nilufar Rashidova',
       (SELECT id FROM public.staff WHERE telegram_id = 900000002), 'IMAGES_READY'::public.tp_case_status, 100
UNION ALL
SELECT 'DEMO-P5', 'DEMO-A5', now() + interval '4 days', now() + interval '3 days',
       (SELECT id FROM public.staff WHERE telegram_id = 900000011), 'Dr. Aziz Karimov',
       (SELECT id FROM public.staff WHERE telegram_id = 900000003), 'ANALYSIS_IN_PROGRESS'::public.tp_case_status, 100
UNION ALL
SELECT 'DEMO-P1', 'DEMO-A6', now() + interval '5 days', now() + interval '4 days',
       (SELECT id FROM public.staff WHERE telegram_id = 900000011), 'Dr. Aziz Karimov',
       (SELECT id FROM public.staff WHERE telegram_id = 900000001), 'PLAN_IN_PROGRESS'::public.tp_case_status, 100
UNION ALL
SELECT 'DEMO-P2', 'DEMO-A7', now() + interval '6 days', now() + interval '5 days',
       (SELECT id FROM public.staff WHERE telegram_id = 900000012), 'Dr. Nilufar Rashidova',
       (SELECT id FROM public.staff WHERE telegram_id = 900000002), 'REVIEW_REQUIRED'::public.tp_case_status, 100
UNION ALL
SELECT 'DEMO-P3', 'DEMO-A8', now() + interval '1 hour', now() - interval '23 hours',
       (SELECT id FROM public.staff WHERE telegram_id = 900000011), 'Dr. Aziz Karimov',
       (SELECT id FROM public.staff WHERE telegram_id = 900000003), 'READY'::public.tp_case_status, 100
UNION ALL
SELECT 'DEMO-P4', 'DEMO-A9', now() - interval '1 day', now() - interval '2 days',
       (SELECT id FROM public.staff WHERE telegram_id = 900000012), 'Dr. Nilufar Rashidova',
       (SELECT id FROM public.staff WHERE telegram_id = 900000001), 'CONSULTATION_COMPLETED'::public.tp_case_status, 100
UNION ALL
SELECT 'DEMO-P5', 'DEMO-A10', now() - interval '3 days', now() - interval '4 days',
       (SELECT id FROM public.staff WHERE telegram_id = 900000011), 'Dr. Aziz Karimov',
       (SELECT id FROM public.staff WHERE telegram_id = 900000002), 'OVERDUE'::public.tp_case_status, 40;
