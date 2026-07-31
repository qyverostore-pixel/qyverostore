-- Production table-access audit: table privileges are required in addition to RLS.
-- This migration is intentionally forward-only and keeps RLS enabled on every
-- application table. Anonymous clients receive read access only to explicitly
-- public storefront data and cannot write directly to any table.

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.messages enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;
alter table public.payments enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.wishlist enable row level security;
alter table public.product_reviews enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.shipping_zones enable row level security;
alter table public.shipping_rates enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.email_settings enable row level security;
alter table public.email_queue enable row level security;

-- Remove all implicit/public table access before granting only the access used
-- by the storefront and authenticated application. service_role bypasses RLS.
revoke all privileges on table public.profiles, public.addresses, public.categories,
  public.products, public.product_images, public.messages, public.orders,
  public.order_items, public.store_settings, public.payments, public.payment_proofs,
  public.wishlist, public.product_reviews, public.coupons, public.coupon_redemptions,
  public.shipping_zones, public.shipping_rates, public.newsletter_subscribers,
  public.email_settings, public.email_queue from public, anon;

-- Authenticated access is limited by the RLS policies below. Full table grants
-- are required where an authenticated administrator has a management policy.
grant select, insert, update, delete on table public.profiles, public.addresses, public.categories,
  public.products, public.product_images, public.messages, public.orders,
  public.order_items, public.store_settings, public.payments, public.payment_proofs,
  public.wishlist, public.product_reviews, public.coupons, public.coupon_redemptions,
  public.shipping_zones, public.shipping_rates, public.newsletter_subscribers,
  public.email_settings, public.email_queue to authenticated;

-- Explicit public storefront reads. No anonymous write privilege is granted.
grant select on table public.categories, public.products, public.product_images,
  public.product_reviews, public.store_settings, public.shipping_zones,
  public.shipping_rates to anon;

