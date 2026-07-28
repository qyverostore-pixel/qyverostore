create or replace function public.create_order(
  p_customer jsonb,
  p_shipping jsonb,
  p_payment_method text,
  p_items jsonb,
  p_shipping_cost numeric,
  p_coupon_code text default null,
  p_proof_image_url text default null,
  p_proof_storage_path text default null
)
returns table(order_id uuid, order_number text, payment_status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := auth.uid();
  v_customer_name text := nullif(trim(p_customer ->> 'full_name'), '');
  v_customer_phone text := nullif(trim(p_customer ->> 'phone'), '');
  v_customer_email text := nullif(trim(p_customer ->> 'email'), '');
  v_governorate text := nullif(trim(p_shipping ->> 'governorate'), '');
  v_city text := nullif(trim(p_shipping ->> 'city'), '');
  v_address text := nullif(trim(p_shipping ->> 'address'), '');
  v_country text := coalesce(nullif(trim(p_shipping ->> 'country'), ''), 'Egypt');
  v_payment_status text;
  v_subtotal numeric(12, 2) := 0;
  v_discount numeric(12, 2) := 0;
  v_total numeric(12, 2);
  v_order public.orders%rowtype;
  v_payment_id uuid;
  v_coupon public.coupons%rowtype;
  v_item record;
begin
  if v_customer_id is null then
    raise exception 'Please sign in to place an order';
  end if;

  if v_customer_name is null or v_customer_phone is null or v_governorate is null or v_city is null or v_address is null then
    raise exception 'Complete customer and shipping details';
  end if;

  if p_payment_method not in ('cash_on_delivery', 'vodafone_cash', 'instapay', 'fawry', 'paymob') then
    raise exception 'Invalid payment method';
  end if;

  if p_shipping_cost is null or p_shipping_cost < 0 then
    raise exception 'Invalid shipping cost';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;

  if (p_proof_image_url is null) <> (p_proof_storage_path is null) then
    raise exception 'Payment proof is incomplete';
  end if;

  if p_payment_method in ('vodafone_cash', 'instapay', 'fawry') and p_proof_image_url is null then
    raise exception 'Upload a payment screenshot to continue';
  end if;

  create temporary table checkout_items on commit drop as
  select input.product_id, sum(input.quantity)::integer as quantity
  from jsonb_to_recordset(p_items) as input(product_id uuid, quantity integer)
  where input.product_id is not null and input.quantity > 0
  group by input.product_id;

  if not exists (select 1 from checkout_items) then
    raise exception 'Your cart contains invalid items';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_items) as input(product_id uuid, quantity integer)
    where input.product_id is null or input.quantity is null or input.quantity <= 0
  ) then
    raise exception 'Your cart contains invalid items';
  end if;

  for v_item in
    select product.id, product.name, product.price, cart.quantity
    from checkout_items as cart
    join public.products as product on product.id = cart.product_id
    where product.status = 'active'
    for share of product
  loop
    v_subtotal := v_subtotal + (v_item.price * v_item.quantity);
  end loop;

  if (select count(*) from checkout_items) <> (
    select count(*)
    from checkout_items as cart
    join public.products as product on product.id = cart.product_id
    where product.status = 'active'
  ) then
    raise exception 'One or more cart products are unavailable';
  end if;

  if nullif(trim(coalesce(p_coupon_code, '')), '') is not null then
    select * into v_coupon
    from public.coupons
    where code = upper(trim(p_coupon_code))
    for update;

    if not found
      or not v_coupon.is_active
      or (v_coupon.starts_at is not null and v_coupon.starts_at > now())
      or (v_coupon.expires_at is not null and v_coupon.expires_at <= now())
      or (v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit)
      or v_subtotal < v_coupon.minimum_order then
      raise exception 'Coupon is no longer valid';
    end if;

    v_discount := case
      when v_coupon.discount_type = 'percentage' then v_subtotal * v_coupon.discount_value / 100
      else v_coupon.discount_value
    end;
    v_discount := least(v_discount, coalesce(v_coupon.maximum_discount, v_discount), v_subtotal);
    v_discount := round(greatest(v_discount, 0), 2);

    update public.coupons
    set used_count = used_count + 1
    where id = v_coupon.id;
  end if;

  v_total := round(v_subtotal - v_discount + p_shipping_cost, 2);
  v_payment_status := case
    when p_payment_method = 'cash_on_delivery' then 'unpaid'
    when p_payment_method in ('vodafone_cash', 'instapay', 'fawry') then 'waiting_review'
    else 'unpaid'
  end;

  insert into public.orders (
    customer_id, customer_name, customer_email, full_name, phone, email,
    governorate, city, address, shipping_address, subtotal, shipping_cost,
    coupon_code, discount_amount, total_amount, payment_method, payment_status, status
  ) values (
    v_customer_id, v_customer_name, v_customer_email, v_customer_name, v_customer_phone, v_customer_email,
    v_governorate, v_city, v_address,
    jsonb_build_object('country', v_country, 'governorate', v_governorate, 'city', v_city, 'street', v_address, 'building', '', 'floor', '', 'apartment', '', 'notes', ''),
    v_subtotal, p_shipping_cost, case when v_coupon.id is null then null else v_coupon.code end,
    v_discount, v_total, p_payment_method, v_payment_status, 'pending'
  ) returning * into v_order;

  insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
  select v_order.id, product.id, product.name, cart.quantity, product.price, round(product.price * cart.quantity, 2)
  from checkout_items as cart
  join public.products as product on product.id = cart.product_id;

  insert into public.payments (order_id, method, status, amount)
  values (v_order.id, p_payment_method, v_payment_status, v_total)
  returning id into v_payment_id;

  if p_proof_image_url is not null then
    insert into public.payment_proofs (payment_id, order_id, image_url, storage_path)
    values (v_payment_id, v_order.id, p_proof_image_url, p_proof_storage_path);
  end if;

  return query select v_order.id, v_order.order_number, v_payment_status;
end;
$$;

grant execute on function public.create_order(jsonb, jsonb, text, jsonb, numeric, text, text, text) to authenticated;
