-- Remove table-level capabilities not required by the browser application.
-- Keep normal SELECT/INSERT/UPDATE/DELETE grants governed by RLS policies.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM authenticated;
