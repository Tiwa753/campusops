# CampusOps

A row-based university operations dashboard built with Next.js 16 and React 19. This working demo connects organizations, events, programs, tasks, applications, and analytics across three role interfaces.

## Run locally

Use Node.js 22.18 or later (the domain tests use native TypeScript support).

```bash
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The overview is available at `/` and `/dashboard`.

## Try the complete workflow

1. Use **Viewing as** in the top bar to choose **Organization manager**. Jordan Lee manages the **Tech & Innovation Club**.
2. Create a published event or program for that organization.
3. Switch to **Student**. Sam Taylor can browse organizations, find opportunities, submit applications, withdraw them, and follow personal activity.
4. Switch back to **Organization manager**, open **Applications**, and approve or decline Sam's pending application.
5. Switch to **Student** to see the decision and activity update. Refresh the page to check persistence.
6. Choose **Administrator** to manage all organizations, opportunities, tasks, applications, and reports. Settings includes a confirmed reset of the local demo data.

## Roles

| Capability          | Administrator                   | Organization manager                    | Student                                  |
| ------------------- | ------------------------------- | --------------------------------------- | ---------------------------------------- |
| Organizations       | Create/edit all; activate/pause | Edit own organization                   | Browse active organizations              |
| Events and programs | Manage all                      | Manage own organization's               | Browse published opportunities and apply |
| Tasks               | Create/edit/complete all        | Create/edit/complete own organization's | No access                                |
| Applications        | Review all                      | Review own organization's               | Submit, track, withdraw own              |
| Analytics           | Whole campus; CSV export        | Own organization; CSV export            | Personal activity                        |

Search, filters, status updates, capacity checks, duplicate-application prevention, form validation, mobile navigation, and CSV exports work with the demo records. Event cancellation and organization pausing preserve historical applications. Attendance and organization member counts are manually entered; analytics distinguish memberships and event check-ins from unique students.

## Demo storage and security boundary

Sample data and the selected role are saved under `campusops-demo-v1` in browser local storage. Dates are relative to when the workspace is first created. Normal refreshes preserve the data; resetting creates fresh sample dates. Open tabs synchronize storage updates, with the latest write winning. If browser storage is unavailable, a visible warning explains that changes are temporary.

**This is a browser-local demo, not production authentication or authorization.** All sample data is delivered to the browser, and the role selector intentionally permits switching identities. Client-side scope checks model the intended workflows but do not protect private records against a user inspecting or modifying browser state. No real student information should be entered here.

The production stage needs authenticated users, server-validated organization memberships, database-level access rules, transactional capacity checks, and durable shared storage. Review decisions would also need a server-side audit trail identifying the reviewer.

## Code map

- `src/lib/domain.ts`: data types, sample data, scoped selectors, permission checks, validated state transitions, and CSV escaping.
- `src/lib/demo-store.ts`: browser persistence, storage recovery, and cross-tab synchronization.
- `src/components/campus-provider.tsx`: shared application state, role selection, dialogs, and notifications.
- `src/components/dashboard.tsx`: role-specific overview.
- `src/components/workspace-pages.tsx`: organization, event, task, application, analytics, activity, and settings pages.
- `src/components/dialogs.tsx`: record editors, opportunity details, applications, and review actions.
- `src/app/globals.css`: responsive workspace styling.

## Verify

```bash
npm test
npm run build
npm run test:e2e
```

The unit suite tests role isolation, unauthorized mutations, application review and withdrawal, duplicate prevention, capacity limits, validation, and safe CSV output. Playwright tests run against the production build, start their own server on port 3100, and cover full workflows, persistence, desktop/mobile layouts, and corrupt-storage recovery.

On Windows, browser tests use installed Microsoft Edge. Elsewhere, install Chromium with `npx playwright install chromium`. Set `PLAYWRIGHT_CHANNEL` to override the browser channel. Test screenshots and failure traces are saved in the ignored `test-results` directory.
