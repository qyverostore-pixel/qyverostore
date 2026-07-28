create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12, 2) not null check (discount_value > 0),
  minimum_order numeric(12, 2) not null default 0 check (minimum_order >= 0),
  maximum_discount numeric(12, 2) check (maximum_discount is null or maximum_discount >= 0),
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (expires_at is null or starts_at is null or expires_at > starts_at),
  check (discount_type <> 'percentage' or discount_value <= 100)
);

create index coupons_active_code_idx on public.coupons (code) where is_active = true;

alter table public.orders
  add column if not exists coupon_code text,
  add column if not exists discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0);

create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns table(valid boolean, discount_amount numeric, final_total numeric, reason text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  coupon public.coupons%rowtype;
  discount numeric(12, 2);
begin
  select * into coupon from public.coupons where code = upper(trim(p_code));
  if not found then return query select false, 0::numeric, greatest(coalesce(p_subtotal, 0), 0), 'Coupon not found'; return; end if;
  if not coupon.is_active then return query select false, 0::numeric, greatest(coalesce(p_subtotal, 0), 0), 'This coupon is inactive'; return; end if;
  if coupon.starts_at is not null and coupon.starts_at > now() then return query select false, 0::numeric, greatest(coalesce(p_subtotal, 0), 0), 'This coupon is not active yet'; return; end if;
  if coupon.expires_at is not null and coupon.expires_at <= now() then return query select false, 0::numeric, greatest(coalesce(p_subtotal, 0), 0), 'This coupon has expired'; return; end if;
  if coupon.usage_limit is not null and coupon.used_count >= coupon.usage_limit then return query select false, 0::numeric, greatest(coalesce(p_subtotal, 0), 0), 'This coupon has reached its usage limit'; return; end if;
  if coalesce(p_subtotal, 0) < coupon.minimum_order then return query select false, 0::numeric, greatest(coalesce(p_subtotal, 0), 0), format('Minimum order is %s', coupon.minimum_order); return; end if;
  discount := case when coupon.discount_type = 'percentage' then p_subtotal * coupon.discount_value / 100 else coupon.discount_value end;
  if coupon.maximum_discount is not null then discount := least(discount, coupon.maximum_discount); end if;
  discount := least(greatest(discount, 0), p_subtotal);
  return query select true, round(discount, 2), round(p_subtotal - discount, 2), null::text;
end;
$$;

create or replace function public.redeem_coupon_for_order(p_order_id uuid, p_code text, p_subtotal numeric, p_shipping numeric)
returns table(discount_amount numeric, final_total numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  coupon public.coupons%rowtype;
  discount numeric(12, 2);
begin
  select * into coupon from public.coupons where code = upper(trim(p_code)) for update;
  if not found or not coupon.is_active or (coupon.starts_at is not null and coupon.starts_at > now()) or (coupon.expires_at is not null and coupon.expires_at <= now()) or (coupon.usage_limit is not null and coupon.used_count >= coupon.usage_limit) or coalesce(p_subtotal, 0) < coupon.minimum_order then
    raise exception 'Coupon is no longer valid';
  end if;
  discount := case when coupon.discount_type = 'percentage' then p_subtotal * coupon.discount_value / 100 else coupon.discount_value end;
  if coupon.maximum_discount is not null then discount := least(discount, coupon.maximum_discount); end if;
  discount := least(greatest(discount, 0), p_subtotal);
  update public.coupons set used_count = used_count + 1 where id = coupon.id;
  update public.orders set coupon_code = coupon.code, discount_amount = round(discount, 2), total_amount = round(p_subtotal - discount + coalesce(p_shipping, 0), 2) where id = p_order_id;
  return query select round(discount, 2), round(p_subtotal - discount + coalesce(p_shipping, 0), 2);
end;
$$;

alter table public.coupons enable row level security;
create policy "Admins can manage coupons" on public.coupons for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
grant execute on function public.validate_coupon(text, numeric) to anon, authenticated;
grant execute on function public.redeem_coupon_for_order(uuid, text, numeric, numeric) to anon, authenticated;
