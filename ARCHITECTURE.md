# Treatment Plan Manager — Architecture

This document describes the design of the **Clinic Treatment Plan Manager**
module added to the existing Biodent clinic app. It is not a green-field
project: the repository already runs a full clinic reception/staff/lab/
residency system, and this module is built as a new, clearly separated layer
on top of it rather than a rewrite.

## Why it's a module, not a new app

The existing stack is:

- **Frontend**: TanStack Start (React 19 + TanStack Router/Query) + Tailwind +
  shadcn/ui, deployed to Cloudflare Workers (`wrangler.jsonc`).
- **Database/Auth**: Supabase Postgres, with Row Level Security as the
  authorization boundary and `admins`/`staff` tables already modelling clinic
  users.
- **Background jobs**: Supabase Edge Functions + `pg_cron` (see
  `telegram-poll`, `telegram-reminders`) — there is no separate Node/Python
  backend process, so this is where all server-side/scheduled logic lives.
- **Messaging**: Telegram, via a Lovable-managed connector gateway
  (`connector-gateway.lovable.dev`), already used for staff notifications.

The spec (see the task description this was built from) suggested Next.js +
FastAPI + Celery as a stack **"if no repository already exists"**. One does
exist, with real users on it, so the Treatment Plan Manager reuses it end to
end: same Postgres, same RLS model, same Edge Function pattern, same Telegram
gateway, same admin UI shell. Everything specific to this module is prefixed
`tp_` (tables, enums, functions) so it stays easy to find and never collides
with the existing reception/lab/residency schema.

## Data model

All new tables are defined in
`supabase/migrations/20260907120000_tp_schema.sql` (+ two small addenda). Full
column lists are in the SQL; this section explains the *shape* of the model
and the decisions behind it.

### Roles reuse `staff`, they don't duplicate it

The spec's `User`/`Staff` entities already exist as `public.admins`
(SUPER_ADMIN/ADMIN — unchanged) and `public.staff` (everyone else). Rather
than introduce a parallel Planner/Doctor/Consultant table, this module:

- adds `staff.user_id` (nullable, unique) so a staff member can log into the
  web app, and `staff.max_workload`;
- adds `tp_staff_roles(staff_id, role)` where `role` is
  `planner | doctor | consultant` — a staff member can hold more than one;
- adds `has_tp_role(user_id, role)` / `has_any_tp_role(user_id)` SQL helpers
  (security-definer, mirroring the existing `has_admin_role`) used by RLS.

A "planner" in the demo data is a `staff` row with
`position = 'shifokor_yordamchisi'` (doctor's assistant — an existing
position) plus `tp_staff_roles.role = 'planner'`. A "doctor/reviewer" is
`position = 'shifokor'` + `role = 'doctor'`. This composition means the
existing Staff admin page keeps working unchanged, and the new
`/admin/tp/staff` page only manages the module-specific role assignment and
workload cap.

### Cliniccards cache, not a Cliniccards mirror

`tp_cliniccards_patients` / `tp_cliniccards_appointments` are a thin,
denormalized cache of whatever Cliniccards returns — just enough to render
the dashboard and drive case creation without calling Cliniccards on every
page load. They are populated and overwritten by the sync job; nothing else
writes to them. Images are **referenced**, not copied: `tp_clinical_images`
stores `external_url` (or `cliniccards_document_id`) pointing back at
Cliniccards, per the spec's explicit instruction not to require copying
Cliniccards' media into this system.

### TreatmentPlanCase + state machine

`tp_cases` holds exactly the fields the spec lists in section 3. Status is a
Postgres enum (`tp_case_status`, the 10 values from section 4), and legal
transitions are data, not code: `tp_case_status_transitions(from_status,
to_status)` is the edge list, enforced by a `BEFORE UPDATE` trigger
(`tp_check_case_status_transition`). Adding a new legal transition later is a
one-row insert, not a code change.

