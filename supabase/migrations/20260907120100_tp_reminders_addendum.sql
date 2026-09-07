-- Small addendum to the Phase 1 schema: dedup log for the reminder cron
-- (so each configured rule fires at most once per case) and a direct
-- telegram-id fallback on the notification outbox so admins (who are rows in
-- `admins`, not `staff`) can also receive escalation notifications.

ALTER TABLE public.tp_notifications
  ADD COLUMN IF NOT EXISTS recipient_telegram_id BIGINT;

CREATE TABLE public.tp_reminder_sent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.tp_cases(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.tp_reminder_rules(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (case_id, rule_id)
);

ALTER TABLE public.tp_reminder_sent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access" ON public.tp_reminder_sent_log
  FOR ALL TO authenticated
  USING (public.has_admin_role(auth.uid()))
  WITH CHECK (public.has_admin_role(auth.uid()));

-- tp_audit_log is admin-only in the main schema migration, but the case
-- detail page (Phase 3) shows the case history to whoever is working the
-- case, not just admins — it's plain action-log text, not sensitive. Add a
-- read-only grant for planner/doctor on top of the existing admin policy
-- (multiple permissive SELECT policies OR together, so this only widens
-- read access, never narrows the existing admin write/delete restriction).
CREATE POLICY "Planner and doctor can read audit log" ON public.tp_audit_log
  FOR SELECT TO authenticated
  USING (
    public.has_tp_role(auth.uid(), 'planner'::public.tp_role)
    OR public.has_tp_role(auth.uid(), 'doctor'::public.tp_role)
  );

-- Let a staff member with a treatment-plan role actually log into the admin
-- app: the existing `staff` RLS only lets admins read every row, or the
-- public read active doctors (position = 'shifokor'). Neither lets a
-- planner/doctor read their own row or their fellow planners'/doctors'
-- names (needed for the dashboard, case detail, and the assignment
-- dropdown). Both additions below are read-only and additive — they widen
-- who can SELECT, never who can INSERT/UPDATE/DELETE (still admin-only).
CREATE POLICY "Staff can view own row" ON public.staff
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Any tp role can view tp staff roster" ON public.staff
  FOR SELECT TO authenticated
  USING (
    public.has_any_tp_role(auth.uid())
    AND EXISTS (SELECT 1 FROM public.tp_staff_roles r WHERE r.staff_id = staff.id)
  );

-- tp_staff_roles itself is admin-only in the main schema migration. Without
-- this, a planner/doctor could never even discover their own role (the login
-- check in src/lib/auth.tsx reads `staff -> tp_staff_roles` for the current
-- user), which would lock every non-admin tp user out of the app entirely.
-- Scoped to the caller's own staff row only — not the whole roster.
CREATE POLICY "Staff can view own tp roles" ON public.tp_staff_roles
  FOR SELECT TO authenticated
  USING (staff_id = public.tp_current_staff_id(auth.uid()));

-- The case detail page's "assign planner" dropdown looks up every staff row
-- with role = 'planner' — any tp-role holder needs to see that roster (who
-- has which role is not sensitive), not just their own row.
CREATE POLICY "Any tp role can view tp_staff_roles roster" ON public.tp_staff_roles
  FOR SELECT TO authenticated
  USING (public.has_any_tp_role(auth.uid()));
