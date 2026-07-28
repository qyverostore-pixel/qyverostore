drop trigger if exists queue_order_confirmation_email on public.orders;
drop trigger if exists queue_order_status_email on public.orders;
drop trigger if exists queue_payment_status_email on public.payments;

drop function if exists public.enqueue_order_email();
drop function if exists public.enqueue_order_status_email();
drop function if exists public.enqueue_payment_email();
drop function if exists public.queue_test_email(text);
drop function if exists public.claim_email_queue(integer);

drop table if exists public.email_queue;

create or replace function public.subscribe_newsletter(p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  normalized_email text := lower(trim(p_email));
begin
  if normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address';
  end if;

  insert into public.newsletter_subscribers(email)
  values (normalized_email)
  on conflict (email) do update set is_active = true, subscribed_at = now();
end;
$$;
