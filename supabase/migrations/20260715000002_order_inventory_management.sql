alter table public.orders
  add column if not exists inventory_processed boolean not null default false;

create index if not exists orders_inventory_processed_idx
  on public.orders (inventory_processed);

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
  v_item record;
  v_updated integer;
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
    for v_item in
      select product_id, sum(quantity)::integer as quantity
        from public.order_items
       where order_id = p_order_id
         and product_id is not null
       group by product_id
    loop
      update public.products
         set stock = stock - v_item.quantity,
             status = case
               when stock - v_item.quantity = 0 then 'out_of_stock'
               else status
             end
       where id = v_item.product_id
         and stock >= v_item.quantity;

      get diagnostics v_updated = row_count;

      if v_updated <> 1 then
        raise exception 'Insufficient stock for one or more products';
      end if;
    end loop;

    update public.orders
       set status = p_status,
           inventory_processed = true
     where id = p_order_id
     returning * into v_order;

    return v_order;
  end if;

  if p_status = 'cancelled' and v_order.inventory_processed then
    for v_item in
      select product_id, sum(quantity)::integer as quantity
        from public.order_items
       where order_id = p_order_id
         and product_id is not null
       group by product_id
    loop
      update public.products
         set stock = stock + v_item.quantity,
             status = case
               when status = 'out_of_stock' and stock + v_item.quantity > 0 then 'active'
               else status
             end
       where id = v_item.product_id;
    end loop;

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
