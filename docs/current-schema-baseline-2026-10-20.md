# Live database schema baseline — 2026-10-20

Project: `bmwtrnosqosbkezdswcx`

This file is a **read-only introspection script** for capturing the live schema. It is intentionally not a replay migration: do not run the output as DDL and do not use it to overwrite production. It excludes row contents and secrets.

Run each query in Supabase SQL Editor and save the result alongside this file when taking a release backup.

## 1. Tables, views, and columns

```sql
select
  c.table_schema, c.table_name, c.table_type,
  col.ordinal_position, col.column_name, col.data_type, col.udt_name,
  col.is_nullable, col.column_default
from information_schema.tables c
left join information_schema.columns col
  on col.table_schema = c.table_schema and col.table_name = c.table_name
where c.table_schema in ('public','private')
order by c.table_schema, c.table_name, col.ordinal_position;
```

## 2. Constraints

```sql
select n.nspname as schema_name, t.relname as table_name,
       con.conname as constraint_name, con.contype as constraint_type,
       pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_class t on t.oid = con.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname in ('public','private')
order by 1,2,3;
```

## 3. Indexes

```sql
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname in ('public','private')
order by schemaname, tablename, indexname;
```

## 4. Row-level security and policies

```sql
select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public','private') and c.relkind = 'r'
order by 1,2;

select schemaname, tablename, policyname, permissive, roles,
       cmd, qual as using_expression, with_check as check_expression
from pg_policies
where schemaname in ('public','private')
order by schemaname, tablename, policyname;
```

## 5. Functions and triggers

```sql
select n.nspname as schema_name, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       pg_get_function_result(p.oid) as returns,
       p.prosecdef as security_definer,
       pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public','private')
order by 1,2,3;

select trigger_schema, event_object_table, trigger_name,
       event_manipulation, action_timing, action_statement
from information_schema.triggers
where trigger_schema in ('public','private')
order by 1,2,3;
```

## 6. Storage buckets (metadata only)

```sql
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
order by name;
```

## 7. Application tables observed in the live project

The public schema includes the core application tables: `projects`, `government_entities`, `companies`, `quarterly_reports`, `local_content_plans`, `project_plan_documents`, `project_baselines`, `project_end_date_history`, `user_profiles`, `user_entity_assignments`, `user_notification_settings`, `platform_settings`, `employee_followups`, `audit_log`, and `notifications`. The live schema also exposes `user_entity_assignments_view` and `user_management`.

## Backup and change safety

- Create and verify a database backup before any destructive DDL.
- Capture query results from sections 1–6 before and after migrations.
- Keep credentials, access tokens, auth secrets, and application row data out of this baseline.
- The separate branch `backup/pre-work-2026-10-20` is a **code** snapshot only; it is not a database backup.
- Do not delete the `icv-new-app` Edge Function or orphaned storage objects as part of this work; those were explicitly excluded.
