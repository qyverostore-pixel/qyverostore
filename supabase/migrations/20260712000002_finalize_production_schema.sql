alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists last_login timestamptz;

alter table public.profiles
  alter column role set default 'customer',
  alter column role set not null;

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  recipient_name text not null,
  phone text not null,
  country text not null,
  governorate text not null,
  city text not null,
  district text,
  street text not null,
  building text,
  floor text,
  apartment text,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products
  drop column if exists dimensions,
  add column if not exists low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  add column if not exists is_new boolean not null default false,
  add column if not exists is_best_seller boolean not null default false,
  add column if not exists is_on_sale boolean not null default false,
  add column if not exists is_active boolean not null default true,
  add column if not exists length numeric(10, 2) check (length is null or length >= 0),
  add column if not exists width numeric(10, 2) check (width is null or width >= 0),
  add column if not exists height numeric(10, 2) check (height is null or height >= 0),
  add column if not exists rating numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  add column if not exists reviews_count integer not null default 0 check (reviews_count >= 0),
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists updated_by uuid references auth.users(id);

alter table public.products
  drop constraint if exists products_category_id_fkey,
  alter column category_id drop not null,
  alter column sku set not null,
  add constraint products_category_id_fkey
    foreign key (category_id) references public.categories(id) on delete set null;

alter table public.product_images
  add column if not exists storage_path text;

create unique index if not exists categories_slug_idx on public.categories (slug);
create unique index if not exists products_slug_idx on public.products (slug);
create unique index if not exists products_sku_idx on public.products (sku);
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_featured_idx on public.products (featured) where featured = true;
create index if not exists products_status_idx on public.products (status);
create index if not exists addresses_user_id_idx on public.addresses (user_id);
create index if not exists product_images_product_id_idx on public.product_images (product_id);

create unique index if not exists addresses_one_default_per_user_idx
  on public.addresses (user_id)
  where is_default = true;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_addresses_updated_at on public.addresses;
create trigger set_addresses_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can read their own profiles" on public.profiles;
drop policy if exists "Admins can read profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;

create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Admins can read profiles"
  on public.profiles
  for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can update profiles"
  on public.profiles
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Users can manage their own addresses"
  on public.addresses
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Admins can manage addresses"
  on public.addresses
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Anyone can read active categories" on public.categories;
drop policy if exists "Admins can manage categories" on public.categories;

create policy "Anyone can read active categories"
  on public.categories
  for select
  using (is_active = true or (select public.is_admin()));

create policy "Admins can manage categories"
  on public.categories
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Anyone can read active products" on public.products;
drop policy if exists "Admins can manage products" on public.products;

create policy "Anyone can read active products"
  on public.products
  for select
  using (
    (is_active = true and status = 'active')
    or (select public.is_admin())
  );

create policy "Admins can manage products"
  on public.products
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Anyone can read images for active products" on public.product_images;
drop policy if exists "Admins can manage product images" on public.product_images;

create policy "Anyone can read images for active products"
  on public.product_images
  for select
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.products
      where products.id = product_images.product_id
        and products.is_active = true
        and products.status = 'active'
    )
  );

create policy "Admins can manage product images"
  on public.product_images
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
