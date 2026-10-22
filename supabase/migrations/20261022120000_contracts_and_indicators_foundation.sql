-- Additive contracts and indicator foundation. Does not alter public.projects or current report logic.
-- Intentionally NOT applied to the live Supabase database by this feature branch.
BEGIN;

CREATE TABLE IF NOT EXISTS public.contract_types (
  code text PRIMARY KEY CHECK (code ~ '^[a-z0-9_]+$'),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  family text NOT NULL CHECK (family IN ('project_like','framework','service','supply')),
  form_config jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(form_config) = 'object'),
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.contract_types (code,name_ar,name_en,family,form_config,sort_order) VALUES
 ('future_cities','المدن المستقبلية','Future cities','project_like','{"sections":["project","workforce","wages","purchases","services","reports"],"needs_participations":false}'::jsonb,10),
 ('framework_it','العقد الإطاري لتقنية المعلومات','IT framework agreement','framework','{"sections":["framework","participants","suppliers"],"needs_participations":true}'::jsonb,20),
 ('framework_vehicles','العقد الإطاري للمركبات','Vehicles framework agreement','framework','{"sections":["framework","participants","suppliers"],"needs_participations":true}'::jsonb,30),
 ('framework_trucks_equipment','العقد الإطاري للشاحنات والمعدات','Trucks and equipment framework agreement','framework','{"sections":["framework","participants","suppliers"],"needs_participations":true}'::jsonb,40),
 ('framework_student_desks','العقد الإطاري للأدراج الطلابية','Student desks framework agreement','framework','{"sections":["framework","suppliers","local_content"],"needs_participations":false}'::jsonb,50),
 ('framework_school_books','العقد الإطاري للكتب المدرسية','School books framework agreement','framework','{"sections":["framework","suppliers","local_content"],"needs_participations":false}'::jsonb,60),
 ('maintenance','عقود الصيانة','Maintenance contracts','service','{"sections":["service","workforce","wages","purchases","services","reports"],"needs_participations":false}'::jsonb,70),
 ('catering','عقود التغذية','Catering contracts','service','{"sections":["service","workforce","wages","purchases","services","reports"],"needs_participations":false}'::jsonb,80),
 ('supplies','التوريدات','Supplies','supply','{"sections":["supply","supplier","purchases","local_content"],"needs_participations":false}'::jsonb,90)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_type_code text NOT NULL REFERENCES public.contract_types(code),
  title text NOT NULL,
  tender_number text,
  government_entity_id uuid REFERENCES public.government_entities(id) ON DELETE RESTRICT,
  implementing_company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  consultant text,
  sector text,
  contract_status text NOT NULL DEFAULT 'مسند',
  contract_value numeric(18,3) CHECK (contract_value IS NULL OR contract_value >= 0),
  value_basis text NOT NULL DEFAULT 'contract_value' CHECK (value_basis IN ('contract_value','framework_ceiling','not_provided')),
  current_spend numeric(18,3) CHECK (current_spend IS NULL OR current_spend >= 0),
  start_date date,
  end_date date,
  original_end_date date,
  has_local_content_plan boolean,
  company_type text,
  tender_type text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details) = 'object'),
  source_sheet text,
  source_row integer CHECK (source_row IS NULL OR source_row > 0),
  source_reference text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS contracts_type_idx ON public.contracts(contract_type_code);
CREATE INDEX IF NOT EXISTS contracts_status_end_idx ON public.contracts(contract_status,end_date);
CREATE INDEX IF NOT EXISTS contracts_entity_idx ON public.contracts(government_entity_id);
CREATE INDEX IF NOT EXISTS contracts_tender_idx ON public.contracts(tender_number);

-- Framework agreements are recorded once and broken down by beneficiary entity/supplier here.
CREATE TABLE IF NOT EXISTS public.contract_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  government_entity_id uuid NOT NULL REFERENCES public.government_entities(id) ON DELETE RESTRICT,
  company_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
  assigned_value numeric(18,3) CHECK (assigned_value IS NULL OR assigned_value >= 0),
  spend_amount numeric(18,3) CHECK (spend_amount IS NULL OR spend_amount >= 0),
  status text,
  notes text,
  source_sheet text,
  source_row integer CHECK (source_row IS NULL OR source_row > 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contract_participations_contract_idx ON public.contract_participations(contract_id);
CREATE INDEX IF NOT EXISTS contract_participations_entity_idx ON public.contract_participations(government_entity_id);
CREATE INDEX IF NOT EXISTS contract_participations_company_idx ON public.contract_participations(company_id);

CREATE TABLE IF NOT EXISTS public.contract_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  report_year integer NOT NULL CHECK (report_year BETWEEN 2000 AND 2200),
  report_quarter text NOT NULL CHECK (report_quarter IN ('Q1','Q2','Q3','Q4','ANNUAL')),
  report_status text NOT NULL DEFAULT 'draft' CHECK (report_status IN ('draft','submitted','under_review','approved','rejected')),
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(report_data) = 'object'),
  source_file text,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contract_reports_period_idx ON public.contract_reports(report_year,report_quarter,report_status);
