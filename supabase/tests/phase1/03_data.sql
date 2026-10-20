INSERT INTO auth.users(id, email) VALUES
 ('00000000-0000-0000-0000-00000000000a','admin@icv-new.local'),
 ('00000000-0000-0000-0000-00000000000b','admin2@icv-new.local'),
 ('00000000-0000-0000-0000-00000000000e','editor@icv-new.local'),
 ('00000000-0000-0000-0000-00000000000f','viewer@icv-new.local');
UPDATE public.user_profiles SET role='admin', is_active=true, username='admin' WHERE id='00000000-0000-0000-0000-00000000000a';
UPDATE public.user_profiles SET role='admin', is_active=true, username='admin2' WHERE id='00000000-0000-0000-0000-00000000000b';
UPDATE public.user_profiles SET role='editor', is_active=true, username='editor' WHERE id='00000000-0000-0000-0000-00000000000e';
UPDATE public.user_profiles SET role='viewer', is_active=true, username='viewer' WHERE id='00000000-0000-0000-0000-00000000000f';
INSERT INTO public.government_entities(id,name) VALUES
 ('68a312e7-6696-47fb-baed-57efc28ade1f','وزارة الثروة الزراعية والسمكية وموارد المياه'),
 ('6792f194-d519-4aa6-90a2-77f8eed9dcfa','جهة 2');
INSERT INTO public.user_entity_assignments(user_id, government_entity_id) VALUES
 ('00000000-0000-0000-0000-00000000000e','68a312e7-6696-47fb-baed-57efc28ade1f');
INSERT INTO public.companies(id,name) VALUES ('11111111-1111-1111-1111-111111111111','شركة الأولى'),('22222222-2222-2222-2222-222222222222','aa');
INSERT INTO public.projects(id,project_name,government_entity_id,implementing_company_id,total_project_value,start_date,end_date,local_content_plan,project_status,total_spend,total_local_content,sme_pct) VALUES
 ('7022f5ea-8dfb-453b-b1e6-8a7665b0a19a','مشروع ليما','68a312e7-6696-47fb-baed-57efc28ade1f','11111111-1111-1111-1111-111111111111',23998850,'2025-12-01','2028-02-28',true,'قيد التنفيذ',1245077.34,602056.02,2.213787),
 ('94b81e01-5458-4ae6-a12f-76edd93294dc','00','6792f194-d519-4aa6-90a2-77f8eed9dcfa','22222222-2222-2222-2222-222222222222',2,'2026-01-01','2027-01-01',true,'مسند',0,0,0);
INSERT INTO public.quarterly_reports(id,project_id,quarter,annual_period,status,created_by,report_data) VALUES
 ('9f777d0c-ea8a-42c1-93ee-6132813dad42','7022f5ea-8dfb-453b-b1e6-8a7665b0a19a','Q1','2026','معتمد','00000000-0000-0000-0000-00000000000e',
  '{"services":{"sme_service":77717.303,"local_service":0,"foreign_service":4410},"purchases":{"made_in_oman":0,"sme_purchase":52181.163,"direct_import":10196.646,"local_supplier":42647.364},"omani_total":16,"report_type":"ربعي منفصل","omani_salary":25611,"subcontracts":{"sme":32250.25,"local":24664.5,"foreign":8400},"foreign_total":39,"foreign_salary":37586.1,"workforce_total":55,"salary_input_type":"رواتب الربع"}'),
 ('994f287e-5dac-4dba-b380-ce81d22bdc8d','7022f5ea-8dfb-453b-b1e6-8a7665b0a19a','Q2','2026','معتمد','00000000-0000-0000-0000-00000000000e',
  '{"services":{"sme_service":44904.46,"local_service":8439.75,"foreign_service":0},"purchases":{"made_in_oman":5130,"sme_purchase":49412.397,"direct_import":0,"local_supplier":141251.1},"omani_total":16,"report_type":"ربعي منفصل","omani_salary":20353,"subcontracts":{"sme":75923.726,"local":1217.11,"foreign":0},"foreign_total":34,"foreign_salary":37758.9,"workforce_total":50,"salary_input_type":"رواتب الربع"}'),
 ('75cbe935-4b61-498a-be29-a5f8d19d3358','7022f5ea-8dfb-453b-b1e6-8a7665b0a19a','Q3','2026','معتمد','00000000-0000-0000-0000-00000000000e',
  '{"services":{"sme_service":60058.17,"local_service":80275.129,"foreign_service":0},"purchases":{"made_in_oman":15015.3,"sme_purchase":91829.7,"direct_import":700,"local_supplier":27482.54},"omani_total":16,"report_type":"ربعي منفصل","omani_salary":25755,"subcontracts":{"sme":91704.11,"local":110250,"foreign":4193.719},"foreign_total":34,"foreign_salary":37758.9,"workforce_total":50,"salary_input_type":"رواتب الربع"}'),
 ('5e3d5ac0-5db3-410c-8a39-794c08ea2179','94b81e01-5458-4ae6-a12f-76edd93294dc','Q1','2026','معتمد','00000000-0000-0000-0000-00000000000e',
  '{"services":{"sme_service":0,"local_service":0,"foreign_service":0},"purchases":{"made_in_oman":0,"sme_purchase":0,"direct_import":0,"local_supplier":0},"omani_total":0,"report_type":"ربعي منفصل","omani_salary":0,"subcontracts":{"sme":0,"local":0,"foreign":0},"foreign_total":0,"foreign_salary":0,"workforce_total":0,"salary_input_type":"رواتب الربع"}');
INSERT INTO public.platform_settings(id, settings) VALUES ('global', '{"refs": {"supplyTypes": ["صنع في عمان", "مورد محلي", "استيراد مباشر", "SME"], "supplierTypes": ["محلي", "أجنبي", "SME"]}, "audit": {"enabled": true, "retention": 365}, "local": {"sme": 10, "goodsMin": 40, "madeInOman": 70, "smeService": 70, "omaniSalary": 80, "omanization": 30, "servicesMin": 10, "smePurchase": 18, "directImport": 6, "localService": 70, "foreignSalary": 20, "localSupplier": 18, "foreignService": 10, "smeSubcontract": 70}, "users": {"roles": ["مدير النظام"], "entityAccess": true}, "general": {"platformName": "متابعة المحتوى المحلي"}, "reports": {"type": "ربعي منفصل", "dueDays": 30, "lockApproved": true}, "projects": {}, "notifications": {"delay": true, "approval": true, "reportDue": true, "daysBefore": 10, "planUpdate": true, "projectExpiry": true}}');
DELETE FROM public.audit_log;
