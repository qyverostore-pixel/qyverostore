-- Product review storage, access policies, and denormalized product rating maintenance.
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  review text not null check (char_length(trim(review)) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique (product_id, customer_id)
);

create index if not exists product_reviews_product_created_idx on public.product_reviews (product_id, created_at desc);
create index if not exists product_reviews_rating_idx on public.product_reviews (rating);

create or replace function public.refresh_product_review_summary(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products
  set rating = coalesce((select round(avg(r.rating)::numeric, 1) from public.product_reviews r where r.product_id = p_product_id), 0),
      reviews_count = (select count(*) from public.product_reviews r where r.product_id = p_product_id)
  where id = p_product_id;
end;
$$;

create or replace function public.refresh_product_review_summary_on_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.refresh_product_review_summary(coalesce(new.product_id, old.product_id));
  if tg_op = 'UPDATE' and new.product_id is distinct from old.product_id then
    perform public.refresh_product_review_summary(old.product_id);
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists refresh_product_review_summary_on_change on public.product_reviews;
create trigger refresh_product_review_summary_on_change
after insert or update or delete on public.product_reviews
for each row execute function public.refresh_product_review_summary_on_change();

alter table public.product_reviews enable row level security;

create policy "Anyone can read product reviews"
  on public.product_reviews for select using (true);

create policy "Customers can create their own product reviews"
  on public.product_reviews for insert to authenticated
  with check ((select auth.uid()) = customer_id);

create policy "Customers can update their own product reviews"
  on public.product_reviews for update to authenticated
  using ((select auth.uid()) = customer_id)
  with check ((select auth.uid()) = customer_id);

create policy "Customers can delete their own product reviews"
  on public.product_reviews for delete to authenticated
  using ((select auth.uid()) = customer_id);

create policy "Admins can manage product reviews"
  on public.product_reviews for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