CREATE INDEX IF NOT EXISTS contract_reports_contract_idx ON public.contract_reports(contract_id,report_year DESC,created_at DESC);

CREATE TABLE IF NOT EXISTS public.contract_report_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.contract_reports(id) ON DELETE CASCADE,
  category_code text NOT NULL,
  procurement_route text NOT NULL DEFAULT 'not_applicable' CHECK (procurement_route IN ('direct','subcontract','not_applicable')),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  amount numeric(18,3) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  local_content_amount numeric(18,3) CHECK (local_content_amount IS NULL OR local_content_amount >= 0),
  -- Nullable until the coefficient for the specific contract type is confirmed and approved.
  content_coefficient numeric(7,6) CHECK (content_coefficient IS NULL OR content_coefficient BETWEEN 0 AND 1),
  is_sme boolean,
  is_omani_product boolean,
  notes text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(details) = 'object'),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contract_report_items_report_idx ON public.contract_report_items(report_id);
CREATE INDEX IF NOT EXISTS contract_report_items_category_route_idx ON public.contract_report_items(category_code,procurement_route);

CREATE TABLE IF NOT EXISTS public.contract_indicator_definitions (
  code text PRIMARY KEY,
  parent_code text REFERENCES public.contract_indicator_definitions(code) ON DELETE SET NULL,
  group_code text NOT NULL,
  title_ar text NOT NULL,
  title_en text NOT NULL,
  formula_ar text NOT NULL,
  formula_en text NOT NULL,
  scope_note_ar text NOT NULL DEFAULT '',
  target_period numeric(8,6) CHECK (target_period IS NULL OR target_period BETWEEN 0 AND 1),
  target_annual numeric(8,6) CHECK (target_annual IS NULL OR target_annual BETWEEN 0 AND 1),
  workbook_actual numeric(8,6) CHECK (workbook_actual IS NULL OR workbook_actual BETWEEN 0 AND 1),
  workbook_numerator numeric(18,3),
  workbook_denominator numeric(18,3),
  workbook_source_status text NOT NULL DEFAULT 'reference_only'
    CHECK (workbook_source_status IN ('reference_only','missing_formula','available')),
  sort_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.contract_indicator_definitions
 (code,parent_code,group_code,title_ar,title_en,formula_ar,formula_en,scope_note_ar,
  target_period,target_annual,workbook_actual,workbook_numerator,workbook_denominator,workbook_source_status,sort_order)
VALUES
 ('local_content_ratio',NULL,'value','نسبة المحتوى المحلي من إجمالي قيمة العقود الحكومية','Local content as a share of total government contract value',
  'مجموع المحتوى المحلي المحقق ÷ إجمالي قيمة العقود الداخلة في نطاق القياس × 100',
  'Total achieved local content / total value of in-scope government contracts × 100',
  'الصيغ الأصلية في Excel مكسورة (#REF!). لا توجد قيمة فعلية موثوقة في الملف؛ تُحسب بعد استكمال بيانات العقود والتقارير المعتمدة.',
  0.17,0.25,NULL,NULL,NULL,'missing_formula',10),
 ('omanization_compliance',NULL,'compliance','نسبة العقود المستوفية لمتطلبات التعمين','Contracts meeting Omanization requirements',
  'عدد العقود المؤهلة المستوفية للتعمين ÷ عدد العقود المؤهلة قيد التنفيذ والمنتهية في 2026 × 100',
  'Eligible contracts meeting Omanization / eligible in-progress contracts ending in 2026 × 100',
  'مرجع Excel فقط: 22 من 34 عقدًا. نطاق Excel يذكر المشاريع الإنمائية والصيانة والتغذية؛ يجب مطابقة القائمة قبل اعتماد القيمة الحية.',
  0.53,0.80,0.647059,22,34,'available',20),
 ('sme_compliance',NULL,'compliance','نسبة العقود المستوفية لمتطلبات المؤسسات الصغيرة والمتوسطة','Contracts meeting SME requirements',
  'عدد العقود المؤهلة المستوفية لحد الإسناد للمؤسسات الصغيرة والمتوسطة ÷ عدد العقود المؤهلة × 100',
  'Eligible contracts meeting the SME award threshold / eligible contracts × 100',
  'مرجع Excel فقط: 19 من 34 عقدًا. يلزم توحيد تعريف الحد الأدنى لكل نوع عقد قبل احتساب قيمة حية.',
  0.47,0.70,0.558824,19,34,'available',30),
 ('made_in_oman_compliance',NULL,'compliance','نسبة العقود الملتزمة بشراء المنتجات العمانية','Contracts compliant with Made-in-Oman requirements',
  'عدد المشاريع المؤهلة المستوفية لخطة المنتجات العمانية ÷ عدد المشاريع المؤهلة × 100',
  'Eligible projects compliant with their Made-in-Oman plan / eligible projects × 100',
  'مرجع Excel فقط: 17 من 34 عقدًا. عنوان المؤشر يخص المشاريع الإنمائية بينما مقام Excel يساوي 34؛ يلزم تأكيد النطاق قبل اعتماد القيمة الحية.',
  0.47,0.70,0.50,17,34,'available',40),
 ('sme_award_value',NULL,'value','نسبة قيمة العقود المسندة للمؤسسات الصغيرة والمتوسطة','Share of contract value awarded to SMEs',
  'قيمة العقود المسندة للمؤسسات الصغيرة والمتوسطة (مباشر + من الباطن) ÷ إجمالي قيمة المشتريات والمناقصات المشمولة × 100',
  'Value awarded to SMEs (direct + subcontract) / total covered procurement and tender value × 100',
  'المؤشر الإجمالي في Excel لا يحتوي قيمة فعلية أو مستهدفات صالحة؛ يعرض كتجميع فرعي عند توافر بيانات مباشر ومن الباطن.',
  NULL,NULL,NULL,NULL,NULL,'missing_formula',50),
 ('sme_award_direct','sme_award_value','value','أ) نسبة قيمة الإسناد للمؤسسات الصغيرة والمتوسطة (مباشر)','A) Direct awards to SMEs',
  'قيمة الإسناد المباشر للمؤسسات الصغيرة والمتوسطة ÷ إجمالي قيمة المشتريات المباشرة المشمولة × 100',
  'Direct SME awards / total covered direct procurement value × 100',
  'المستهدف والقيمة الفعلية غير معبأين في Excel.',
  NULL,NULL,NULL,NULL,NULL,'missing_formula',51),
 ('sme_award_subcontract','sme_award_value','value','ب) نسبة قيمة الإسناد للمؤسسات الصغيرة والمتوسطة (من الباطن)','B) Subcontract awards to SMEs',
  'قيمة عقود الباطن المسندة للمؤسسات الصغيرة والمتوسطة ÷ إجمالي قيمة عقود الباطن المشمولة × 100',
  'SME subcontract awards / total covered subcontract value × 100',
  'Excel يحدد مستهدفًا مرحليًا 13% فقط؛ لا توجد قيمة فعلية صالحة أو مستهدف سنوي ظاهر.',
  0.13,NULL,NULL,NULL,NULL,'missing_formula',52),
 ('local_product_purchase_share',NULL,'value','نسبة مشتريات المنتج المحلي من إجمالي المشتريات الحكومية','Local products as a share of government purchases',
  'قيمة مشتريات المنتجات المحلية ÷ إجمالي المشتريات الحكومية أو المشتريات ذات الصلة بالعقود × 100',
  'Local product purchases / total government purchases or contract-related purchases × 100',
  'الصيغ الأصلية في Excel مكسورة (#REF!). لا توجد قيمة فعلية موثوقة في الملف.',
  0.07,0.10,NULL,NULL,NULL,'missing_formula',60)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.contract_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_report_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_indicator_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract types valid users read" ON public.contract_types FOR SELECT TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())) AND is_active);
CREATE POLICY "contract types admin insert" ON public.contract_types FOR INSERT TO authenticated
  WITH CHECK (private.user_access_valid((SELECT auth.uid())) AND private.is_admin());
CREATE POLICY "contract types admin update" ON public.contract_types FOR UPDATE TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())) AND private.is_admin())
  WITH CHECK (private.user_access_valid((SELECT auth.uid())) AND private.is_admin());
