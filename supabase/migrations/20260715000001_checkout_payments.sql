alter table public.orders
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists governorate text,
  add column if not exists city text,
  add column if not exists address text,
  add column if not exists shipping_cost numeric(12, 2) not null default 0 check (shipping_cost >= 0),
  add column if not exists subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  add column if not exists payment_method text not null default 'cash_on_delivery' check (payment_method in ('cash_on_delivery', 'vodafone_cash', 'instapay', 'fawry', 'paymob')),
  add column if not exists payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'waiting_review', 'paid', 'rejected'));

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null check (method in ('cash_on_delivery', 'vodafone_cash', 'instapay', 'fawry', 'paymob')),
  status text not null default 'unpaid' check (status in ('unpaid', 'waiting_review', 'paid', 'rejected')),
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  provider_reference text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payment_proofs_order_id_idx on public.payment_proofs (order_id);
create index if not exists payment_proofs_payment_id_idx on public.payment_proofs (payment_id);

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;
alter table public.payment_proofs enable row level security;

drop policy if exists "Anyone can create checkout orders" on public.orders;
drop policy if exists "Anyone can create order items" on public.order_items;
drop policy if exists "Anyone can create payments" on public.payments;
drop policy if exists "Users can read their own payments" on public.payments;
drop policy if exists "Admins can manage payments" on public.payments;
drop policy if exists "Anyone can create payment proofs" on public.payment_proofs;
drop policy if exists "Users can read their own payment proofs" on public.payment_proofs;
drop policy if exists "Admins can manage payment proofs" on public.payment_proofs;

create policy "Anyone can create checkout orders"
  on public.orders
  for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can create order items"
  on public.order_items
  for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can create payments"
  on public.payments
  for insert
  to anon, authenticated
  with check (true);

create policy "Users can read their own payments"
  on public.payments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders
      where orders.id = payments.order_id
        and orders.customer_id = (select auth.uid())
    )
  );

create policy "Admins can manage payments"
  on public.payments
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Anyone can create payment proofs"
  on public.payment_proofs
  for insert
  to anon, authenticated
  with check (true);

create policy "Users can read their own payment proofs"
  on public.payment_proofs
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders
      where orders.id = payment_proofs.order_id
        and orders.customer_id = (select auth.uid())
    )
  );

create policy "Admins can manage payment proofs"
  on public.payment_proofs
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
