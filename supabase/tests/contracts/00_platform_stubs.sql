-- Minimal replica of platform dependencies for an isolated contracts migration smoke test.
-- This file is used only by the feature-branch CI database, not by production.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END
$roles$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA auth, public, private TO anon, authenticated;

CREATE TABLE auth.users(id uuid PRIMARY KEY, email text UNIQUE);
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid LANGUAGE sql STABLE
AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;

CREATE TABLE public.government_entities(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, code text);
CREATE TABLE public.companies(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, company_type text);
CREATE TABLE public.audit_log(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_user_id uuid,
 operation text NOT NULL,
 table_name text NOT NULL,
 record_id text,
 old_data jsonb,
 new_data jsonb,
 changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.projects(id uuid PRIMARY KEY, project_name text NOT NULL);
INSERT INTO public.projects(id, project_name)
VALUES ('7022f5ea-8dfb-453b-b1e6-8a7665b0a19a','Keep this development project unchanged');

CREATE OR REPLACE FUNCTION private.user_access_valid(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SET search_path TO ''
AS $$ SELECT p_user_id IS NOT NULL $$;
CREATE OR REPLACE FUNCTION private.has_valid_role(p_roles text[])
RETURNS boolean LANGUAGE sql STABLE SET search_path TO ''
AS $$ SELECT coalesce(current_setting('test.role', true) = ANY(p_roles), false) $$;
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean LANGUAGE sql STABLE SET search_path TO ''
AS $$ SELECT coalesce(current_setting('test.role', true) = 'admin', false) $$;

CREATE OR REPLACE FUNCTION private.write_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $audit$
DECLARE
  v_old jsonb := CASE WHEN tg_op IN ('UPDATE','DELETE') THEN to_jsonb(old) END;
  v_new jsonb := CASE WHEN tg_op IN ('INSERT','UPDATE') THEN to_jsonb(new) END;
  v_id text := coalesce(v_new->>'id', v_old->>'id');
BEGIN
  INSERT INTO public.audit_log(actor_user_id,operation,table_name,record_id,old_data,new_data)
  VALUES ((SELECT auth.uid()),tg_op,tg_table_name,v_id,v_old,v_new);
  IF tg_op = 'DELETE' THEN RETURN old; ELSE RETURN new; END IF;
END
$audit$;
GRANT EXECUTE ON FUNCTION private.user_access_valid(uuid), private.has_valid_role(text[]), private.is_admin() TO authenticated;
