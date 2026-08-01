-- Keep the legacy columns during the bilingual rollout.  They are still used by
-- historical integrations and remain the English compatibility fallback.
alter table public.categories
  add column if not exists name_en text,
  add column if not exists name_ar text,
  add column if not exists description_en text,
  add column if not exists description_ar text;

alter table public.products
  add column if not exists name_en text,
  add column if not exists name_ar text,
  add column if not exists description_en text,
  add column if not exists description_ar text;

-- Existing catalog entries continue to appear as English without requiring an
-- immediate manual re-entry by administrators.
update public.categories
set name_en = coalesce(name_en, name),
    description_en = coalesce(description_en, description);

update public.products
set name_en = coalesce(name_en, name),
    description_en = coalesce(description_en, description);

comment on column public.categories.name_en is 'English category name';
comment on column public.categories.name_ar is 'Arabic category name';
comment on column public.products.name_en is 'English product name';
comment on column public.products.name_ar is 'Arabic product name';