CREATE POLICY "contract types admin delete" ON public.contract_types FOR DELETE TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())) AND private.is_admin());

CREATE POLICY "contract indicators valid users read" ON public.contract_indicator_definitions FOR SELECT TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())) AND is_active);
CREATE POLICY "contract indicators admin insert" ON public.contract_indicator_definitions FOR INSERT TO authenticated
  WITH CHECK (private.user_access_valid((SELECT auth.uid())) AND private.is_admin());
CREATE POLICY "contract indicators admin update" ON public.contract_indicator_definitions FOR UPDATE TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())) AND private.is_admin())
  WITH CHECK (private.user_access_valid((SELECT auth.uid())) AND private.is_admin());
CREATE POLICY "contract indicators admin delete" ON public.contract_indicator_definitions FOR DELETE TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())) AND private.is_admin());

CREATE POLICY "contracts valid users read" ON public.contracts FOR SELECT TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())));
CREATE POLICY "contracts staff insert" ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (private.user_access_valid((SELECT auth.uid())) AND private.has_valid_role(ARRAY['admin','section_head','editor']));
CREATE POLICY "contracts staff update" ON public.contracts FOR UPDATE TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())) AND private.has_valid_role(ARRAY['admin','section_head','editor']))
  WITH CHECK (private.user_access_valid((SELECT auth.uid())) AND private.has_valid_role(ARRAY['admin','section_head','editor']));
