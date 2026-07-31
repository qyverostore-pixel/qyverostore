-- Restore the admin analytics RPC when its original migration is recorded but
-- the function is absent from the production schema.
create or replace function public.get_admin_analytics(p_period text default '30d')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  range_start timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  range_start := case p_period
    when 'today' then date_trunc('day', now())
    when '7d' then now() - interval '6 days'
    when '30d' then now() - interval '29 days'
    when '12m' then date_trunc('month', now()) - interval '11 months'
    else now() - interval '29 days'
  end;

  return (
    with
      orders_base as (
        select * from public.orders
      ),
      ranged_orders as (
        select * from orders_base
        where status <> 'cancelled' and created_at >= range_start
      ),
      stats as (
        select
          coalesce(sum(total_amount) filter (where status <> 'cancelled'), 0) as total_revenue,
          coalesce(sum(total_amount) filter (where status <> 'cancelled' and created_at >= date_trunc('day', now())), 0) as today_revenue,
          coalesce(sum(total_amount) filter (where status <> 'cancelled' and created_at >= date_trunc('month', now())), 0) as month_revenue,
          count(*) as total_orders,
          count(*) filter (where status = 'pending') as pending_orders,
          count(*) filter (where status = 'delivered') as completed_orders,
          count(*) filter (where status = 'cancelled') as cancelled_orders,
          coalesce(avg(total_amount) filter (where status <> 'cancelled'), 0) as average_order_value
        from orders_base
      ),
      customers as (
        select count(*) as total_customers from public.profiles
      ),
      customer_retention as (
        select count(*) as returning_customers
        from (
          select customer_id
          from orders_base
          where customer_id is not null
          group by customer_id
          having count(*) > 1
        ) as customer_orders
      ),
      sales_points as (
        select
          case when p_period = '12m' then to_char(date_trunc('month', created_at), 'Mon YYYY') else to_char(date_trunc('day', created_at), 'Mon DD') end as label,
          date_trunc(case when p_period = '12m' then 'month' else 'day' end, created_at) as bucket,
          coalesce(sum(total_amount), 0) as revenue
        from ranged_orders
        group by 1, 2
        order by 2
      ),
      top_products as (
        select
          product.id,
          product.name,
          product.sku,
          product.stock,
          coalesce(sum(item.quantity) filter (where order_data.status <> 'cancelled'), 0) as quantity_sold,
          coalesce(sum(item.total_price) filter (where order_data.status <> 'cancelled'), 0) as revenue
        from public.products as product
        left join public.order_items as item on item.product_id = product.id
        left join orders_base as order_data on order_data.id = item.order_id
        group by product.id, product.name, product.sku, product.stock
        order by quantity_sold desc, revenue desc
        limit 10
      ),
      low_stock as (
        select id, name, sku, stock, low_stock_threshold
        from public.products
        where stock <= low_stock_threshold
        order by stock asc, name asc
        limit 10
      ),
      top_customers as (
        select
          coalesce(order_data.customer_name, profile.full_name, order_data.customer_email, 'Guest') as name,
          count(*) as orders,
          coalesce(sum(order_data.total_amount) filter (where order_data.status <> 'cancelled'), 0) as revenue,
          max(order_data.created_at) as last_order
        from orders_base as order_data
        left join public.profiles as profile on profile.id = order_data.customer_id
        group by order_data.customer_id, order_data.customer_name, profile.full_name, order_data.customer_email
        order by revenue desc, orders desc
        limit 10
      ),
      latest_orders as (
        select order_number, coalesce(customer_name, customer_email, 'Guest') as customer,
          total_amount, payment_method, payment_status, status, created_at
        from orders_base
        order by created_at desc
        limit 10
      ),
      coupon_stats as (
        select
          coalesce((select coupon_code from orders_base where coupon_code is not null group by coupon_code order by count(*) desc, coupon_code limit 1), 'None') as most_used,
          count(*) filter (where coupon_code is not null) as total_usage,
          coalesce(sum(discount_amount), 0) as discount_given
        from orders_base
      ),
      review_stats as (
        select coalesce(avg(rating), 0) as average_rating, count(*) as total_reviews
        from public.product_reviews
      ),
      highest_rated as (
        select name, rating from public.products
        where reviews_count > 0
        order by rating desc, reviews_count desc
        limit 3
      ),
      lowest_rated as (
        select name, rating from public.products
        where reviews_count > 0
        order by rating asc, reviews_count desc
        limit 3
      )
    select jsonb_build_object(
      'stats', (select jsonb_build_object(
        'totalRevenue', total_revenue,
        'todayRevenue', today_revenue,
        'monthRevenue', month_revenue,
        'totalOrders', total_orders,
        'pendingOrders', pending_orders,
        'completedOrders', completed_orders,
        'cancelledOrders', cancelled_orders,
        'averageOrderValue', average_order_value,
        'totalCustomers', (select total_customers from customers),
        'returningCustomers', (select returning_customers from customer_retention),
        'conversionRate', case when total_orders = 0 then 0 else round(completed_orders::numeric * 100 / total_orders, 1) end
      ) from stats),
      'sales', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'revenue', revenue) order by bucket) from sales_points), '[]'::jsonb),
      'topProducts', coalesce((select jsonb_agg(to_jsonb(top_products)) from top_products), '[]'::jsonb),
      'lowStock', coalesce((select jsonb_agg(to_jsonb(low_stock)) from low_stock), '[]'::jsonb),
      'topCustomers', coalesce((select jsonb_agg(to_jsonb(top_customers)) from top_customers), '[]'::jsonb),
      'latestOrders', coalesce((select jsonb_agg(to_jsonb(latest_orders)) from latest_orders), '[]'::jsonb),
      'coupons', (select to_jsonb(coupon_stats) from coupon_stats),
      'reviews', jsonb_build_object(
        'averageRating', (select average_rating from review_stats),
        'totalReviews', (select total_reviews from review_stats),
        'highest', coalesce((select jsonb_agg(to_jsonb(highest_rated)) from highest_rated), '[]'::jsonb),
        'lowest', coalesce((select jsonb_agg(to_jsonb(lowest_rated)) from lowest_rated), '[]'::jsonb)
      )
    )
  );
end;
$$;

revoke all on function public.get_admin_analytics(text) from public, anon;
grant execute on function public.get_admin_analytics(text) to authenticated;
