# Internal SQL Server API — staging baseline

This migration is a SQL Server translation of the checked-in PostgreSQL reference snapshot, not a verified export of the live Supabase schema. Apply only to a new, isolated staging database after DBA review.

## Apply
1. Create an empty database such as `ICV_Internal_Staging`.
2. Take a backup (even for staging) and verify the connection string points only to that database.
3. Execute `database/sqlserver/001-internal-baseline.sql` using SQL Server Management Studio.
4. Run the ASP.NET Core API with a protected `ConnectionStrings__IcvSqlServer` secret.
5. Create initial Identity accounts through a controlled admin provisioning process; do not migrate Supabase password hashes or keys.

## Important compatibility notes
- The 16 business tables in this script preserve the reference snapshot's business columns, using `uniqueidentifier`, `datetimeoffset`, `decimal`, and validated JSON stored as `nvarchar(max)`.
- Identity uses ASP.NET Core Identity tables (AspNetUsers etc.) and is separate from `user_profiles`; both use GUID-compatible user identifiers. A provisioning workflow must create the Identity user and matching profile in one transaction.
- The reference snapshot's storage objects (such as `project-report-documents`) are Supabase Storage buckets, not relational tables. Files must be copied separately to a protected NTFS share and metadata persisted before enabling file endpoints.
- `user_entity_assignments` is retained as administrative assignment metadata. It must NOT filter project visibility or editing for authorized department staff.
- Authorized staff roles are admin, section_head, editor. viewer and temporary_viewer are read-only. temporary_viewer expiry and account active/start/end checks must be enforced server-side.
- No production data, Supabase credentials, auth hashes, or storage files are copied by this migration.
- Verify all constraints, defaults, sequences, triggers, indexes, live migrations and any columns added after the 2026-10-20 snapshot before production adoption.
