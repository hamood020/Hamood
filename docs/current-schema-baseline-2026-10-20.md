# Live database schema baseline — 2026-10-20

This document records the live public-table shape checked against Supabase project `bmwtrnosqosbkezdswcx` on 2026-10-20. It is a reference snapshot, not a replayable migration. The source of truth remains the live database until a tested baseline migration is generated.

## Public tables inspected

| Table | Purpose |
|---|---|
| `projects` | Projects and database-computed local-content metrics |
| `quarterly_reports` | Project quarterly reports and report payloads |
| `local_content_plans` | Local-content plan versions and plan payloads |
| `project_baselines` | Captured project baseline values |
| `project_plan_documents` | Private storage metadata for plan documents |
| `project_end_date_history` | History of project end-date changes |
| `government_entities` | Government entity directory and staff-only contacts |
| `companies` | Company directory and staff-only contacts |
| `user_profiles` | Application role, activation, and access-period profile |
| `user_entity_assignments` | User-to-government-entity assignments |
| `user_notification_settings` | Per-user notification preferences |
| `notifications` | User notifications and read state |
| `employee_followups` | Employee follow-up tasks and closure details |
| `audit_log` | Audit trail of database changes |
| `platform_settings` | Global platform settings JSON |

## Key live schema details confirmed

- `projects` includes computed metric columns such as `total_spend`, `total_local_content`, `local_content_spend_pct`, `local_content_project_pct`, `sme_pct`, `goods_pct`, `services_pct`, `omanization_pct`, `compliance_status`, and `metrics_updated_at`.
- `quarterly_reports` stores report payloads in `report_data jsonb`; the report status and period are separate columns.
- `local_content_plans` stores plan data in `plan_data jsonb`.
- `government_entities.contact_points` and `companies.contact_points` are JSONB arrays; application access is intentionally mediated through guarded RPCs for staff.
- `user_profiles` uses `role`, `is_active`, `access_starts_at`, and `access_expires_at`; new profiles default to inactive viewers.
- `employee_followups` records `created_by`, `resolved_by`, `resolved_by_name`, `resolved_at`, and `resolution_note`.
- `platform_settings.settings` is JSONB and is the persisted source for configurable thresholds, statuses, required fields, notification preferences, and display preferences.

## Backup and migration policy

- Keep the live Oct 20 backup schema until a separate verified recovery test establishes that it can be restored.
- Do not use this descriptive document as SQL to overwrite or rebuild production.
- For future schema changes: capture a backup, write a timestamped migration, run tests, apply to production, then update this document from the live schema.
