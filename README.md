# Biodent — Clinic Admin + Treatment Plan Manager

TanStack Start (React) admin panel for a dental/orthodontic clinic, backed by
Supabase (Postgres + Auth + Edge Functions), deployed to Cloudflare Workers.

This repo has two layers:

1. **Existing clinic app** (reception, staff checklists, lab orders,
   residency training, Telegram patient bot) — unchanged by this work.
2. **Treatment Plan Manager** — a new module that turns a Cliniccards
   "2nd consultation" booking into a tracked, assigned, deadline-driven
   treatment-plan case with Telegram reminders. See **[ARCHITECTURE.md](./ARCHITECTURE.md)**
   for the full design and phase-by-phase status; this README is the
   run/test guide.

## Running it locally

```bash
bun install        # or npm install — bun.lockb is committed
bun run dev         # vite dev, http://localhost:5173
```

The frontend needs `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` (see
`.env` — already set for the project's Supabase instance) to talk to
Supabase. Everything server-side (Edge Functions, cron) is deployed
separately via the Supabase CLI:

```bash
supabase link --project-ref khlliiwezcqqgvvwbkmi
supabase db push                      # applies supabase/migrations/*
supabase functions deploy cliniccards-sync
supabase functions deploy cliniccards-webhook
supabase functions deploy treatment-plan-notifications-dispatch
supabase functions deploy treatment-plan-reminders
```

Edge Function secrets (never put these in `.env` / never ship to the
browser — see `.env.example` for the full list and what each does):

```bash
supabase secrets set LOVABLE_API_KEY=... TELEGRAM_API_KEY=...
supabase secrets set APP_BASE_URL=https://your-admin-domain.example
# Only once real Cliniccards credentials + API docs exist:
supabase secrets set CLINICCARDS_API_URL=... CLINICCARDS_API_KEY=...
```

Without `CLINICCARDS_API_URL`/`CLINICCARDS_API_KEY` set, the sync job
automatically uses the built-in mock Cliniccards provider (5 fake patients
with "2-konsultatsiya" appointments) — the module works end to end with zero
external configuration.

## Treatment Plan Manager — how to test each phase

After `supabase db push`, the demo-data migration seeds 3 planners, 2
doctors, 5 mock patients and 10 cases (one per status) — `/admin/tp` should
show a fully populated Kanban immediately.

**Phase 1 — architecture, DB, roles.** Log in at `/auth` with an admin
account (see `/admin/admins` → "Web admin yaratish" if you need one), open
`/admin/tp/staff` and confirm the 3 seeded planners / 2 seeded doctors show
up with their role checkboxes already ticked.

**Phase 2 — Cliniccards sync.** Go to `/admin/tp/settings` → **"Cliniccards
sync"** button. It calls the mock adapter, which always has a `DEMO-*`-style
appointment ready; check `/admin/tp/settings`' sync log table for a `success`
row, and confirm no duplicate case was created for an appointment that
already has one (idempotency — re-click the button, `cases_created` should
be `0` the second time).

**Phase 3 — cases, assignment, dashboard.** Open `/admin/tp` — the Kanban has
one card per status. Click a `WAITING_ASSIGNMENT` card, use the "Planner
tanlash" dropdown on the case page to assign it, confirm it moves to
`ASSIGNED` and the audit log at the bottom of the page gets an `assigned`
entry. Toggle auto-assignment at `/admin/tp/settings` → "Biriktirish
algoritmi" → `Auto`, then run "Cliniccards sync" again with a fresh mock
appointment id (edit `mock-provider.ts`'s `PATIENT_SEEDS` to add one, or wait
for a new poll cycle in a deployed environment) to see automatic assignment.

**Phase 4 — Telegram + reminders.** Requires `LOVABLE_API_KEY` /
`TELEGRAM_API_KEY` secrets and a seeded staff member's `telegram_id` to be a
real Telegram user id. Assign a case and confirm a `tp_notifications` row
appears with `type = case_assigned`; within a minute (once
`treatment-plan-notifications-dispatch` is deployed + cron runs) it should
flip to `status = sent` and the Telegram user gets the message with a
"PLAN'NI OCHISH" button (needs `APP_BASE_URL` set to build the link).
`/admin/tp/reminders` lets you change the 24h/12h/6h/2h offsets without a
deploy.

**Phase 5 — manual case entry, bulut image upload, Clinical Analysis Wizard.**
- `/admin/tp` has a "Yangi bemor qo'shish" button to open a case by hand
  (bypassing Cliniccards) via the `tp_create_manual_case` RPC — same
  state machine, deadline and audit-log path as a synced case, distinguished
  only by a `MANUAL-...` cliniccards id and an audit-log `source: "manual"`.
- The case page's "Hammasini yuklash" button uploads files to Supabase
  Storage (`tp-clinical-images` bucket) and drops them in the case's
  **bulut** (pool) — `image_type_id = NULL` — since there's still no image
  classifier (see the standing "don't invent it" rule). Each required-image
  slot has a **+** (upload straight into that slot) and a **☁️** (pick from
  the bulut) control; assigning a pool image into an already-filled slot
  returns the previous occupant to the bulut instead of deleting it
  (`tp_assign_pool_image` RPC).
- "TAHLILNI BOSHLASH" opens `/admin/tp/cases/$id/analysis`: a one-photo-at-a-
  time wizard that walks the clinic's confirmed 13-step capture order
  (intraoral frontal → right buccal → left buccal → overjet → upper/lower
  occlusal → frontal closed-mouth/"M"/smile → 45° smile → profile 90°
  rest/"M"/smile — see `WIZARD_ORDER` in
  `admin.tp.cases.$caseId.analysis.tsx`), with Keyingisi/Orqaga navigation
  and numbered step pills to jump back and re-edit any earlier photo. The
  interactive FDI dental chart (`src/components/dental-chart.tsx`, per-case
  "Sut tish / Doimiy tish" default + per-tooth mixed-dentition override on
  double-click), split per jaw — shown at the upper-occlusal step for the
  upper arch and the lower-occlusal step for the lower arch. The 22 seeded
  questions in `tp_analysis_templates` are the clinic's own confirmed
  wording (given directly, per step) — no invented clinical content.

**Phase 7 — Master Problem List auto-generation.** Every wizard answer is
now checked against a `tp_finding_description()` rule (confirmed
answer-by-answer with the clinic — see the comment at the top of
`20260916130000_tp_phase7_findings_autogeneration.sql`) via a trigger on
`tp_analysis_answers`; a non-baseline choice or a non-empty free-text answer
inserts/updates a row in `tp_findings`, tied back to its answer via
`source_answer_id` so it disappears again if the answer is edited back to
normal or deleted. The one exception, "Profil turi" (Protrusion/Retrusion),
has no normal baseline to compare against, so it's intentionally left
without a rule. The two mandible-symmetry questions (choice + free-text
side note) combine into a single finding.

**Phases 6, 8–12** are not built yet. See **ARCHITECTURE.md → Phase plan** for
what's schema-ready vs. still needed for each.

## Project structure (new module only)

```
supabase/
  migrations/
    20260907120000_tp_schema.sql        all tp_* tables, enums, RLS, state machine
    20260907120100_tp_reminders_addendum.sql
    20260907120200_tp_cron.sql          pg_cron wiring for the 3 background jobs
    20260907120300_tp_demo_data.sql     3 planners, 2 doctors, 5 patients, 10 cases
  functions/
    _shared/cliniccards/                the integration layer (see ARCHITECTURE.md)
    _shared/notifications/telegram.ts   shared Telegram sender
    cliniccards-sync/                   pg_cron-driven poll
    cliniccards-webhook/                webhook receiver
    treatment-plan-notifications-dispatch/   outbox → Telegram
    treatment-plan-reminders/           reminder + overdue-escalation cron
src/routes/
  admin.tp.tsx                          Treatment Planning Dashboard (Kanban)
  admin.tp.cases.$caseId.tsx            case detail
  admin.tp.staff.tsx                    planner/doctor/consultant role management
  admin.tp.image-types.tsx              required-image-type config
  admin.tp.reminders.tsx                reminder rule config
  admin.tp.settings.tsx                 assignment algorithm, sync log, non-secret settings
```

## Known limitations (see ARCHITECTURE.md for detail)

- RLS on clinical sub-tables is coarse (any planner/doctor, not scoped to
  "my assigned cases" yet).
- `src/integrations/supabase/types.ts` doesn't know about the new `tp_*`
  tables until it's regenerated against the live schema (`supabase gen
  types typescript --linked > src/integrations/supabase/types.ts`); until
  then the new routes use the same `as any` cast pattern the rest of the
  admin panel already uses for Supabase calls.
- `src/routeTree.gen.ts` is normally fully auto-generated by the TanStack
  Router Vite plugin on every `dev`/`build`. It was hand-edited here to
  register the new routes because this sandbox couldn't reach the private
  npm registry to install dependencies and run that generation step —
  running `bun install && bun run build` once will regenerate it and should
  produce an equivalent (or corrected, if there's a typo) file.
