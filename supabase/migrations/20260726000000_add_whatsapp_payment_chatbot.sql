alter table public.store_settings
  add column if not exists vodafone_cash_number text not null default 'COMING_SOON',
  add column if not exists instapay_account text not null default 'COMING_SOON',
  add column if not exists cod_deposit_percentage numeric(5, 2) not null default 20
    check (cod_deposit_percentage > 0 and cod_deposit_percentage <= 100);

create or replace function public.get_payment_chatbot_order(p_order_number text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid := auth.uid();
  v_order public.orders%rowtype;
  v_deposit_percentage numeric(5, 2);
  v_vodafone_cash_number text;
  v_instapay_account text;
  v_deposit_amount numeric(12, 2);
  v_remaining_amount numeric(12, 2);
begin
  if v_customer_id is null then
    raise exception 'Please sign in to access payment instructions';
  end if;

  select * into v_order
  from public.orders
  where order_number = upper(trim(p_order_number))
    and (customer_id = v_customer_id or public.is_admin())
  limit 1;

  if not found then
    raise exception 'This order could not be found';
  end if;

  select
    coalesce(cod_deposit_percentage, 20),
    coalesce(vodafone_cash_number, 'COMING_SOON'),
    coalesce(instapay_account, 'COMING_SOON')
  into v_deposit_percentage, v_vodafone_cash_number, v_instapay_account
  from public.store_settings
  where id = true;

  v_deposit_percentage := coalesce(v_deposit_percentage, 20);
  v_vodafone_cash_number := coalesce(v_vodafone_cash_number, 'COMING_SOON');
  v_instapay_account := coalesce(v_instapay_account, 'COMING_SOON');
  v_deposit_amount := round(v_order.total_amount * v_deposit_percentage / 100, 2);
  v_remaining_amount := round(v_order.total_amount - v_deposit_amount, 2);

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'customer_name', coalesce(v_order.full_name, v_order.customer_name),
    'customer_phone', v_order.phone,
    'payment_method', v_order.payment_method,
    'payment_status', v_order.payment_status,
    'order_status', v_order.status,
    'total_amount', v_order.total_amount,
    'subtotal', v_order.subtotal,
    'shipping_cost', v_order.shipping_cost,
    'created_at', v_order.created_at,
    'cod_deposit_percentage', v_deposit_percentage,
    'deposit_amount', v_deposit_amount,
    'remaining_amount', v_remaining_amount,
    'vodafone_cash_number', v_vodafone_cash_number,
    'instapay_account', v_instapay_account,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_name', item.product_name,
        'quantity', item.quantity,
        'unit_price', item.unit_price,
        'total_price', item.total_price
      ) order by item.created_at)
      from public.order_items as item
      where item.order_id = v_order.id
    ), '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_payment_chatbot_order(text) to authenticated;
