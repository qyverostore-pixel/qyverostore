-- Checkout remains fully server-authoritative while preserving the existing
-- parent-product inventory counter for backwards compatibility.
create or replace function public.create_order(
  p_customer jsonb,
  p_shipping jsonb,
  p_payment_method text,
  p_items jsonb
)
returns table(order_id uuid, order_number text, payment_status text)
language plpgsql security definer set search_path = '' as $$
declare
  v_customer_id uuid := auth.uid();
  v_name text := nullif(trim(regexp_replace(coalesce(p_customer ->> 'full_name', ''), '[[:space:]]+', ' ', 'g')), '');
  v_phone_input text := nullif(trim(p_customer ->> 'phone'), '');
  v_phone text;
  v_email text := nullif(trim(p_customer ->> 'email'), '');
  v_governorate text := nullif(trim(p_shipping ->> 'governorate'), '');
  v_city text := nullif(trim(p_shipping ->> 'city'), '');
  v_address text := nullif(trim(regexp_replace(coalesce(p_shipping ->> 'address', ''), '[[:space:]]+', ' ', 'g')), '');
  v_country text := coalesce(nullif(trim(p_shipping ->> 'country'), ''), 'Egypt');
  v_subtotal numeric(12,2) := 0; v_order public.orders%rowtype; v_product record; v_item record;
begin
  if v_customer_id is null then raise exception 'Please sign in to place an order'; end if;
  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 100 or v_name !~ '^[[:alpha:]][[:alpha:] ''-]*$' then raise exception 'Enter a valid name'; end if;
  if v_phone_input is null or v_phone_input !~ '^[+0-9 -]+$' then raise exception 'Enter a valid Egyptian mobile number'; end if;
  v_phone := regexp_replace(v_phone_input, '[ -]', '', 'g');
  if v_phone like '+20%' then v_phone := '0' || substr(v_phone, 4); elsif v_phone like '0020%' then v_phone := '0' || substr(v_phone, 5); end if;
  if v_phone !~ '^01[0125][0-9]{8}$' then raise exception 'Enter a valid Egyptian mobile number'; end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$') then raise exception 'Enter a valid email'; end if;
  if v_governorate is null or v_city is null or v_address is null or char_length(v_address) < 5 then raise exception 'Complete a valid shipping address'; end if;
  if p_payment_method not in ('cash_on_delivery', 'vodafone_cash', 'instapay') then raise exception 'Invalid payment method'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Your cart is empty'; end if;

  create temporary table checkout_items on commit drop as
    select input.product_id, input.variant_id, sum(input.quantity)::integer quantity
    from jsonb_to_recordset(p_items) as input(product_id uuid, variant_id uuid, quantity integer)
    where input.product_id is not null and input.quantity > 0
    group by input.product_id, input.variant_id;
  if not exists (select 1 from checkout_items) or exists (select 1 from jsonb_to_recordset(p_items) as input(product_id uuid, variant_id uuid, quantity integer) where input.product_id is null or input.quantity is null or input.quantity <= 0) then raise exception 'Your cart contains invalid quantities'; end if;
  create temporary table checkout_products on commit drop as select product_id, sum(quantity)::integer quantity from checkout_items group by product_id;
  for v_product in select product.id, product.stock, cart.quantity from checkout_products cart join public.products product on product.id = cart.product_id where product.is_active and product.status = 'active' order by product.id for update of product loop
    if v_product.stock < v_product.quantity then raise exception 'Insufficient stock for one or more products'; end if;
  end loop;
  if (select count(*) from checkout_products) <> (select count(*) from public.products product join checkout_products cart on cart.product_id = product.id where product.is_active and product.status = 'active') then raise exception 'One or more cart products are unavailable'; end if;
  perform 1 from public.product_variants variant join checkout_items cart on cart.variant_id = variant.id and cart.product_id = variant.product_id where cart.variant_id is not null order by variant.id for update;

  for v_item in select cart.product_id, cart.variant_id, cart.quantity, product.name, product.price, variant.price_override, variant.stock variant_stock from checkout_items cart join public.products product on product.id = cart.product_id left join public.product_variants variant on variant.id = cart.variant_id and variant.product_id = cart.product_id and variant.is_active order by cart.product_id, cart.variant_id nulls first for update of product loop
    if v_item.variant_id is not null and v_item.variant_stock is null then raise exception 'The selected product variant is unavailable'; end if;
    if v_item.variant_id is not null and v_item.variant_stock < v_item.quantity then raise exception 'Insufficient stock for the selected variant'; end if;
    v_subtotal := v_subtotal + (coalesce(v_item.price_override, v_item.price) * v_item.quantity);
  end loop;
  if (select count(*) from checkout_items) <> (select count(*) from checkout_items cart join public.products product on product.id = cart.product_id left join public.product_variants variant on variant.id = cart.variant_id and variant.product_id = cart.product_id and variant.is_active where cart.variant_id is null or variant.id is not null) then raise exception 'The selected product variant is unavailable'; end if;

  insert into public.orders (customer_id,customer_name,customer_email,full_name,phone,email,governorate,city,address,shipping_address,subtotal,shipping_cost,total_amount,payment_method,payment_status,status,inventory_processed)
  values (v_customer_id,v_name,v_email,v_name,v_phone,v_email,v_governorate,v_city,v_address,jsonb_build_object('country',v_country,'governorate',v_governorate,'city',v_city,'street',v_address,'building','','floor','','apartment','','notes',''),v_subtotal,0,v_subtotal,p_payment_method,case when p_payment_method='cash_on_delivery' then 'unpaid' else 'waiting_review' end,'pending',true) returning * into v_order;
  for v_item in select cart.product_id,cart.variant_id,cart.quantity,product.name,product.price,variant.price_override from checkout_items cart join public.products product on product.id=cart.product_id left join public.product_variants variant on variant.id=cart.variant_id loop
    insert into public.order_items(order_id,product_id,variant_id,product_name,quantity,unit_price,total_price) values (v_order.id,v_item.product_id,v_item.variant_id,v_item.name,v_item.quantity,coalesce(v_item.price_override,v_item.price),round(coalesce(v_item.price_override,v_item.price)*v_item.quantity,2));
  end loop;
  update public.products product set stock = product.stock - cart.quantity from checkout_products cart where product.id = cart.product_id;
  update public.product_variants variant set stock = variant.stock - cart.quantity from checkout_items cart where cart.variant_id is not null and variant.id = cart.variant_id;
  insert into public.payments(order_id,method,status,amount) values(v_order.id,p_payment_method,v_order.payment_status,v_order.total_amount);
  return query select v_order.id,v_order.order_number,v_order.payment_status;
end; $$;
