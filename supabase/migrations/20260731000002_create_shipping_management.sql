create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  governorate text not null,
  city text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (nullif(trim(governorate), '') is not null),
  check (city is null or nullif(trim(city), '') is not null)
);

create unique index shipping_zones_location_idx
  on public.shipping_zones (lower(governorate), coalesce(lower(city), ''));

create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null unique references public.shipping_zones(id) on delete cascade,
  shipping_cost numeric(12, 2) not null check (shipping_cost >= 0),
  estimated_delivery_days integer not null check (estimated_delivery_days > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shipping_zones_active_location_idx on public.shipping_zones (is_active, governorate, city);
create index shipping_rates_active_idx on public.shipping_rates (is_active);

create trigger set_shipping_zones_updated_at before update on public.shipping_zones for each row execute function public.set_updated_at();
create trigger set_shipping_rates_updated_at before update on public.shipping_rates for each row execute function public.set_updated_at();

alter table public.shipping_zones enable row level security;
alter table public.shipping_rates enable row level security;

create policy "Anyone can read active shipping zones" on public.shipping_zones for select using (is_active = true or (select public.is_admin()));
create policy "Admins manage shipping zones" on public.shipping_zones for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Anyone can read active shipping rates" on public.shipping_rates for select using (is_active = true or (select public.is_admin()));
create policy "Admins manage shipping rates" on public.shipping_rates for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create or replace function public.apply_shipping_rate_to_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rate record;
begin
  select rate.shipping_cost, rate.estimated_delivery_days
    into v_rate
    from public.shipping_zones as zone
    join public.shipping_rates as rate on rate.zone_id = zone.id
   where zone.is_active = true
     and rate.is_active = true
     and lower(zone.governorate) = lower(new.governorate)
     and (zone.city is null or lower(zone.city) = lower(coalesce(new.city, '')))
   order by case when zone.city is null then 1 else 0 end
   limit 1;

  if not found then
    raise exception 'Shipping is unavailable for the selected location';
  end if;

  new.shipping_cost := v_rate.shipping_cost;
  new.total_amount := round(coalesce(new.subtotal, 0) + v_rate.shipping_cost, 2);
  new.shipping_address := jsonb_set(
    coalesce(new.shipping_address, '{}'::jsonb),
    '{estimated_delivery_days}',
    to_jsonb(v_rate.estimated_delivery_days),
    true
  );
  return new;
end;
$$;

drop trigger if exists apply_shipping_rate_to_order on public.orders;
create trigger apply_shipping_rate_to_order
  before insert on public.orders
  for each row execute function public.apply_shipping_rate_to_order();
