-- Project location: one or more governorates, each with optional wilayats.
-- Stored as {"<governorate>": ["<wilayat>", ...], ...}; an empty list means the whole governorate.
-- Additive only: no existing column or row is changed except the one backfill at the end.
-- Rollback: ALTER TABLE public.projects DROP COLUMN location; DROP FUNCTION private.valid_project_location(jsonb);

CREATE OR REPLACE FUNCTION private.valid_project_location(loc jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  WITH ref(gov, wils) AS (
    VALUES
      ('مسقط', ARRAY['مسقط','مطرح','بوشر','السيب','العامرات','قريات']),
      ('ظفار', ARRAY['صلالة','طاقة','مرباط','رخيوت','ثمريت','ضلكوت','المزيونة','مقشن','شليم وجزر الحلانيات','سدح']),
      ('مسندم', ARRAY['خصب','دبا','بخا','مدحاء']),
      ('البريمي', ARRAY['البريمي','محضة','السنينة']),
      ('الداخلية', ARRAY['نزوى','بهلا','منح','الحمراء','أدم','إزكي','سمائل','بدبد','الجبل الأخضر']),
      ('شمال الباطنة', ARRAY['صحار','شناص','لوى','صحم','الخابورة','السويق']),
      ('جنوب الباطنة', ARRAY['الرستاق','العوابي','نخل','وادي المعاول','بركاء','المصنعة']),
      ('جنوب الشرقية', ARRAY['صور','الكامل والوافي','جعلان بني بو حسن','جعلان بني بو علي','مصيرة']),
      ('شمال الشرقية', ARRAY['إبراء','المضيبي','بدية','القابل','وادي بني خالد','دماء والطائيين','سناو']),
      ('الظاهرة', ARRAY['عبري','ينقل','ضنك']),
      ('الوسطى', ARRAY['هيماء','محوت','الدقم','الجازر'])
  )
  SELECT jsonb_typeof(loc) = 'object'
     AND NOT EXISTS (
       SELECT 1
       FROM jsonb_each(loc) e
       LEFT JOIN ref r ON r.gov = e.key
       WHERE r.gov IS NULL
          OR jsonb_typeof(e.value) <> 'array'
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(e.value) w
            WHERE jsonb_typeof(w) <> 'string' OR NOT ((w #>> '{}') = ANY (r.wils))
          )
     );
$$;

REVOKE ALL ON FUNCTION private.valid_project_location(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.valid_project_location(jsonb) TO authenticated, service_role;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS location jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_location_valid CHECK (private.valid_project_location(location));

COMMENT ON COLUMN public.projects.location IS
  'Governorates and wilayats: {"governorate": ["wilayat", ...]}; empty list = whole governorate.';

-- Projects use column-level UPDATE grants (phase 1); staff may edit the location.
GRANT UPDATE (location) ON public.projects TO authenticated;

-- Backfill the one live project whose name states its location ("... بولاية خصب بمحافظة مسندم").
UPDATE public.projects
SET location = '{"مسندم": ["خصب"]}'::jsonb
WHERE id = '7022f5ea-8dfb-453b-b1e6-8a7665b0a19a' AND location = '{}'::jsonb;
