-- The original coupon migration may be marked as applied even when its table was
-- removed manually. Reconcile that state without deleting existing data.
do $$
declare
  v_legacy_table text;
begin
  if to_regclass('public.coupons') is null then
    select cls.relname
      into v_legacy_table
      from pg_class cls
      join pg_namespace ns on ns.oid = cls.relnamespace
     where ns.nspname = 'public'
       and cls.relkind = 'r'
       and cls.relname <> 'coupons'
       and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = cls.relname and column_name = 'code')
       and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = cls.relname and column_name in ('discount_type', 'type'))
       and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = cls.relname and column_name in ('discount_value', 'value'))
     order by cls.relname
     limit 1;

    if v_legacy_table is not null then
      execute format('alter table public.%I rename to coupons', v_legacy_table);
    else
      create table public.coupons (
        id uuid primary key default gen_random_uuid(),
        code text not null unique,
        description text,
        discount_type text not null check (discount_type in ('percentage', 'fixed')),
        discount_value numeric(12, 2) not null check (discount_value > 0),
        minimum_order numeric(12, 2) not null default 0 check (minimum_order >= 0),
        maximum_discount numeric(12, 2) check (maximum_discount is null or maximum_discount >= 0),
        usage_limit integer check (usage_limit is null or usage_limit > 0),
        usage_count integer not null default 0 check (usage_count >= 0),
        first_order_only boolean not null default false,
        starts_at timestamptz,
        expires_at timestamptz,
        is_active boolean not null default true,
        created_at timestamptz not null default now(),
        check (expires_at is null or starts_at is null or expires_at > starts_at),
        check (discount_type <> 'percentage' or discount_value <= 100)
      );
    end if;
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'coupons' and column_name = 'type')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'coupons' and column_name = 'discount_type') then
    alter table public.coupons rename column type to discount_type;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'coupons' and column_name = 'value')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'coupons' and column_name = 'discount_value') then
    alter table public.coupons rename column value to discount_value;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'coupons' and column_name = 'used_count')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'coupons' and column_name = 'usage_count') then
    alter table public.coupons rename column used_count to usage_count;
  end if;
end;
$$;

alter table public.coupons
  add column if not exists description text,
  add column if not exists discount_type text,
  add column if not exists discount_value numeric(12, 2),
  add column if not exists minimum_order numeric(12, 2) not null default 0,
  add column if not exists maximum_discount numeric(12, 2),
  add column if not exists usage_limit integer,
  add column if not exists usage_count integer not null default 0,
  add column if not exists first_order_only boolean not null default false,
  add column if not exists starts_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

update public.coupons set usage_count = 0 where usage_count is null;
create unique index if not exists coupons_code_key on public.coupons (code);
create index if not exists coupons_active_code_idx on public.coupons (code) where is_active = true;

alter table public.orders
  add column if not exists coupon_code text,
  add column if not exists discount_amount numeric(12, 2) not null default 0;

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  customer_id uuid references auth.users(id) on delete set null,
  discount_amount numeric(12, 2) not null check (discount_amount >= 0),
  created_at timestamptz not null default now()
);
create index if not exists coupon_redemptions_coupon_id_idx on public.coupon_redemptions(coupon_id);
create index if not exists coupon_redemptions_customer_id_idx on public.coupon_redemptions(customer_id);
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
drop policy if exists "Admins can manage coupons" on public.coupons;
drop policy if exists "Admins manage coupon redemptions" on public.coupon_redemptions;
drop policy if exists "Customers read own coupon redemptions" on public.coupon_redemptions;
create policy "Admins can manage coupons" on public.coupons for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins manage coupon redemptions" on public.coupon_redemptions for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Customers read own coupon redemptions" on public.coupon_redemptions for select to authenticated using (customer_id = (select auth.uid()));

