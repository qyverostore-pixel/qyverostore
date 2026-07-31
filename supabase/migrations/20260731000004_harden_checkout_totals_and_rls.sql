-- Prevent direct browser writes; checkout is performed only by authenticated RPCs.
drop policy if exists "Anyone can create checkout orders" on public.orders;
drop policy if exists "Anyone can create order items" on public.order_items;
drop policy if exists "Anyone can create payments" on public.payments;
drop policy if exists "Anyone can create payment proofs" on public.payment_proofs;

revoke execute on function public.create_order(jsonb, jsonb, text, jsonb) from anon;
revoke execute on function public.create_order_with_coupon(jsonb, jsonb, text, jsonb, text) from anon;
revoke execute on function public.redeem_coupon_for_order(uuid, text, numeric, numeric) from anon;
revoke execute on function public.validate_coupon(text, numeric) from anon;
revoke execute on function public.create_order(jsonb, jsonb, text, jsonb) from public;
revoke execute on function public.create_order_with_coupon(jsonb, jsonb, text, jsonb, text) from public;
revoke execute on function public.redeem_coupon_for_order(uuid, text, numeric, numeric) from public;
revoke execute on function public.validate_coupon(text, numeric) from public;

grant execute on function public.create_order(jsonb, jsonb, text, jsonb) to authenticated;
grant execute on function public.create_order_with_coupon(jsonb, jsonb, text, jsonb, text) to authenticated;
grant execute on function public.redeem_coupon_for_order(uuid, text, numeric, numeric) to authenticated;
grant execute on function public.validate_coupon(text, numeric) to authenticated;

-- The order is authoritative. Shipping triggers and coupon redemption can change its total;
-- keep every associated payment amount equal to that total.
create or replace function public.sync_payment_amount_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_total numeric(12, 2);
begin
  select total_amount into v_total from public.orders where id = new.order_id;
  if not found then raise exception 'Order not found for payment'; end if;
  new.amount := v_total;
  return new;
end;
$$;

create or replace function public.sync_payment_amount_after_order_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.payments
     set amount = new.total_amount
   where order_id = new.id
     and amount is distinct from new.total_amount;
  return new;
end;
$$;

drop trigger if exists sync_payment_amount_before_write on public.payments;
create trigger sync_payment_amount_before_write
  before insert or update of order_id, amount on public.payments
  for each row execute function public.sync_payment_amount_before_write();

drop trigger if exists sync_payment_amount_after_order_change on public.orders;
create trigger sync_payment_amount_after_order_change
  after insert or update of subtotal, shipping_cost, discount_amount, total_amount on public.orders
  for each row execute function public.sync_payment_amount_after_order_change();
