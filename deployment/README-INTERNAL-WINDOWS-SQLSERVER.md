# Internal deployment profile — ICV FollowUp

Updated: 2026-11-08

## Confirmed environment

- Server OS: Windows Server (exact release not yet confirmed).
- Database engine: Microsoft SQL Server (major version unknown).
- Access: authorized users connect over the institution VPN.
- Deployment boundary: application and database remain on the institution network. Do not expose SQL Server to VPN clients or the public internet.

## Target topology

1. Staff browser -> HTTPS internal DNS name / reverse proxy or IIS.
2. IIS serves the existing frontend and reverse-proxies `/api` to the ASP.NET Core API.
3. ASP.NET Core API accesses SQL Server using a dedicated least-privilege service identity.
4. Attachments are stored in a restricted institution file share; the database stores metadata and opaque storage keys.
5. Backups cover SQL Server and the attachment store, with coordinated retention and restore tests.

VPN users access the same internal HTTPS application endpoint. VPN is a network access method, not a substitute for application authentication or authorization.

## Compatibility policy while SQL Server version is unknown

- Do not create or migrate the production database until the engine version, edition, collation, and compatibility level are confirmed.
- First run `deployment/windows/Detect-SqlServer.ps1` using an approved SQL Server connection.
- Initial SQL target should be the oldest supported SQL Server version confirmed by IT. Prefer SQL Server 2019 or newer where available.
- Avoid version-specific features (for example, newer JSON functions) until the detected version is known.
- Never lower an existing server compatibility level as part of installation.

## Application baseline

- Frontend: preserve the current public HTML/CSS/JavaScript and its user workflows.
- Backend: ASP.NET Core Web API on a supported LTS .NET runtime, hosted by IIS with the ASP.NET Core Hosting Bundle.
- Authentication: ASP.NET Core Identity or institution-approved identity provider; never store plaintext passwords.
- Authorization: enforce role and entity-assignment checks on every API request, not only in the browser.
- Roles to preserve: admin, section_head, editor, viewer, temporary_viewer.
- Session policy: retain the requested two-hour inactivity timeout, subject to security review.
- Audit: record sensitive admin changes, approvals, data changes, and attachment actions.
- Secrets: keep connection strings and signing keys outside source control, using Windows-protected configuration or the institution's secrets vault.

## Migration safeguards

1. Take a verified full backup of Supabase data and export attachment objects before migration.
2. Inventory every table, view, function/RPC, trigger, RLS policy, Edge Function, Storage bucket, and scheduled task.
3. Produce a reviewed SQL Server schema and explicit PostgreSQL-to-SQL Server mapping.
4. Migrate into a non-production database first; retain stable source IDs where practical.
5. Compare row counts, foreign-key orphans, attachment counts, and financial totals.
6. Run calculation parity tests against approved reports only. Workforce must continue to use the latest approved report rather than summing periods.
7. Run both systems in parallel; do not disable the current system until business owners sign off.
8. Rehearse rollback and restore before cutover.

## Not yet safe to claim

This profile is a deployment design, not a completed SQL Server port. The current application still contains Supabase client calls and Supabase-specific authorization/storage behavior. A complete migration requires implementing and testing the API, SQL Server schema, data importer, file-store adapter, and frontend API adapter.

## Information IT must confirm

- Windows Server version and whether IIS is approved.
- SQL Server exact product version, edition, instance name, collation, and compatibility level.
- Whether a separate application VM and file share are available.
- Internal DNS name and TLS certificate process.
- Approved authentication approach (local Identity accounts, Active Directory / Windows authentication, or another institutional IdP).
- VPN subnet/routing and firewall rules.
- Backup destination, retention, and restore owner.