create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns table(valid boolean, discount_amount numeric, final_total numeric, reason text)
language plpgsql security definer set search_path = '' as $$
declare coupon public.coupons%rowtype; discount numeric(12, 2);
begin
  select * into coupon from public.coupons where code = upper(trim(p_code));
  if not found then return query select false, 0::numeric, greatest(coalesce(p_subtotal, 0), 0), 'Coupon not found'; return; end if;
  if not coupon.is_active then return query select false, 0::numeric, greatest(coalesce(p_subtotal, 0), 0), 'This coupon is inactive'; return; end if;
  if coupon.starts_at is not null and coupon.starts_at > now() then return query select false, 0::numeric, greatest(coalesce(p_subtotal, 0), 0), 'This coupon is not active yet'; return; end if;
  if coupon.expires_at is not null and coupon.expires_at <= now() then return query select false, 0::numeric, greatest(coalesce(p_subtotal, 0), 0), 'This coupon has expired'; return; end if;
  if coupon.usage_limit is not null and coupon.usage_count >= coupon.usage_limit then return query select false, 0::numeric, greatest(coalesce(p_subtotal, 0), 0), 'This coupon has reached its usage limit'; return; end if;
  if coupon.first_order_only and exists (select 1 from public.orders where customer_id = auth.uid()) then return query select false, 0::numeric, greatest(coalesce(p_subtotal, 0), 0), 'This coupon is for first orders only'; return; end if;
  if coalesce(p_subtotal, 0) < coupon.minimum_order then return query select false, 0::numeric, greatest(coalesce(p_subtotal, 0), 0), format('Minimum order is %s', coupon.minimum_order); return; end if;
  discount := case when coupon.discount_type = 'percentage' then p_subtotal * coupon.discount_value / 100 else coupon.discount_value end;
  discount := least(greatest(discount, 0), coalesce(coupon.maximum_discount, discount), p_subtotal);
  return query select true, round(discount, 2), round(p_subtotal - discount, 2), null::text;
end; $$;

create or replace function public.redeem_coupon_for_order(p_order_id uuid, p_code text, p_subtotal numeric, p_shipping numeric)
returns table(discount_amount numeric, final_total numeric)
language plpgsql security definer set search_path = '' as $$
declare coupon public.coupons%rowtype; discount numeric(12, 2); v_customer_id uuid;
begin
  select customer_id into v_customer_id from public.orders where id = p_order_id for update;
  if not found or v_customer_id is distinct from auth.uid() then raise exception 'Order not found'; end if;
  select * into coupon from public.coupons where code = upper(trim(p_code)) for update;
  if not found or not coupon.is_active or (coupon.starts_at is not null and coupon.starts_at > now()) or (coupon.expires_at is not null and coupon.expires_at <= now()) or (coupon.usage_limit is not null and coupon.usage_count >= coupon.usage_limit) or coalesce(p_subtotal, 0) < coupon.minimum_order or (coupon.first_order_only and exists (select 1 from public.orders where customer_id = v_customer_id and id <> p_order_id)) then raise exception 'Coupon is no longer valid'; end if;
  discount := case when coupon.discount_type = 'percentage' then p_subtotal * coupon.discount_value / 100 else coupon.discount_value end;
  discount := least(greatest(discount, 0), coalesce(coupon.maximum_discount, discount), p_subtotal);
  update public.coupons set usage_count = usage_count + 1 where id = coupon.id;
  insert into public.coupon_redemptions(coupon_id, order_id, customer_id, discount_amount) values (coupon.id, p_order_id, v_customer_id, round(discount, 2));
  update public.orders set coupon_code = coupon.code, discount_amount = round(discount, 2), total_amount = round(p_subtotal - discount + coalesce(p_shipping, 0), 2) where id = p_order_id;
  return query select round(discount, 2), round(p_subtotal - discount + coalesce(p_shipping, 0), 2);
end; $$;

create or replace function public.create_order_with_coupon(p_customer jsonb, p_shipping jsonb, p_payment_method text, p_items jsonb, p_coupon_code text default null)
returns table(order_id uuid, order_number text, payment_status text)
language plpgsql security definer set search_path = '' as $$
declare v_order record; v_subtotal numeric; v_shipping numeric;
begin
  select * into v_order from public.create_order(p_customer, p_shipping, p_payment_method, p_items);
  if nullif(trim(coalesce(p_coupon_code, '')), '') is not null then
    select subtotal, shipping_cost into v_subtotal, v_shipping from public.orders where id = v_order.order_id;
    perform public.redeem_coupon_for_order(v_order.order_id, p_coupon_code, v_subtotal, v_shipping);
  end if;
  return query select v_order.order_id, v_order.order_number, v_order.payment_status;
end; $$;

revoke execute on function public.validate_coupon(text, numeric) from public, anon;
revoke execute on function public.redeem_coupon_for_order(uuid, text, numeric, numeric) from public, anon;
revoke execute on function public.create_order_with_coupon(jsonb, jsonb, text, jsonb, text) from public, anon;
grant execute on function public.validate_coupon(text, numeric) to authenticated;
grant execute on function public.redeem_coupon_for_order(uuid, text, numeric, numeric) to authenticated;
grant execute on function public.create_order_with_coupon(jsonb, jsonb, text, jsonb, text) to authenticated;
