# CampusOps

CampusOps is a university operations application beginning with an OAU product preview in Nigeria. It connects student organizations, events, programs, tasks, applications, and analytics. Supabase Auth provides account registration, email confirmation, sign-in, password recovery, and server-verified sessions. Operational workspace records remain sample preview data and are not a production data backend.

## Run

Use Node.js 22.18 or later.

```bash
npm ci
npm run dev
```

Copy `.env.example` to `.env.local`, configure the Supabase project values, and apply the migrations before starting the app:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
npm run dev
```

Open [localhost:3000](http://localhost:3000). Register at [/sign-up](http://localhost:3000/sign-up), or sign in at [/sign-in](http://localhost:3000/sign-in).

In Supabase Auth settings, enable email confirmation and add `http://localhost:3000/auth/callback` to the allowed redirect URLs. For each deployment, set `NEXT_PUBLIC_SITE_URL` to that exact HTTPS origin and allow its `/auth/callback` URL in Supabase. Only use the `sb_publishable_...` key in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; never put a secret/service-role key in a `NEXT_PUBLIC_` variable. Optional account-deletion email requires a server-only Supabase service-role key and Resend settings. See [Supabase email setup](docs/supabase-email-templates.md) for branded confirmation templates and sender configuration.

If the original auth migration was applied directly in the Supabase SQL Editor, also run the new [signup preference and account-deletion migration](supabase/migrations/20261012150000_signup_intent_and_account_deletion.sql) there. When using the Supabase CLI instead, record the manually applied first migration with `npx supabase migration repair --status applied 20261012120000`, then run `npx supabase db push`.

## One account, personal and organization workspaces

The preview starts as **Damilola Adeyemi**, an OAU student who also leads **Tech & Innovation Club**. The top bar shows read-only membership information. There is no editable role selector.

- **My campus**: browse campus opportunities, apply to other organizations' events, and track personal applications and activity.
- **Manage Tech & Innovation Club**: manage that organization's events, tasks, applications, and reports.
- Moving between spaces keeps the same account and student ID. A person can have several leadership memberships.
- A leader cannot approve or reject their own application. Another authorized reviewer must decide.
- University administration requires a provisioned administrator membership. Public signup never grants administrator privileges.

To try it, apply to **A Greener Campus** in My campus, open your applications, then visit the club management space. The personal application remains yours and does not appear in that unrelated club's review queue. You can review other students' Tech & Innovation Club applications from the management space.

## Authentication and permissions

The registration page asks whether someone is signing up as a student, organization manager, or both. This is saved as an onboarding preference only: Supabase creates a student profile for every public signup, and organization management still requires a provisioned active membership. The selection cannot grant a role. Supabase email confirmation is required before authenticated workspace routes can be opened. Sign-in, sign-out, password recovery, and password reset use same-origin server route handlers. Supabase SSR stores session cookies as HttpOnly, SameSite=Lax cookies (Secure in production); passwords and tokens are not stored in local storage or sent to client code.

`src/app/(workspace)/layout.tsx` verifies the session server-side. The admin page checks the signed-in user's database profile; tasks and analytics require an active organization-manager membership. The profile trigger always creates a student profile and ignores submitted role metadata. Profile and organization-membership RLS allows users to read only their own rows, with no client-side permission to grant roles.

To provision an administrator, first create and verify their account, then run a trusted SQL update in the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'admin@example.edu'
);
```

An active organization-manager membership must likewise be issued through a trusted administrative workflow or invitation. Public signup never grants manager or administrator access. In Settings, a signed-in user can request account deletion; a 30-minute one-time link is sent to their confirmed email and account removal occurs only after a final confirmation on the link page. Deletion removes Supabase Auth, profile, and membership records, but does not remove local preview data from a browser. The existing UI data adapter is still the explicitly labelled local sample preview; this authentication change does not migrate events, applications, or student data into Supabase. Do not put real student information in the preview.

The workspace UI still uses a preprovisioned sample account. Its local membership data is editable in browser tools and is **not a production authorization boundary**; server route checks rely on Supabase profiles and memberships instead. No real student information belongs in the preview.

## Architecture

Read [architecture and backend integration](docs/architecture.md) for the identity model, entity relationships, university isolation, signup lifecycle, access rules, security boundaries, and performance targets.

- `src/lib/access.ts`: accounts, memberships, university configuration, and authorized workspace resolution.
- `src/lib/domain.ts`: university-scoped records and validated business operations.
- `src/lib/calendar.ts`: university timezone handling; OAU uses Africa/Lagos.
- `src/lib/workspace-adapter.ts`: async interface separating UI from data and session infrastructure.
- `src/lib/demo-store.ts`: browser-only preview implementation and legacy migration.
- `src/lib/preview/seed.ts`: isolated sample data.
- `src/features/*`: independent page modules using reusable tables and controls.
- `src/components/web-vitals.tsx`: local Web Vitals event instrumentation; no external telemetry.

All operational records carry `universityId`. Production server queries and database access rules must enforce this scope. University names, locale, country, and timezone come from configuration rather than OAU-specific branches.

## Persistence

Preview records and the sample account use `campusops-preview-v2` in local storage. The selected workspace uses `campusops-workspace-context` in session storage, so personal and management tabs remain independent. Record updates synchronize across tabs with the latest write winning; transactional concurrency is a backend requirement.

Existing `campusops-demo-v1` records migrate without retaining their editable role selection. Resetting from Settings restores the sample account and data. Storage failures show a visible warning.

## Verification

```bash
npm test
npm run build
npm run test:e2e
```

Domain tests cover multi-membership access, pending/revoked/suspended memberships, cross-university isolation, signup escalation attempts, self-review, application workflows, capacity, validation, dates, and CSV escaping.

Browser tests cover personal/manager workflows, a provisioned admin fixture, signup, migration, independent tabs, mobile layouts, keyboard dialog dismissal, automated accessibility, and a production JavaScript transfer budget. Playwright starts a production server on port 3100. Windows uses installed Microsoft Edge; elsewhere run `npx playwright install chromium`. Override the browser with `PLAYWRIGHT_CHANNEL`.

Screenshots, failure traces, and the local performance measurement are attached in `test-results`. The baseline is a local desktop lab observation; field LCP, INP, and CLS targets must be verified on real devices and Nigerian mobile networks before launch.
