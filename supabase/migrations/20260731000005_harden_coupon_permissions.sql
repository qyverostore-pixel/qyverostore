-- Table privileges and RLS are complementary. Keep RLS enabled while granting
-- the authenticated application role only the operations its policies allow.
alter table public.coupons enable row level security;

revoke all privileges on table public.coupons from public, anon;
grant select, insert, update, delete on table public.coupons to authenticated;

drop policy if exists "Authenticated users can read active coupons" on public.coupons;
create policy "Authenticated users can read active coupons"
  on public.coupons
  for select
  to authenticated
  using (is_active = true or (select public.is_admin()));
