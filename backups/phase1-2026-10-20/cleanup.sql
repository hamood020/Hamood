-- Agreed data cleanup — run after backup.sql (the rows are copied there first).
BEGIN;
-- Test project «00» and its report/plan/notes (ON DELETE CASCADE).
DELETE FROM public.projects WHERE id = '94b81e01-5458-4ae6-a12f-76edd93294dc' AND project_name = '00';
-- Test company «aa», only if no project uses it any more.
DELETE FROM public.companies c WHERE c.name = 'aa'
  AND NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.implementing_company_id = c.id);
COMMIT;

-- Storage files with no record pointing to them (removed through the Storage API, not SQL):
-- project-plan-documents:
--   14afa612-f2d8-4fe4-a9c1-c1dd574489b2/217ba5ae-14a2-44ab-a4ff-9d1d71f730a2-ScanDocument_20261006_072449.pdf
--   14afa612-f2d8-4fe4-a9c1-c1dd574489b2/2f961f70-b9d1-4004-bf26-801ee19e404b-ScanDocument_20261006_073039.pdf
--   14afa612-f2d8-4fe4-a9c1-c1dd574489b2/9f593c90-a935-4221-a7fb-7241edec4ca2-ScanDocument_20261006_072449.pdf
--   14afa612-f2d8-4fe4-a9c1-c1dd574489b2/a0b56671-50c8-4943-8094-832f6668ff91-ScanDocument_20261006_111347.pdf
-- project-report-documents:
--   7022f5ea-8dfb-453b-b1e6-8a7665b0a19a/75cbe935-4b61-498a-be29-a5f8d19d3358/98d33ed7-d1ed-4c54-a424-a859ac3cc1ba-Lima_Dam_-_Q3-6_7_8.xlsx
--   94b81e01-5458-4ae6-a12f-76edd93294dc/5e3d5ac0-5db3-410c-8a39-794c08ea2179/2cd84ebf-…-ICV_Lima-3_4_5.xlsx (goes with project «00»)
