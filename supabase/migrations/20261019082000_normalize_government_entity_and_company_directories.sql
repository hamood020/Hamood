ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS contact_points jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_contact_points_is_array;
ALTER TABLE public.companies
  ADD CONSTRAINT companies_contact_points_is_array
  CHECK (jsonb_typeof(contact_points) = 'array');

CREATE OR REPLACE FUNCTION private.normalize_directory_name(p_value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path TO ''
AS $function$
  SELECT pg_catalog.regexp_replace(
    pg_catalog.translate(
      pg_catalog.lower(pg_catalog.btrim(COALESCE(p_value, ''))),
      'أإآٱؤئـ',
      'ااااوي'
    ),
    '[[:space:](),.،]+',
    '',
    'g'
  );
$function$;

REVOKE EXECUTE ON FUNCTION private.normalize_directory_name(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.normalize_directory_name(text) TO authenticated, service_role;

UPDATE public.government_entities
SET name = 'الإدعاء العام'
WHERE private.normalize_directory_name(name) = private.normalize_directory_name('الإدعاء العام')
  AND name <> 'الإدعاء العام';

UPDATE public.government_entities
SET name = 'وزارة التربية والتعليم'
WHERE btrim(name) = 'وزارة التعليم';

UPDATE public.government_entities
SET name = 'وزارة النقل والاتصالات وتقنية المعلومات'
WHERE private.normalize_directory_name(name) = private.normalize_directory_name('وزارة النقل والاتصالات وتقنية المعلومات')
  AND name <> 'وزارة النقل والاتصالات وتقنية المعلومات';

UPDATE public.companies SET name = 'شركة الإدراك للتجارة والمقاولات'
WHERE private.normalize_directory_name(name) = private.normalize_directory_name('الادراك');

UPDATE public.companies SET name = 'شركة الخليلي للإنشاءات'
WHERE private.normalize_directory_name(name) = private.normalize_directory_name('الخليلي للإنشاءات');

UPDATE public.companies SET name = 'شركة التسنيم للمشاريع المحدودة'
WHERE private.normalize_directory_name(name) = private.normalize_directory_name('شركة التسنيم');

UPDATE public.companies SET name = 'مؤسسة أبو غزلان للتجارة والمقاولات والنقل'
WHERE private.normalize_directory_name(name) = private.normalize_directory_name('مؤسسة أبوغزلان للتجارة و المقاولات و النقل');

UPDATE public.companies SET name = 'شركة سيف بن سالم بن عيسى الحراصي'
WHERE private.normalize_directory_name(name) = private.normalize_directory_name('سيف الحراصي وشركاه');

DO $$
DECLARE d record;
BEGIN
  FOR d IN
    SELECT id, keeper_id
    FROM (
      SELECT id,
        pg_catalog.first_value(id) OVER (
          PARTITION BY private.normalize_directory_name(name)
          ORDER BY (name = btrim(name)) DESC, created_at ASC, id ASC
        ) AS keeper_id,
        pg_catalog.row_number() OVER (
          PARTITION BY private.normalize_directory_name(name)
          ORDER BY (name = btrim(name)) DESC, created_at ASC, id ASC
        ) AS rn
      FROM public.government_entities
    ) ranked WHERE rn > 1
  LOOP
    UPDATE public.projects SET government_entity_id = d.keeper_id WHERE government_entity_id = d.id;
    DELETE FROM public.user_entity_assignments du
    WHERE du.government_entity_id = d.id
      AND EXISTS (SELECT 1 FROM public.user_entity_assignments keep
                  WHERE keep.user_id = du.user_id AND keep.government_entity_id = d.keeper_id);
    UPDATE public.user_entity_assignments SET government_entity_id = d.keeper_id WHERE government_entity_id = d.id;
    UPDATE public.government_entities keep
    SET contact_points = (
      SELECT COALESCE(pg_catalog.jsonb_agg(DISTINCT merged.contact), '[]'::jsonb)
      FROM (
        SELECT pg_catalog.jsonb_array_elements(
          CASE WHEN pg_catalog.jsonb_typeof(keep.contact_points) = 'array' THEN keep.contact_points ELSE '[]'::jsonb END
        ) AS contact
        UNION ALL
        SELECT pg_catalog.jsonb_array_elements(
          CASE WHEN pg_catalog.jsonb_typeof(old.contact_points) = 'array' THEN old.contact_points ELSE '[]'::jsonb END
        ) AS contact
      ) merged
    ),
    code = COALESCE(keep.code, old.code)
    FROM public.government_entities old
    WHERE keep.id = d.keeper_id AND old.id = d.id;
    DELETE FROM public.government_entities WHERE id = d.id;
  END LOOP;
END $$;

DO $$
DECLARE d record;
BEGIN
  FOR d IN
    SELECT id, keeper_id
    FROM (
      SELECT id,
        pg_catalog.first_value(id) OVER (
          PARTITION BY private.normalize_directory_name(name)
          ORDER BY (name = btrim(name)) DESC, created_at ASC, id ASC
        ) AS keeper_id,
        pg_catalog.row_number() OVER (
          PARTITION BY private.normalize_directory_name(name)
          ORDER BY (name = btrim(name)) DESC, created_at ASC, id ASC
        ) AS rn
      FROM public.companies
    ) ranked WHERE rn > 1
  LOOP
    UPDATE public.projects SET implementing_company_id = d.keeper_id WHERE implementing_company_id = d.id;
    UPDATE public.companies keep
    SET contact_points = (
      SELECT COALESCE(pg_catalog.jsonb_agg(DISTINCT merged.contact), '[]'::jsonb)
      FROM (
        SELECT pg_catalog.jsonb_array_elements(
          CASE WHEN pg_catalog.jsonb_typeof(keep.contact_points) = 'array' THEN keep.contact_points ELSE '[]'::jsonb END
        ) AS contact
        UNION ALL
        SELECT pg_catalog.jsonb_array_elements(
          CASE WHEN pg_catalog.jsonb_typeof(old.contact_points) = 'array' THEN old.contact_points ELSE '[]'::jsonb END
        ) AS contact
      ) merged
    ),
    company_type = COALESCE(keep.company_type, old.company_type)
    FROM public.companies old
    WHERE keep.id = d.keeper_id AND old.id = d.id;
    DELETE FROM public.companies WHERE id = d.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS government_entities_normalized_name_uidx
  ON public.government_entities (private.normalize_directory_name(name));
CREATE UNIQUE INDEX IF NOT EXISTS companies_normalized_name_uidx
  ON public.companies (private.normalize_directory_name(name));
