-- Forward-only lifecycle expansion. Existing order/payment rows are left unchanged.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned', 'failed_delivery'));

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('unpaid', 'waiting_review', 'deposit_paid', 'paid', 'refunded', 'rejected'));

alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check
  check (status in ('unpaid', 'waiting_review', 'deposit_paid', 'paid', 'refunded', 'rejected'));

-- Retain inventory's existing confirmed/cancelled behavior while allowing the expanded order lifecycle.
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
  v_current_stock integer;
  v_next_stock integer;
begin
  if not public.is_admin() then raise exception 'Only admins can update orders'; end if;
  if p_status not in ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned', 'failed_delivery') then raise exception 'Invalid order status: %', p_status; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;

  if p_status = 'confirmed' and not v_order.inventory_processed then
    for v_item in select item.product_id, item.quantity from public.order_items as item where item.order_id = p_order_id and item.product_id is not null order by item.product_id, item.id loop
      select product.stock into v_current_stock from public.products as product where product.id = v_item.product_id for update;
      if not found then raise exception 'Product not found for order item'; end if;
      if v_item.quantity > v_current_stock then raise exception 'Insufficient stock for one or more products'; end if;
      v_next_stock := v_current_stock - v_item.quantity;
      update public.products set stock = v_next_stock, status = case when v_next_stock = 0 then 'out_of_stock' else status end where id = v_item.product_id;
    end loop;
    update public.orders set status = p_status, inventory_processed = true where id = p_order_id returning * into v_order;
    return v_order;
  end if;

  if p_status = 'cancelled' and v_order.inventory_processed then
    for v_item in select item.product_id, item.quantity from public.order_items as item where item.order_id = p_order_id and item.product_id is not null order by item.product_id, item.id loop
      update public.products set stock = stock + v_item.quantity, status = case when status = 'out_of_stock' and stock + v_item.quantity > 0 then 'active' else status end where id = v_item.product_id;
    end loop;
    update public.orders set status = p_status, inventory_processed = false where id = p_order_id returning * into v_order;
    return v_order;
  end if;

  update public.orders set status = p_status where id = p_order_id returning * into v_order;
  return v_order;
end;
$$;

grant execute on function public.update_order_status_with_inventory(uuid, text) to authenticated;
