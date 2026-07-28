alter table public.profiles
  add column if not exists email text;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('QY-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  customer_id uuid references auth.users(id) on delete set null,
  customer_name text,
  customer_email text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  total_price numeric(12, 2) not null default 0 check (total_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id boolean primary key default true check (id = true),
  brand text,
  whatsapp text,
  email text,
  facebook text,
  instagram text,
  tiktok text,
  primary_color text,
  secondary_color text,
  logo_url text,
  logo_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id)
values (true)
on conflict (id) do nothing;

create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists set_store_settings_updated_at on public.store_settings;
create trigger set_store_settings_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, email, role, is_active)
  values (
    new.id,
    nullif(trim(concat_ws(' ', new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name')), ''),
    new.raw_user_meta_data ->> 'phone',
    new.email,
    'customer',
    true
  )
  on conflict (id) do update
    set email = coalesce(public.profiles.email, excluded.email);

  return new;
end;
$$;

update public.profiles
set email = auth_users.email
from auth.users as auth_users
where profiles.id = auth_users.id
  and profiles.email is null;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;

drop policy if exists "Users can read their own orders" on public.orders;
drop policy if exists "Admins can manage orders" on public.orders;
drop policy if exists "Users can read their own order items" on public.order_items;
drop policy if exists "Admins can manage order items" on public.order_items;
drop policy if exists "Anyone can read store settings" on public.store_settings;
drop policy if exists "Admins can manage store settings" on public.store_settings;

create policy "Users can read their own orders"
  on public.orders
  for select
  to authenticated
  using ((select auth.uid()) = customer_id);

create policy "Admins can manage orders"
  on public.orders
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Users can read their own order items"
  on public.order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.orders
      where orders.id = order_items.order_id
        and orders.customer_id = (select auth.uid())
    )
  );

create policy "Admins can manage order items"
  on public.order_items
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Anyone can read store settings"
  on public.store_settings
  for select
  using (true);

create policy "Admins can manage store settings"
  on public.store_settings
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
