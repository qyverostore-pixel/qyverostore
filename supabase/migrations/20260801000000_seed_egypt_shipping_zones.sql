-- Expand the existing one-zone/one-rate shipping model without changing checkout,
-- orders, triggers, or existing rates.  New zones inherit Cairo's active rate so
-- checkout remains priced consistently until an administrator sets regional rates.
do $$
declare
  v_cost numeric(12, 2);
  v_days integer;
  v_zone_id uuid;
  v_governorate text;
begin
  select rate.shipping_cost, rate.estimated_delivery_days
    into v_cost, v_days
    from public.shipping_zones as zone
    join public.shipping_rates as rate on rate.zone_id = zone.id
   where zone.is_active = true
     and rate.is_active = true
     and lower(zone.governorate) = 'cairo'
   order by zone.city nulls first
   limit 1;

  if v_cost is null or v_days is null then
    raise exception 'Seed requires an active Cairo shipping rate. Create or activate it first.';
  end if;

  foreach v_governorate in array array[
    'Cairo', 'Giza', 'Alexandria', 'Qalyubia', 'Gharbia', 'Dakahlia',
    'Sharqia', 'Monufia', 'Beheira', 'Port Said', 'Suez', 'Ismailia',
    'Kafr El Sheikh', 'Damietta', 'Faiyum', 'Beni Suef', 'Minya', 'Assiut',
    'Sohag', 'Qena', 'Luxor', 'Aswan', 'Red Sea', 'New Valley', 'Matrouh',
    'North Sinai', 'South Sinai'
  ] loop
    select id into v_zone_id
      from public.shipping_zones
     where lower(governorate) = lower(v_governorate)
       and city is null
     limit 1;

    if v_zone_id is null then
      insert into public.shipping_zones (governorate, city, is_active)
      values (v_governorate, null, true)
      returning id into v_zone_id;
    end if;

    if not exists (select 1 from public.shipping_rates where zone_id = v_zone_id) then
      insert into public.shipping_rates (zone_id, shipping_cost, estimated_delivery_days, is_active)
      values (v_zone_id, v_cost, v_days, true);
    end if;
  end loop;
end;
$$;
