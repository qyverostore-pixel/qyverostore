create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select role = 'admin'
      from public.profiles
      where id = (select auth.uid())
    ),
    false
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  icon text,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null,
  short_description text,
  description text,
  sku text,
  brand text,
  price numeric(12, 2) not null check (price >= 0),
  compare_price numeric(12, 2) check (compare_price is null or compare_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'active', 'out_of_stock')),
  weight numeric(10, 3) check (weight is null or weight >= 0),
  dimensions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index categories_slug_idx on public.categories (slug);
create unique index products_slug_idx on public.products (slug);
create index products_category_id_idx on public.products (category_id);
create index products_featured_idx on public.products (featured) where featured = true;
create index products_status_idx on public.products (status);
create index product_images_product_id_idx on public.product_images (product_id);

create trigger set_categories_updated_at
  before update on public.categories
  for each row execute procedure public.set_updated_at();

create trigger set_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

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

create policy "Anyone can read active products"
  on public.products
  for select
  using (status = 'active' or (select public.is_admin()));

create policy "Admins can manage products"
  on public.products
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Anyone can read images for active products"
  on public.product_images
  for select
  using (
    (select public.is_admin())
    or exists (
      select 1
      from public.products
      where products.id = product_images.product_id
        and products.status = 'active'
    )
  );

create policy "Admins can manage product images"
  on public.product_images
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
