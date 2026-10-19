-- Optimize policy expressions without changing authorization conditions.
DO $$
DECLARE p record; q text; w text; roles_sql text; kind text;
BEGIN
  FOR p IN
    SELECT * FROM pg_policies
    WHERE schemaname = 'public'
      AND (coalesce(qual,'') LIKE '%auth.uid()%' OR coalesce(with_check,'') LIKE '%auth.uid()%')
  LOOP
    q := CASE WHEN p.qual IS NULL THEN NULL ELSE replace(p.qual, 'auth.uid()', '(select auth.uid())') END;
    w := CASE WHEN p.with_check IS NULL THEN NULL ELSE replace(p.with_check, 'auth.uid()', '(select auth.uid())') END;
    roles_sql := array_to_string(p.roles, ', ');
    kind := CASE WHEN p.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END;
    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    EXECUTE format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s',
      p.policyname, p.schemaname, p.tablename, kind, p.cmd, roles_sql,
      CASE WHEN q IS NOT NULL THEN format(' USING (%s)', q) ELSE '' END,
      CASE WHEN w IS NOT NULL THEN format(' WITH CHECK (%s)', w) ELSE '' END);
  END LOOP;
END $$;

-- Replace broad ALL policies with equivalent write-only policies so their SELECT
-- permission does not overlap with the valid-user read policy.
DO $$
DECLARE p record; roles_sql text; kind text; q text; w text;
BEGIN
  FOR p IN
    SELECT * FROM pg_policies
    WHERE schemaname='public' AND cmd='ALL'
      AND tablename IN ('companies','government_entities','local_content_plans',
                        'project_baselines','quarterly_reports','user_entity_assignments',
                        'user_notification_settings')
  LOOP
    roles_sql := array_to_string(p.roles, ', ');
    kind := CASE WHEN p.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END;
    q := p.qual; w := p.with_check;
    EXECUTE format('DROP POLICY %I ON %I.%I',p.policyname,p.schemaname,p.tablename);
    IF p.tablename <> 'government_entities' THEN
      EXECUTE format('CREATE POLICY %I ON %I.%I AS %s FOR INSERT TO %s%s',
        left(p.policyname || ' insert',63),p.schemaname,p.tablename,kind,roles_sql,
        CASE WHEN w IS NOT NULL THEN format(' WITH CHECK (%s)',w) ELSE '' END);
    END IF;
    EXECUTE format('CREATE POLICY %I ON %I.%I AS %s FOR UPDATE TO %s%s%s',
      left(p.policyname || ' update',63),p.schemaname,p.tablename,kind,roles_sql,
      CASE WHEN q IS NOT NULL THEN format(' USING (%s)',q) ELSE '' END,
      CASE WHEN w IS NOT NULL THEN format(' WITH CHECK (%s)',w) ELSE '' END);
    EXECUTE format('CREATE POLICY %I ON %I.%I AS %s FOR DELETE TO %s%s',
      left(p.policyname || ' delete',63),p.schemaname,p.tablename,kind,roles_sql,
      CASE WHEN q IS NOT NULL THEN format(' USING (%s)',q) ELSE '' END);
  END LOOP;
END $$;
