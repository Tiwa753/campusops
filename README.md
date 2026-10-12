# CampusOps

CampusOps is a university operations application beginning with an OAU product preview in Nigeria. It connects student organizations, events, programs, tasks, applications, and analytics. The current implementation prepares the interface and domain architecture for a backend; it is not a live authentication system.

## Run

Use Node.js 22.18 or later.

```bash
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Account setup is at [/sign-up](http://localhost:3000/sign-up).

## One account, personal and organization workspaces

The preview starts as **Damilola Adeyemi**, an OAU student who also leads **Tech & Innovation Club**. The top bar shows read-only membership information. There is no editable role selector.

- **My campus**: browse campus opportunities, apply to other organizations' events, and track personal applications and activity.
- **Manage Tech & Innovation Club**: manage that organization's events, tasks, applications, and reports.
- Moving between spaces keeps the same account and student ID. A person can have several leadership memberships.
- A leader cannot approve or reject their own application. Another authorized reviewer must decide.
- University administration requires a provisioned administrator membership. Public signup never grants administrator privileges.

To try it, apply to **A Greener Campus** in My campus, open your applications, then visit the club management space. The personal application remains yours and does not appear in that unrelated club's review queue. You can review other students' Tech & Innovation Club applications from the management space.

## Signup and permissions

The signup page collects a university and an intention to participate or lead. The domain creates a **pending** student membership and, where requested, a separate **pending** leadership request. Verification and authorized approval are prerequisites for access.

This is a signup **preview**: no password is collected, no account is created, no email is sent, and no access is granted. Submitted details remain in memory only. Real signup, sign-in, email verification, invitations, and approval persistence will be implemented when a backend is connected.

The browser adapter uses a preprovisioned sample account. Its local membership data is editable in browser tools and is **not a production security boundary**. No real student information belongs in the preview.

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
