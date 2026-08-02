-- ============================================================================
-- Migration: add_variant_id_to_order_items
-- Purpose:   Allow future orders to reference a specific variant, without
--            requiring it and without touching checkout logic.
--
-- Safety:
--  - Column is NULLABLE: every existing row in order_items automatically
--    gets variant_id = NULL. No backfill of historical orders is performed
--    here (see note at the bottom of this file).
--  - ON DELETE SET NULL: if a variant is ever deleted, historical order
--    line items are preserved instead of being deleted or blocked.
--  - No NOT NULL constraint, no CHECK constraint, no rename/drop of any
--    existing order_items column. The current checkout RPC(s) that insert
--    into order_items without specifying variant_id continue to work
--    unmodified, since the column has a NULL default.
--  - No changes to existing RLS policies on order_items: policies in this
--    table are not column-scoped, so they apply unchanged to the new column.
-- ============================================================================

alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null;

create index if not exists order_items_variant_id_idx on public.order_items (variant_id);

-- NOTE (intentional scope limit): this migration does NOT backfill
-- variant_id on existing order_items rows. Historical orders will simply
-- report variant_id = NULL, which is safe and expected. If/when you want
-- historical orders attributed to the new default variants, that should be
-- a separate, explicitly-reviewed data migration — not bundled here.
