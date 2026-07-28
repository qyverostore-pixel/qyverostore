create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

create index if not exists wishlist_customer_id_idx on public.wishlist (customer_id, created_at desc);
create index if not exists wishlist_product_id_idx on public.wishlist (product_id);

alter table public.wishlist enable row level security;

drop policy if exists "Customers can read their own wishlist" on public.wishlist;
drop policy if exists "Customers can add to their own wishlist" on public.wishlist;
drop policy if exists "Customers can remove their own wishlist" on public.wishlist;
drop policy if exists "Admins can manage wishlist" on public.wishlist;

create policy "Customers can read their own wishlist"
  on public.wishlist for select to authenticated
  using ((select auth.uid()) = customer_id);

create policy "Customers can add to their own wishlist"
  on public.wishlist for insert to authenticated
  with check ((select auth.uid()) = customer_id);

create policy "Customers can remove their own wishlist"
  on public.wishlist for delete to authenticated
  using ((select auth.uid()) = customer_id);

create policy "Admins can manage wishlist"
  on public.wishlist for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
