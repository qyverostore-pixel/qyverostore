create or replace function public.update_order_status_with_inventory(
  p_order_id uuid,
  p_status text
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_insufficient_product_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can update orders';
  end if;

  if p_status not in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') then
    raise exception 'Invalid order status: %', p_status;
  end if;

  select *
    into v_order
    from public.orders
   where id = p_order_id
   for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if p_status = 'confirmed' and not v_order.inventory_processed then
    perform 1
      from public.products as product
     where product.id in (
       select item.product_id
         from public.order_items as item
        where item.order_id = p_order_id
          and item.product_id is not null
        group by item.product_id
     )
     order by product.id
     for update;

    select product.id
      into v_insufficient_product_id
      from public.products as product
      join (
        select item.product_id, sum(item.quantity)::integer as quantity
          from public.order_items as item
         where item.order_id = p_order_id
           and item.product_id is not null
         group by item.product_id
      ) as ordered_item on ordered_item.product_id = product.id
     where product.stock < ordered_item.quantity
     limit 1;

    if v_insufficient_product_id is not null then
      raise exception 'Insufficient stock for one or more products';
    end if;

    update public.products as product
       set stock = product.stock - ordered_item.quantity,
           status = case
             when product.stock - ordered_item.quantity = 0 then 'out_of_stock'
             else product.status
           end
      from (
        select item.product_id, sum(item.quantity)::integer as quantity
          from public.order_items as item
         where item.order_id = p_order_id
           and item.product_id is not null
         group by item.product_id
      ) as ordered_item
     where product.id = ordered_item.product_id;

    update public.orders
       set status = p_status,
           inventory_processed = true
     where id = p_order_id
     returning * into v_order;

    return v_order;
  end if;

  if p_status = 'cancelled' and v_order.inventory_processed then
    perform 1
      from public.products as product
     where product.id in (
       select item.product_id
         from public.order_items as item
        where item.order_id = p_order_id
          and item.product_id is not null
        group by item.product_id
     )
     order by product.id
     for update;

    update public.products as product
       set stock = product.stock + ordered_item.quantity,
           status = case
             when product.status = 'out_of_stock' and product.stock + ordered_item.quantity > 0 then 'active'
             else product.status
           end
      from (
        select item.product_id, sum(item.quantity)::integer as quantity
          from public.order_items as item
         where item.order_id = p_order_id
           and item.product_id is not null
         group by item.product_id
      ) as ordered_item
     where product.id = ordered_item.product_id;

    update public.orders
       set status = p_status,
           inventory_processed = false
     where id = p_order_id
     returning * into v_order;

    return v_order;
  end if;

  update public.orders
     set status = p_status
   where id = p_order_id
   returning * into v_order;

  return v_order;
end;
$$;

grant execute on function public.update_order_status_with_inventory(uuid, text) to authenticated;
