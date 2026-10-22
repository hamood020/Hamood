-- Contract foundation smoke tests. Run after 00_platform_stubs.sql and the new migration.
BEGIN;
INSERT INTO auth.users(id,email) VALUES ('00000000-0000-0000-0000-0000000000e1','contracts-editor@example.test');
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000e1',true);
SELECT set_config('test.role','editor',true);

DO $assert$
DECLARE
  n integer;
  t text;
BEGIN
  SELECT count(*) INTO n FROM public.contract_types WHERE is_active;
  IF n <> 9 THEN RAISE EXCEPTION 'Expected 9 active contract types, got %', n; END IF;
  SELECT count(*) INTO n FROM public.contract_indicator_definitions WHERE is_active;
  IF n <> 8 THEN RAISE EXCEPTION 'Expected 8 workbook indicator definitions, got %', n; END IF;
  FOREACH t IN ARRAY ARRAY['contract_types','contracts','contract_participations','contract_reports','contract_report_items','contract_indicator_definitions'] LOOP
    IF NOT (SELECT c.relrowsecurity FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace WHERE ns.nspname='public' AND c.relname=t) THEN
      RAISE EXCEPTION 'RLS is not enabled for public.%', t;
    END IF;
  END LOOP;
  IF has_table_privilege('anon','public.contracts','select') THEN
    RAISE EXCEPTION 'anon must not be granted SELECT on contracts';
  END IF;
  IF NOT has_table_privilege('authenticated','public.contracts','select') THEN
    RAISE EXCEPTION 'authenticated must have the required SELECT grant on contracts';
  END IF;
  IF (SELECT project_name FROM public.projects WHERE id='7022f5ea-8dfb-453b-b1e6-8a7665b0a19a') <> 'Keep this development project unchanged' THEN
    RAISE EXCEPTION 'The existing projects table was changed by the additive migration';
  END IF;
END
$assert$;

SET LOCAL ROLE authenticated;
INSERT INTO public.contracts(id,contract_type_code,title,contract_status,value_basis,contract_value)
VALUES ('10000000-0000-0000-0000-000000000001','supplies','CI contract row','قيد التنفيذ','contract_value',100.000);

-- Editors cannot self-approve a contract report.
DO $approval$
BEGIN
  BEGIN
    INSERT INTO public.contract_reports(contract_id,report_year,report_quarter,report_status,report_data)
    VALUES ('10000000-0000-0000-0000-000000000001',2026,'Q1','approved','{"local_content_achieved":20}'::jsonb);
    RAISE EXCEPTION 'Expected editor approval to be denied';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END
$approval$;

INSERT INTO public.contract_reports(id,contract_id,report_year,report_quarter,report_status,report_data)
VALUES ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',2026,'Q1','submitted','{"local_content_achieved":20,"direct_sme_awards":10,"direct_procurement_total":50}'::jsonb);

INSERT INTO public.contract_report_items(report_id,category_code,procurement_route,amount,local_content_amount,is_sme,is_omani_product)
VALUES ('20000000-0000-0000-0000-000000000001','made_in_oman','direct',50,35,true,true);

-- The staff role cannot update a submitted report into approved.
DO $approval_update$
BEGIN
  BEGIN
    UPDATE public.contract_reports SET report_status='approved'
    WHERE id='20000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'Expected editor report approval update to be denied';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END
$approval_update$;

RESET ROLE;
DO $post$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.contracts WHERE id='10000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'Staff contract insert did not persist within the transaction';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.contract_report_items WHERE report_id='20000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'Contract report line item was not saved';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.audit_log WHERE table_name='contracts' AND record_id='10000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'Contract audit trigger did not write the audit log';
  END IF;
END
$post$;
ROLLBACK;
