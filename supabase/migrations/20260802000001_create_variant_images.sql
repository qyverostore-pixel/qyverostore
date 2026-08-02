-- ============================================================================
-- Migration: create_variant_images
-- Purpose:   Per-variant image gallery (e.g. one image set per color).
--            Mirrors the existing `product_images` table 1:1 in shape.
--            Fully additive — does not touch `product_images`.
-- ============================================================================

create table public.variant_images (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  image_url text not null,
  storage_path text,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index variant_images_variant_id_idx on public.variant_images (variant_id);

alter table public.variant_images enable row level security;

-- Same readability rule as product_images: public if the parent variant
-- is active and belongs to an active/published product; admins see all.
create policy "Anyone can read images for active variants"
  on public.variant_images
  for select
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.product_variants
      join public.products on products.id = product_variants.product_id
      where product_variants.id = variant_images.variant_id
        and product_variants.is_active = true
        and products.is_active = true
        and products.status = 'active'
    )
  );

create policy "Admins can manage variant images"
  on public.variant_images
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