-- Normalize policies so privileges and policies agree. Customer access is scoped
-- to ownership; every administrative write remains restricted to is_admin().
drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Admins can read profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
drop policy if exists "Admins can manage profiles" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can read their own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Admins can read profiles" on public.profiles for select to authenticated using ((select public.is_admin()));
create policy "Users can update their own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Admins can manage profiles" on public.profiles for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Users can manage their own addresses" on public.addresses;
drop policy if exists "Admins can manage addresses" on public.addresses;
create policy "Users can manage their own addresses" on public.addresses for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Admins can manage addresses" on public.addresses for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Anyone can read active categories" on public.categories;
drop policy if exists "Admins can manage categories" on public.categories;
create policy "Anyone can read active categories" on public.categories for select to anon, authenticated using (is_active = true or (select public.is_admin()));
create policy "Admins can manage categories" on public.categories for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Anyone can read active products" on public.products;
drop policy if exists "Admins can manage products" on public.products;
create policy "Anyone can read active products" on public.products for select to anon, authenticated using ((is_active = true and status in ('active', 'out_of_stock')) or (select public.is_admin()));
create policy "Admins can manage products" on public.products for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Anyone can read images for active products" on public.product_images;
drop policy if exists "Admins can manage product images" on public.product_images;
create policy "Anyone can read images for active products" on public.product_images for select to anon, authenticated using ((select public.is_admin()) or exists (select 1 from public.products where products.id = product_images.product_id and products.is_active = true and products.status in ('active', 'out_of_stock')));
create policy "Admins can manage product images" on public.product_images for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Anyone can insert messages" on public.messages;
drop policy if exists "Authenticated users can insert messages" on public.messages;
drop policy if exists "Admins can select messages" on public.messages;
drop policy if exists "Admins can update messages" on public.messages;
drop policy if exists "Admins can delete messages" on public.messages;
create policy "Authenticated users can insert messages" on public.messages for insert to authenticated with check (true);
create policy "Admins can manage messages" on public.messages for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Users can read their own orders" on public.orders;
drop policy if exists "Admins can manage orders" on public.orders;
create policy "Users can read their own orders" on public.orders for select to authenticated using ((select auth.uid()) = customer_id);
create policy "Admins can manage orders" on public.orders for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Users can read their own order items" on public.order_items;
drop policy if exists "Admins can manage order items" on public.order_items;
create policy "Users can read their own order items" on public.order_items for select to authenticated using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.customer_id = (select auth.uid())));
create policy "Admins can manage order items" on public.order_items for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Anyone can read store settings" on public.store_settings;
drop policy if exists "Admins can manage store settings" on public.store_settings;
create policy "Anyone can read store settings" on public.store_settings for select to anon, authenticated using (true);
create policy "Admins can manage store settings" on public.store_settings for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Users can read their own payments" on public.payments;
drop policy if exists "Admins can manage payments" on public.payments;
create policy "Users can read their own payments" on public.payments for select to authenticated using (exists (select 1 from public.orders where orders.id = payments.order_id and orders.customer_id = (select auth.uid())));
create policy "Admins can manage payments" on public.payments for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Users can read their own payment proofs" on public.payment_proofs;
drop policy if exists "Admins can manage payment proofs" on public.payment_proofs;
create policy "Users can read their own payment proofs" on public.payment_proofs for select to authenticated using (exists (select 1 from public.orders where orders.id = payment_proofs.order_id and orders.customer_id = (select auth.uid())));
create policy "Admins can manage payment proofs" on public.payment_proofs for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Customers can read their own wishlist" on public.wishlist;
drop policy if exists "Customers can add to their own wishlist" on public.wishlist;
drop policy if exists "Customers can remove their own wishlist" on public.wishlist;
drop policy if exists "Admins can manage wishlist" on public.wishlist;
create policy "Customers can read their own wishlist" on public.wishlist for select to authenticated using ((select auth.uid()) = customer_id);
create policy "Customers can add to their own wishlist" on public.wishlist for insert to authenticated with check ((select auth.uid()) = customer_id);
create policy "Customers can remove their own wishlist" on public.wishlist for delete to authenticated using ((select auth.uid()) = customer_id);
create policy "Admins can manage wishlist" on public.wishlist for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Anyone can read product reviews" on public.product_reviews;
drop policy if exists "Customers can create their own product reviews" on public.product_reviews;
drop policy if exists "Customers can update their own product reviews" on public.product_reviews;
drop policy if exists "Customers can delete their own product reviews" on public.product_reviews;
drop policy if exists "Admins can manage product reviews" on public.product_reviews;
create policy "Anyone can read product reviews" on public.product_reviews for select to anon, authenticated using (true);
create policy "Customers can create their own product reviews" on public.product_reviews for insert to authenticated with check ((select auth.uid()) = customer_id);
create policy "Customers can update their own product reviews" on public.product_reviews for update to authenticated using ((select auth.uid()) = customer_id) with check ((select auth.uid()) = customer_id);
create policy "Customers can delete their own product reviews" on public.product_reviews for delete to authenticated using ((select auth.uid()) = customer_id);
create policy "Admins can manage product reviews" on public.product_reviews for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Authenticated users can read active coupons" on public.coupons;
drop policy if exists "Admins can manage coupons" on public.coupons;
create policy "Authenticated users can read active coupons" on public.coupons for select to authenticated using (is_active = true or (select public.is_admin()));
create policy "Admins can manage coupons" on public.coupons for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Admins manage coupon redemptions" on public.coupon_redemptions;
drop policy if exists "Customers read own coupon redemptions" on public.coupon_redemptions;
create policy "Customers read own coupon redemptions" on public.coupon_redemptions for select to authenticated using (customer_id = (select auth.uid()));
create policy "Admins manage coupon redemptions" on public.coupon_redemptions for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Anyone can read active shipping zones" on public.shipping_zones;
drop policy if exists "Admins manage shipping zones" on public.shipping_zones;
create policy "Anyone can read active shipping zones" on public.shipping_zones for select to anon, authenticated using (is_active = true or (select public.is_admin()));
create policy "Admins manage shipping zones" on public.shipping_zones for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Anyone can read active shipping rates" on public.shipping_rates;
drop policy if exists "Admins manage shipping rates" on public.shipping_rates;
create policy "Anyone can read active shipping rates" on public.shipping_rates for select to anon, authenticated using (is_active = true or (select public.is_admin()));
create policy "Admins manage shipping rates" on public.shipping_rates for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Admins manage newsletter subscribers" on public.newsletter_subscribers;
create policy "Admins manage newsletter subscribers" on public.newsletter_subscribers for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Admins manage email settings" on public.email_settings;
create policy "Admins manage email settings" on public.email_settings for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Admins read email queue" on public.email_queue;
drop policy if exists "Admins manage email queue" on public.email_queue;
create policy "Admins manage email queue" on public.email_queue for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- A security-definer subscription function would otherwise let anonymous users
-- write despite table privileges; keep subscription creation authenticated.
revoke execute on function public.subscribe_newsletter(text) from public, anon;
grant execute on function public.subscribe_newsletter(text) to authenticated;
