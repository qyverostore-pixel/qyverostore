-- ============================================================================
-- Migration: create_product_variants
-- Purpose:   Introduce a Product + Variant model without touching existing
--            `products` columns or behavior. Fully additive.
-- ============================================================================

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text,
  color text,
  size text,
  price_override numeric(12, 2) check (price_override is null or price_override >= 0),
  stock integer not null default 0 check (stock >= 0),
  barcode text,
  weight numeric(10, 3) check (weight is null or weight >= 0),
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Every existing product-level index has an equivalent here, plus:
--  - sku/barcode are unique only when present (a variant is allowed to omit
--    them while data is being migrated/entered by admins).
--  - exactly one default variant per product is enforced at the DB level,
--    which is what the backfill migration below relies on.
create index product_variants_product_id_idx on public.product_variants (product_id);
create index product_variants_is_active_idx on public.product_variants (is_active) where is_active = true;
create unique index product_variants_sku_idx on public.product_variants (sku) where sku is not null;
create unique index product_variants_barcode_idx on public.product_variants (barcode) where barcode is not null;
create unique index product_variants_one_default_per_product_idx
  on public.product_variants (product_id)
  where is_default = true;

create trigger set_product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

alter table public.product_variants enable row level security;

-- Mirrors the existing "Anyone can read active products" policy shape:
-- a variant is publicly readable only if it is active AND its parent
-- product is active/published, or the caller is an admin.
create policy "Anyone can read active variants of active products"
  on public.product_variants
  for select
  using (
    (select public.is_admin())
    or (
      is_active = true
      and exists (
        select 1
        from public.products
        where products.id = product_variants.product_id
          and products.is_active = true
          and products.status = 'active'
      )
    )
  );

create policy "Admins can manage product variants"
  on public.product_variants
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
