-- ============================================================================
-- Migration: backfill_default_product_variants
-- Purpose:   Every existing product must keep working after this migration.
--            This creates exactly one default variant per existing product,
--            copying sku, stock and price so that any future variant-aware
--            code path (e.g. "use variant price if present, else product
--            price") produces identical results to today's behavior.
--
-- Safety / idempotency:
--  - Guarded by `where not exists (... is_default = true ...)`, so this
--    migration is safe to re-run (e.g. against a staging DB) without
--    creating duplicate default variants. The partial unique index from
--    migration 20260802000000 also enforces this at the DB level.
--  - Does not modify `products` or `order_items` data at all.
--  - Does not modify checkout logic or frontend code.
-- ============================================================================

insert into public.product_variants (
  product_id,
  sku,
  price_override,
  stock,
  weight,
  is_default,
  is_active
)
select
  p.id,
  p.sku,
  p.price,     -- copy price -> price_override, so "effective price" logic
               -- (coalesce(variant.price_override, product.price)) yields
               -- the exact same price as today for every existing product.
  p.stock,     -- copy stock 1:1 so variant-level stock starts in sync with
               -- the product-level stock that checkout currently reads.
  p.weight,
  true,        -- is_default
  p.is_active  -- keep same visibility as the parent product
from public.products p
where not exists (
  select 1
  from public.product_variants v
  where v.product_id = p.id
    and v.is_default = true
);

-- ----------------------------------------------------------------------------
-- Explicitly NOT done here (by design, to keep this migration low-risk):
--   1. order_items.variant_id is left NULL for all historical orders.
--   2. products.stock / products.price / products.sku are left untouched —
--      they remain the source of truth for checkout until you deliberately
--      cut checkout over to reading from product_variants.
--   3. No trigger is added to keep products.stock and the default variant's
--      stock in sync going forward. As long as checkout keeps writing to
--      products.stock (unchanged), that's fine. If/when checkout starts
--      writing to product_variants.stock instead, that's a separate,
--      deliberate migration.
-- ----------------------------------------------------------------------------