CREATE POLICY "contracts admin delete" ON public.contracts FOR DELETE TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())) AND private.is_admin());

CREATE POLICY "contract participations valid users read" ON public.contract_participations FOR SELECT TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())));
CREATE POLICY "contract participations staff insert" ON public.contract_participations FOR INSERT TO authenticated
  WITH CHECK (private.user_access_valid((SELECT auth.uid())) AND private.has_valid_role(ARRAY['admin','section_head','editor']));
CREATE POLICY "contract participations staff update" ON public.contract_participations FOR UPDATE TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())) AND private.has_valid_role(ARRAY['admin','section_head','editor']))
  WITH CHECK (private.user_access_valid((SELECT auth.uid())) AND private.has_valid_role(ARRAY['admin','section_head','editor']));
CREATE POLICY "contract participations admin delete" ON public.contract_participations FOR DELETE TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())) AND private.is_admin());

CREATE POLICY "contract reports valid users read" ON public.contract_reports FOR SELECT TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())));
CREATE POLICY "contract reports staff insert" ON public.contract_reports FOR INSERT TO authenticated
  WITH CHECK (private.user_access_valid((SELECT auth.uid())) AND private.has_valid_role(ARRAY['admin','section_head','editor']));
CREATE POLICY "contract reports staff update" ON public.contract_reports FOR UPDATE TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())) AND private.has_valid_role(ARRAY['admin','section_head','editor']))
  WITH CHECK (private.user_access_valid((SELECT auth.uid())) AND private.has_valid_role(ARRAY['admin','section_head','editor']));
CREATE POLICY "contract reports admin delete" ON public.contract_reports FOR DELETE TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())) AND private.is_admin());

CREATE POLICY "contract report items valid users read" ON public.contract_report_items FOR SELECT TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())));
CREATE POLICY "contract report items staff insert" ON public.contract_report_items FOR INSERT TO authenticated
  WITH CHECK (private.user_access_valid((SELECT auth.uid())) AND private.has_valid_role(ARRAY['admin','section_head','editor']));
CREATE POLICY "contract report items staff update" ON public.contract_report_items FOR UPDATE TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())) AND private.has_valid_role(ARRAY['admin','section_head','editor']))
  WITH CHECK (private.user_access_valid((SELECT auth.uid())) AND private.has_valid_role(ARRAY['admin','section_head','editor']));
CREATE POLICY "contract report items admin delete" ON public.contract_report_items FOR DELETE TO authenticated
  USING (private.user_access_valid((SELECT auth.uid())) AND private.is_admin());



COMMENT ON TABLE public.contracts IS 'Independent contract register; does not replace or alter public.projects.';
COMMENT ON TABLE public.contract_participations IS 'One row per government entity and supplier usage of a framework agreement.';
COMMENT ON TABLE public.contract_reports IS 'Type-specific report payload; official indicators must use approved reports only.';
COMMENT ON TABLE public.contract_report_items IS 'Normalized financial lines; a null content coefficient means not yet confirmed.';
COMMENT ON TABLE public.contract_indicator_definitions IS 'Workbook KPI catalog; workbook_actual is a historic reference, not a live dashboard value.';

-- Never inherit the default client grants on newly-created public tables.
REVOKE ALL ON TABLE public.contract_types FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.contracts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.contract_participations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.contract_reports FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.contract_report_items FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.contract_indicator_definitions FROM PUBLIC, anon, authenticated;

