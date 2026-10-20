-- Minimal stand-ins for the Supabase platform pieces the app schema depends on.
DO $$ BEGIN CREATE ROLE anon NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role NOLOGIN BYPASSRLS; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE SCHEMA auth;
CREATE SCHEMA storage;
CREATE SCHEMA private;
CREATE SCHEMA cron;
GRANT USAGE ON SCHEMA public, auth, storage, private TO anon, authenticated, service_role;

CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}'::jsonb);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
$$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;

CREATE TABLE storage.objects (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, bucket_id text, name text);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT ALL ON storage.objects TO authenticated;
CREATE FUNCTION storage.foldername(name text) RETURNS text[] LANGUAGE sql IMMUTABLE AS
$$ SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
GRANT EXECUTE ON FUNCTION storage.foldername(text) TO authenticated;

-- pg_cron stand-in (the real extension is enabled by the migration on Supabase).
CREATE TABLE cron.job (jobname text PRIMARY KEY, schedule text, command text);
CREATE FUNCTION cron.schedule(p_name text, p_schedule text, p_command text) RETURNS bigint LANGUAGE sql AS
$$ INSERT INTO cron.job VALUES (p_name, p_schedule, p_command)
   ON CONFLICT (jobname) DO UPDATE SET schedule = excluded.schedule, command = excluded.command; SELECT 1::bigint $$;
CREATE FUNCTION cron.unschedule(p_name text) RETURNS boolean LANGUAGE sql AS
$$ DELETE FROM cron.job WHERE jobname = p_name; SELECT true $$;