Idempotency (spec section 3: "bir appointment uchun takroriy Case
yaratilmasin") is a real unique constraint —
`tp_cases.cliniccards_appointment_id UNIQUE` — not just an application-level
check, so it holds even under concurrent sync runs (see `case-sync.ts`'s
23505/unique-violation handling).

### The clinical template engine (sections 14/15) — deliberately empty of clinical rules

`tp_analysis_templates` is exactly the shape the spec asked for
(`template_name, image_type_id, category, question, answer_type, options,
measurement_required, annotation_required, severity, clinical_priority,
presentation_text_template, active`). **No rows describing what to actually
look for on a frontal photo, a panoramic X-ray, etc. exist yet.** Per the
explicit instruction in the task ("qo'llanma berilmaguncha o'zing klinik
qoidalarni o'ylab topib, hardcode qilma"), that content is only ever entered
by an admin (or imported later from the clinical manual, Phase 12) through
`tp_analysis_templates` — nothing in application code encodes a checklist,
a severity scale, or a finding category. `tp_findings.category` and
`.severity` are free `text`, not enums, for the same reason.

### Everything downstream of analysis is schema-ready, UI-pending

Dental chart (`tp_dental_charts` / `tp_tooth_status`, FDI numbering per
section 18), Master Problem List (`tp_findings`), Treatment Plan Builder
(`tp_treatment_problems` → `tp_treatment_objectives`, `tp_treatment_plans` +
`tp_treatment_plan_versions` for the versioning in section 34), Doctor Review
(`tp_reviews`, plus the `tp_submit_review` RPC), and Presentation
(`tp_presentations`) all exist as tables today so Phases 5–10 are "build the
UI/generator against this schema," not "design the schema under time
pressure later." See **Phase plan** below for what's actually wired up.

### Notifications are an outbox, not a direct send

Nothing that creates or assigns a case calls Telegram directly. Every
notification-worthy event (`tp_assign_case` RPC, auto-assignment, reminder
cron, overdue escalation) only ever **inserts a row** into
`tp_notifications` (status `pending`). A single dispatcher function
(`treatment-plan-notifications-dispatch`, cron every minute) is the only code
that talks to the Telegram gateway, formats messages, and marks rows
`sent`/`failed`. This means a Telegram outage never loses a notification or
blocks a database transaction — it just leaves rows pending for the next run.

### Reminders are config, not code

`tp_reminder_rules` (section 7) holds `trigger_type` (`on_assignment` /
`before_consultation` / `after_deadline`), `offset_minutes`, and
`notify_roles`. The `treatment-plan-reminders` cron reads this table every 5
minutes; changing "24h/12h/6h/2h" to something else, or adding a 30-minute
rule, is an admin-panel edit (`/admin/tp/reminders`), not a deploy.
`tp_reminder_sent_log` guarantees each rule fires at most once per case.

## Cliniccards integration layer

Everything Cliniccards-specific lives under
`supabase/functions/_shared/cliniccards/` and nowhere else:

```
_shared/cliniccards/
  types.ts          CliniccardsAdapter interface + DTOs — the only contract
                     the rest of the app depends on.
  mock-provider.ts   MockCliniccardsAdapter — deterministic demo data.
  http-provider.ts   HttpCliniccardsAdapter — real REST client. Endpoint
                     paths and the API-key header are all env-configurable
                     (CLINICCARDS_*_PATH), so no path is hardcoded in the
                     codebase; only the *response field mapping* is a
                     placeholder (`mapPatient`, `mapAppointment`, ...),
                     clearly marked, waiting on real API docs.
  factory.ts         getCliniccardsAdapter() — picks Http vs Mock based on
                     whether CLINICCARDS_API_URL/KEY secrets are set.
  case-sync.ts        The actual sync algorithm (idempotent case creation,
                     image import + progress calc, sync log).
  assignment.ts      The configurable planner-assignment algorithm.
```

`getCliniccardsAdapter()` is called exactly where sync happens
(`cliniccards-sync`, `cliniccards-webhook`), never from the frontend. The
frontend never talks to Cliniccards or holds its credentials — it only reads
the tables the sync job populates, plus a "Sync now" button that invokes the
`cliniccards-sync` Edge Function.

Two intake paths, both idempotent and both going through the same
`syncSecondConsultations()`:

- **Poll** (`cliniccards-sync`, `pg_cron` every 5 minutes) — used when
  Cliniccards has no webhooks.
- **Webhook** (`cliniccards-webhook`) — accepts a generic
  `{ appointmentId }` envelope (the real payload shape is unknown until
  Cliniccards' docs arrive) behind a shared-secret header
  (`CLINICCARDS_WEBHOOK_SECRET`), and re-runs the same sync for just that
  appointment.

Switching from mock to the real Cliniccards API later is meant to be:
set `CLINICCARDS_API_URL` / `CLINICCARDS_API_KEY` (+ path overrides if their
REST conventions differ from the guessed defaults) as Supabase Edge Function
secrets, adjust the `map*` functions in `http-provider.ts` to match real
payloads, done — no other file should need to change.

## RBAC / RLS

- `admins` (existing) = SUPER_ADMIN / ADMIN, unchanged, full access to
  everything including this module.
- `tp_staff_roles` = PLANNER / DOCTOR / CONSULTANT, scoped to `staff`.
- Reference/config tables (image types, analysis templates, reminder rules,
  assignment config, settings, notifications, audit log, sync log) are
  admin-write; planners/doctors get read access where they need the config
  (image types, templates) to run the wizard in later phases.
- Case-affecting tables (`tp_cases` and everything hanging off it) currently
  grant full read/write to *any* staff with `planner` or `doctor` role, plus
  admins. Consultants are read-only, and only on cases in `READY` /
  `CONSULTATION_COMPLETED`.
- Two SQL RPCs are the only sanctioned way to change case state from the
  client: `tp_assign_case` (admin-only) and `tp_submit_review` (doctor-only,
  requires a comment on revision). Both write to `tp_audit_log` in the same
  transaction as the state change, so the audit trail can never drift from
  reality.

**Known, intentional gap** (documented rather than silently shipped): the
"planner/doctor full access" policy is not yet scoped to *the planner's own
assigned cases* — any planner can currently read/write any case's clinical
sub-tables. Tightening this to `responsible_planner_staff_id = current
staff` (while still letting doctors see everything, per the spec's
implicit "doctor reviews across the clinic") is called out as **Phase 9 —
RBAC hardening** below rather than rushed into this pass.

## Phase plan (spec section 41)

| Phase | Spec asked for | Status |
|---|---|---|
| 1 | Architecture, DB, login/users | **Done.** Full schema above; login/RBAC extend the existing `admins`/`staff` auth. |
| 2 | Cliniccards mock integration + appointment sync | **Done.** Mock adapter, poll + webhook, idempotent case creation. |
| 3 | TreatmentPlanCase + assignment + dashboard | **Done.** Manual (`tp_assign_case` RPC, `/admin/tp/cases/$id`) and auto (configurable `least_workload`/`round_robin`) assignment; Kanban dashboard at `/admin/tp`. |
| 4 | Telegram notification + reminders | **Done.** Assignment message, 4 configurable before-consultation reminders, overdue escalation to planner/doctor/admin — all via the outbox + dispatcher described above. |
| 5 | Image gallery + Clinical Analysis Wizard | **Built.** Manual case entry (`tp_create_manual_case`), "bulut" pool upload to Supabase Storage with per-slot +/☁️ controls (`tp_assign_pool_image`), and a wizard page (`/admin/tp/cases/$id/analysis`) rendering `tp_analysis_templates` questions per photo plus an interactive FDI dental chart. The seeded question wording is a best-effort reconstruction of the clinic's dictated questionnaire (not a verbatim transcript) — see the README's Phase 5 section before relying on it clinically. |
| 6 | Image annotation (Konva/Fabric) | **Not started.** `tp_image_annotations` table exists (versioned JSON shapes); no canvas UI yet. |
| 7 | Master Problem List | **Schema + read-only view.** `tp_findings` exists and renders on the case page; nothing yet auto-populates it from wizard answers (depends on Phase 5/6). |
| 8 | Treatment Plan Builder | **Schema only** (`tp_treatment_problems` → `tp_treatment_objectives`, `tp_treatment_plans` + versions). No builder UI. |
| 9 | Doctor review | **Backend done** (`tp_submit_review` RPC, `tp_reviews`, Telegram "review_requested" template wired in the dispatcher). No "Send to review" button in the UI yet — needs the Plan Builder from Phase 8 first. Also where RLS per-planner scoping (see above) should land. |
| 10 | PPTX/PDF presentation generator | **Schema only** (`tp_presentations`). No `python-pptx`-equivalent generator; this stack has no Python runtime, so this will need a Node PPTX library (e.g. `pptxgenjs`) run from a server function or Edge Function. |
| 11 | Real Cliniccards API | **Adapter ready, not connected.** Swap secrets + adjust `http-provider.ts` field mapping once real docs exist. |
| 12 | Import the clinical manual's rules | **Blocked on the manual**, by design (see "clinical template engine" above). `tp_analysis_templates` is where it lands. |

Nothing in Phases 5–12 was skipped by accident — each either needs a UI
investment (wizard, canvas, builder, generator) too large to bolt on inside
this pass without shortcuts, or is explicitly blocked on content only the
clinic can provide (the clinical manual, real Cliniccards credentials). The
schema for all of them already exists so none of it is a rewrite later.

## Things a reviewer should sanity-check before relying on this in production

- RLS on the clinical tables is coarse (see "Known, intentional gap" above).
- The HTTP Cliniccards adapter's field mapping (`http-provider.ts`) is a
  placeholder — verify against real payloads before flipping
  `CLINICCARDS_MODE` away from mock.
- `src/integrations/supabase/types.ts` is Lovable-generated from the live DB
  schema; regenerate it once these migrations are applied so the new tables
  get proper TypeScript types instead of the `as any` casts used throughout
  the new routes (the existing `CrudPage`-based pages already use the same
  pattern for consistency).
