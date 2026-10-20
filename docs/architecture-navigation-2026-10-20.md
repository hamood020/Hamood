# ICV New — application architecture and navigation map

Captured: 2026-10-20  
Repository: `hamood020/Hamood`  
Published entry point: `public/index.html`

## Runtime layout

- `public/index.html`: authenticated application shell, dashboard and core lists, route entry, login redirect, and URL state.
- `public/icv-common.js`: shared utility functions, common table definitions, error handling, contact visibility helpers, and shared success/error messaging.
- `public/ptlc-access.js`: authentication/session/profile access logic, role-based page and data permissions, profile UI, and related access presentation.
- `public/ptlc-project-pages.js`: project detail page, project edit form, report/plan detail actions, project metrics presentation, and project-specific notes/extension UI.
- `public/icv-structure-v13.js`: shared dashboard/project/local-content page renderers and structural UI.
- `public/companies-page-final.js`: company list and company management UI.
- `public/settings-page.js`: platform settings UI, local cache, database synchronization, and publishes calculation settings to the app.
- `public/icv-team.js`: user/team, audit, follow-up, and notification-facing functionality.
- `public/icv-i18n.js`: shared Arabic/English toggle, translation dictionary, and RTL/LTR presentation.
- `public/plan.html`: dedicated local-content plan entry page.
- `public/report-form.html`: dedicated quarterly report entry/edit page.

## Navigation rules

- Dashboard/list pages use `index.html?page=<page>`.
- Project details use `index.html?project=<project-id>`.
- The browser Back/Forward buttons should restore the route from the current URL.
- Direct links must preserve their requested route through the login redirect.
- Page-level navigation remains in the existing shell; this change does not replace the approved dashboard design.

## Navigation safety fix

The shell had two separate `popstate` listeners. Both could invoke route restoration for the same browser history event, causing a page or project to render twice. The earlier listener has been removed; the final navigation router now owns Back/Forward handling, while the startup router remains responsible for direct-link restoration and project URL updates.

## Configuration wiring

- Project statuses are loaded from saved platform settings in both the project creation and edit forms.
- Project creation/editing checks required entity, company, project value, and dates according to saved settings; end date cannot precede start date.
- The report form reads configured report years, quarters, default report type, and report statuses from the settings cache.
- The approved status `معتمد` is preserved in configuration because database metrics intentionally aggregate approved reports only.
- Calculation coefficients and compliance thresholds are read by the database calculation function; changing local-content settings triggers recalculation for projects.
- Notification deadlines use `reports.dueDays`; the `reports.lateAfter` grace period is now applied before a report changes from due to overdue.

## Release checks performed

- JavaScript syntax checks passed for all shared application scripts.
- Inline script syntax checks passed for `index.html`, `plan.html`, and `report-form.html`.
- GitHub Actions deployment succeeded for the earlier release; latest commits still need their own successful deployment confirmation.
- The static site could not be rendered in the available web inspection environment, so this is not a substitute for a live browser smoke test.

## Explicit exclusions retained

Do not delete the `icv-new-app` Edge Function or the previously identified orphaned storage files. Do not enable the default assigned-entities filter, two-factor authentication, or leaked-password protection as part of this task.
