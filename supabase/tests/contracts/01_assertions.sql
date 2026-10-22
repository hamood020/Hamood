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

INSERT INTO public.government_entities(id,name) VALUES
 ('60000000-0000-0000-0000-000000000001','CI beneficiary entity');
INSERT INTO public.companies(id,name,company_type) VALUES
 ('70000000-0000-0000-0000-000000000001','CI supplier','SME');

SET LOCAL ROLE authenticated;
-- Excel import is one atomic RPC: contract + entity/supplier participation.
SELECT public.import_contract_batch(
 '[{
    "contract":{
      "contract_type_code":"supplies",
      "title":"CI imported contract",
      "tender_number":"CI-IMPORT-001",
      "contract_status":"قيد التنفيذ",
      "value_basis":"not_provided",
      "current_spend":100,
      "source_sheet":"التوريدات",
      "source_row":2,
      "source_reference":"supplies|ci-import-001",
      "details":{"workbook_snapshot":{"source":"CI"}}
    },
    "participations":[{
      "government_entity_id":"60000000-0000-0000-0000-000000000001",
      "company_id":"70000000-0000-0000-0000-000000000001",
      "spend_amount":100,
      "details":{"workbook_factor":0.18},
      "source_sheet":"التوريدات",
      "source_row":2
    }]
 }]'::jsonb
);

-- Invalid child participation must roll back the contract row as well.
DO $atomic_import$
BEGIN
  BEGIN
    PERFORM public.import_contract_batch(
      '[{
        "contract":{
          "contract_type_code":"supplies",
          "title":"CI atomic rollback probe",
          "source_sheet":"التوريدات",
          "source_row":99,
          "source_reference":"supplies|atomic-probe"
        },
        "participations":[{
          "government_entity_id":"60000000-0000-0000-0000-000000000001",
          "company_id":"99999999-9999-9999-9999-999999999999",
          "spend_amount":50
        }]
      }]'::jsonb
    );
    RAISE EXCEPTION 'Expected the missing supplier foreign key to abort the import';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;
  IF EXISTS (SELECT 1 FROM public.contracts WHERE title='CI atomic rollback probe') THEN
    RAISE EXCEPTION 'Atomic import left a partial contract record';
  END IF;
END
$atomic_import$;

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

-- Editors cannot reject or bypass the section-head review step.
DO $editor_transition$
BEGIN
  BEGIN
    UPDATE public.contract_reports SET report_status='rejected'
    WHERE id='20000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'Expected editor rejection to be denied';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    UPDATE public.contract_reports SET report_data=report_data || '{"local_content_achieved":999}'::jsonb
    WHERE id='20000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'Expected a submitted payload edit to be denied';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END
$editor_transition$;

SELECT set_config('test.role','section_head',true);
UPDATE public.contract_reports SET report_status='under_review'
WHERE id='20000000-0000-0000-0000-000000000001';
SELECT set_config('test.role','editor',true);

-- Administrator may approve; after approval, staff must not be able to move the report
-- to a different reporting period (or otherwise change its substantive fields).
SELECT set_config('test.role','admin',true);
UPDATE public.contract_reports
SET report_status='approved'
WHERE id='20000000-0000-0000-0000-000000000001';
SELECT set_config('test.role','editor',true);

DO $approved_lock$
BEGIN
  BEGIN
    UPDATE public.contract_reports SET report_year=2027
    WHERE id='20000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'Expected an approved report retarget to be denied';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END
$approved_lock$;

RESET ROLE;
DO $post$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.contracts WHERE id='10000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'Staff contract insert did not persist within the transaction';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.contract_report_items WHERE report_id='20000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'Contract report line item was not saved';
  END IF;
  IF (SELECT report_status FROM public.contract_reports WHERE id='20000000-0000-0000-0000-000000000001') <> 'approved'
     OR (SELECT report_year FROM public.contract_reports WHERE id='20000000-0000-0000-0000-000000000001') <> 2026 THEN
    RAISE EXCEPTION 'Approved report status or period changed unexpectedly';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.audit_log WHERE table_name='contracts' AND record_id='10000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'Contract audit trigger did not write the audit log';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.contracts WHERE title='CI imported contract' AND source_reference='supplies|ci-import-001') THEN
    RAISE EXCEPTION 'The atomic import RPC did not create its main contract';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.contract_participations WHERE spend_amount=100 AND company_id='70000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'The atomic import RPC did not create the supplier participation';
  END IF;
END
$post$;
ROLLBACK;
