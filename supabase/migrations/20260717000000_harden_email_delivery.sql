-- Keep existing queue records compatible while making delivery idempotent and observable.
alter table public.email_queue
  add column if not exists retry_count integer not null default 0,
  add column if not exists processed_at timestamptz;

update public.email_queue
set retry_count = greatest(retry_count, attempts)
where retry_count = 0 and attempts > 0;

alter table public.email_queue drop constraint if exists email_queue_event_type_check;
alter table public.email_queue add constraint email_queue_event_type_check check (
  event_type in (
    'order_confirmation', 'order_status', 'order_confirmed', 'order_shipped', 'order_delivered',
    'payment_confirmed', 'payment_rejected', 'review_request', 'newsletter_welcome', 'test'
  )
);

delete from public.email_queue q
using (
  select id, row_number() over (partition by order_id, event_type order by (status = 'sent') desc, created_at) as row_number
  from public.email_queue
  where order_id is not null
    and event_type in ('order_confirmation', 'order_confirmed', 'order_shipped', 'order_delivered', 'payment_confirmed', 'payment_rejected', 'review_request')
) duplicates
where q.id = duplicates.id and duplicates.row_number > 1;

delete from public.email_queue q
using (
  select id, row_number() over (partition by order_id, event_type, coalesce(payload ->> 'status', '') order by (status = 'sent') desc, created_at) as row_number
  from public.email_queue
  where order_id is not null and event_type = 'order_status'
) duplicates
where q.id = duplicates.id and duplicates.row_number > 1;

delete from public.email_queue q
using (
  select id, row_number() over (partition by recipient, event_type order by (status = 'sent') desc, created_at) as row_number
  from public.email_queue
  where event_type = 'newsletter_welcome'
) duplicates
where q.id = duplicates.id and duplicates.row_number > 1;

create unique index if not exists email_queue_order_event_once_idx
  on public.email_queue (order_id, event_type)
  where order_id is not null
    and event_type in ('order_confirmation', 'order_confirmed', 'order_shipped', 'order_delivered', 'payment_confirmed', 'payment_rejected', 'review_request');

create unique index if not exists email_queue_newsletter_welcome_once_idx
  on public.email_queue (recipient, event_type)
  where event_type = 'newsletter_welcome';

create unique index if not exists email_queue_order_status_once_idx
  on public.email_queue (order_id, event_type, (coalesce(payload ->> 'status', '')))
  where order_id is not null and event_type = 'order_status';

create or replace function public.enqueue_order_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if nullif(trim(new.customer_email), '') is not null then
    insert into public.email_queue(event_type, order_id, recipient)
    values ('order_confirmation', new.id, lower(trim(new.customer_email)))
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.enqueue_order_status_email()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  notification_type text;
begin
  if new.status is not distinct from old.status or nullif(trim(new.customer_email), '') is null then
    return new;
  end if;

  notification_type := case new.status
    when 'confirmed' then 'order_confirmed'
    when 'shipped' then 'order_shipped'
    when 'delivered' then 'order_delivered'
    else 'order_status'
  end;

  insert into public.email_queue(event_type, order_id, recipient, payload)
  values (notification_type, new.id, lower(trim(new.customer_email)), jsonb_build_object('status', new.status))
  on conflict do nothing;

  if new.status = 'delivered' then
    insert into public.email_queue(event_type, order_id, recipient, scheduled_at)
    values ('review_request', new.id, lower(trim(new.customer_email)), now() + interval '7 days')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.enqueue_payment_email()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  recipient_email text;
  event_name text;
begin
  if new.status is not distinct from old.status or new.status not in ('paid', 'rejected') then
    return new;
  end if;

  select customer_email into recipient_email from public.orders where id = new.order_id;
  if nullif(trim(recipient_email), '') is not null then
    event_name := case when new.status = 'paid' then 'payment_confirmed' else 'payment_rejected' end;
    insert into public.email_queue(event_type, order_id, recipient, payload)
    values (event_name, new.order_id, lower(trim(recipient_email)), jsonb_build_object('reason', new.rejection_reason))
    on conflict do nothing;
  end if;
  return new;
end;
$$;

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

  insert into public.email_queue(event_type, recipient)
  values ('newsletter_welcome', normalized_email)
  on conflict do nothing;
end;
$$;

create or replace function public.claim_email_queue(p_limit integer default 25)
returns setof public.email_queue language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'Service role required';
  end if;

  return query
  with claimed as (
    select id
    from public.email_queue
    where retry_count < 3
      and (
        (status = 'pending' and scheduled_at <= now())
        or (status = 'processing' and processing_at < now() - interval '10 minutes')
      )
    order by scheduled_at
    for update skip locked
    limit greatest(1, least(p_limit, 100))
  )
  update public.email_queue q
  set status = 'processing',
      attempts = q.attempts + 1,
      retry_count = q.retry_count + 1,
      processing_at = now(),
      last_error = null
  from claimed
  where q.id = claimed.id
  returning q.*;
end;
$$;
