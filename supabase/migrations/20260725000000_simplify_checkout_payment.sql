-- Keep historical payment/proof rows intact. New checkout orders do not accept payment proofs.
drop function if exists public.create_order(jsonb, jsonb, text, jsonb, numeric, text, text, text);

create function public.create_order(
  p_customer jsonb,
  p_shipping jsonb,
  p_payment_method text,
  p_items jsonb
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
  -- This is the established flat QYVERO shipping charge. It is deliberately not client input.
  v_shipping_cost numeric(12, 2) := 75;
  v_subtotal numeric(12, 2) := 0;
  v_total numeric(12, 2);
  v_order public.orders%rowtype;
  v_item record;
begin
  if v_customer_id is null then
    raise exception 'Please sign in to place an order';
  end if;
  if v_customer_name is null or v_customer_phone is null or v_governorate is null or v_city is null or v_address is null then
    raise exception 'Complete customer and shipping details';
  end if;
  if p_payment_method not in ('cash_on_delivery', 'vodafone_cash', 'instapay') then
    raise exception 'Invalid payment method';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty';
  end if;

  create temporary table checkout_items on commit drop as
  select input.product_id, sum(input.quantity)::integer as quantity
  from jsonb_to_recordset(p_items) as input(product_id uuid, quantity integer)
  where input.product_id is not null and input.quantity > 0
  group by input.product_id;

  if not exists (select 1 from checkout_items) or exists (
    select 1 from jsonb_to_recordset(p_items) as input(product_id uuid, quantity integer)
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
    select count(*) from checkout_items as cart
    join public.products as product on product.id = cart.product_id
    where product.status = 'active'
  ) then
    raise exception 'One or more cart products are unavailable';
  end if;

  v_total := round(v_subtotal + v_shipping_cost, 2);
  v_payment_status := case when p_payment_method = 'cash_on_delivery' then 'unpaid' else 'waiting_review' end;

  insert into public.orders (
    customer_id, customer_name, customer_email, full_name, phone, email,
    governorate, city, address, shipping_address, subtotal, shipping_cost,
    total_amount, payment_method, payment_status, status
  ) values (
    v_customer_id, v_customer_name, v_customer_email, v_customer_name, v_customer_phone, v_customer_email,
    v_governorate, v_city, v_address,
    jsonb_build_object('country', v_country, 'governorate', v_governorate, 'city', v_city, 'street', v_address, 'building', '', 'floor', '', 'apartment', '', 'notes', ''),
    v_subtotal, v_shipping_cost, v_total, p_payment_method, v_payment_status, 'pending'
  ) returning * into v_order;

  insert into public.order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
  select v_order.id, product.id, product.name, cart.quantity, product.price, round(product.price * cart.quantity, 2)
  from checkout_items as cart join public.products as product on product.id = cart.product_id;

  insert into public.payments (order_id, method, status, amount)
  values (v_order.id, p_payment_method, v_payment_status, v_total);

  return query select v_order.id, v_order.order_number, v_payment_status;
end;
$$;

grant execute on function public.create_order(jsonb, jsonb, text, jsonb) to authenticated;
