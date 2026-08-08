-- Fix: "permission denied for table product_variants" in production.
--
-- Root cause: 20260731000006_audit_table_access_and_rls.sql moved this
-- project off Postgres/Supabase's implicit default table privileges onto an
-- explicit per-table GRANT allowlist ("Remove all implicit/public table
-- access before granting only the access used by the storefront and
-- authenticated application" — see that migration's own comment). It
-- revoked all privileges from `public`/`anon` and re-granted them table by
-- table.
--
-- product_variants and variant_images were created afterwards, in
-- 20260802000000_create_product_variants.sql and
-- 20260802000001_create_variant_images.sql. Those migrations enabled RLS
-- and added is_admin()-gated policies, but — because this project no longer
-- relies on implicit default privileges — they were never added to the
-- explicit GRANT allowlist. Postgres checks table-level GRANTs *before*
-- evaluating RLS, so every query against these two tables (for every role,
-- including an authenticated admin) fails at that first check with
-- "permission denied for table ...", regardless of what the RLS policies
-- say. This is why it surfaced immediately on product creation: every
-- product read (list/detail/create) asks for each product's variants in
-- the same request, via `storeProductSelect`.
--
-- Fix: add only the missing grants, in the exact shape already used for
-- product_images (this project's closest analog — a child table that's
-- fully admin-managed but has a public, read-only storefront audience):
--   - authenticated: full CRUD, further restricted by the existing
--     "Admins can manage product variants" / "Admins can manage variant
--     images" RLS policies (is_admin() gated).
--   - anon: read-only, further restricted by the existing "active variant
--     of an active product" RLS policies.
-- Nothing is revoked, no RLS is disabled, and no table becomes publicly
-- writable — this only closes the gap left by the earlier audit migration.

grant select, insert, update, delete on table public.product_variants to authenticated;
grant select, insert, update, delete on table public.variant_images to authenticated;

grant select on table public.product_variants to anon;
grant select on table public.variant_images to anon;