-- Re-grant only the authenticated application privileges described by the RLS policies.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_participations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_report_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_indicator_definitions TO authenticated;

-- Dictionary rows use code rather than id as the primary key; write a separate audit entry
-- instead of calling the standard UUID-key writer (which groups id-less rows together).
CREATE OR REPLACE FUNCTION private.write_contract_dictionary_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_actor uuid := (SELECT auth.uid());
  v_old jsonb := CASE WHEN tg_op IN ('UPDATE','DELETE') THEN to_jsonb(old) END;
  v_new jsonb := CASE WHEN tg_op IN ('INSERT','UPDATE') THEN to_jsonb(new) END;
  v_id text := coalesce(v_new->>'code', v_old->>'code');
BEGIN
  IF tg_op = 'UPDATE' AND (v_old - ARRAY['updated_at']) = (v_new - ARRAY['updated_at']) THEN
    RETURN new;
  END IF;
  INSERT INTO public.audit_log(actor_user_id, operation, table_name, record_id, old_data, new_data)
  VALUES (v_actor, tg_op, tg_table_name, v_id, v_old, v_new);
  RETURN coalesce(new, old);
END;
$function$;
REVOKE ALL ON FUNCTION private.write_contract_dictionary_audit() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER contract_types_write_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.contract_types
  FOR EACH ROW EXECUTE FUNCTION private.write_contract_dictionary_audit();
CREATE TRIGGER contract_indicator_definitions_write_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.contract_indicator_definitions
  FOR EACH ROW EXECUTE FUNCTION private.write_contract_dictionary_audit();

-- Protect official report approvals, and prevent staff from editing data after approval.
CREATE OR REPLACE FUNCTION private.guard_contract_report_approval()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
  IF NOT private.has_valid_role(ARRAY['admin']::text[]) THEN
    IF TG_OP = 'INSERT' AND NEW.report_status = 'approved' THEN
      RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'ACCESS_DENIED';
    END IF;
    IF TG_OP = 'UPDATE' THEN
      -- Once approved, staff cannot change any substantive field (including the contract,
      -- year, or quarter to which the approval applies). Admins may amend through the audited path.
      IF OLD.report_status = 'approved'
         AND (to_jsonb(NEW) - ARRAY['updated_at','updated_by'])
             IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['updated_at','updated_by']) THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'ACCESS_DENIED';
      END IF;
      IF NEW.report_status = 'approved' AND OLD.report_status IS DISTINCT FROM 'approved' THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'ACCESS_DENIED';
      END IF;
      IF NEW.approved_at IS DISTINCT FROM OLD.approved_at
         OR NEW.approved_by IS DISTINCT FROM OLD.approved_by THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'ACCESS_DENIED';
      END IF;
    END IF;
  END IF;

  IF NEW.report_status = 'approved' THEN
    NEW.approved_at := coalesce(NEW.approved_at, now());
    NEW.approved_by := coalesce(NEW.approved_by, (SELECT auth.uid()));
  ELSE
    NEW.approved_at := NULL;
    NEW.approved_by := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.guard_contract_report_approval() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER contract_reports_guard_approval
  BEFORE INSERT OR UPDATE ON public.contract_reports
  FOR EACH ROW EXECUTE FUNCTION private.guard_contract_report_approval();

-- Reuse the platform's existing protected audit writer on records with UUID primary keys.
DROP TRIGGER IF EXISTS contracts_write_audit ON public.contracts;
CREATE TRIGGER contracts_write_audit AFTER INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION private.write_audit();
DROP TRIGGER IF EXISTS contract_participations_write_audit ON public.contract_participations;
CREATE TRIGGER contract_participations_write_audit AFTER INSERT OR UPDATE OR DELETE ON public.contract_participations
  FOR EACH ROW EXECUTE FUNCTION private.write_audit();
DROP TRIGGER IF EXISTS contract_reports_write_audit ON public.contract_reports;
CREATE TRIGGER contract_reports_write_audit AFTER INSERT OR UPDATE OR DELETE ON public.contract_reports
  FOR EACH ROW EXECUTE FUNCTION private.write_audit();
DROP TRIGGER IF EXISTS contract_report_items_write_audit ON public.contract_report_items;
CREATE TRIGGER contract_report_items_write_audit AFTER INSERT OR UPDATE OR DELETE ON public.contract_report_items
  FOR EACH ROW EXECUTE FUNCTION private.write_audit();

COMMIT;
