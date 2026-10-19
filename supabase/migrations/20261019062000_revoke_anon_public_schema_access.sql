-- Remove direct SQL table/view and sequence privileges from unauthenticated clients.
-- RLS remains the row-level authorization layer for authenticated users.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;
