create table public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  whatsapp_message_id text unique,
  phone_number text,
  direction text not null check (direction in ('inbound', 'outbound')),
  message_type text not null default 'unknown',
  message_text text,
  status text not null default 'received',
  status_event_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index whatsapp_messages_phone_number_created_at_idx
  on public.whatsapp_messages (phone_number, created_at desc);

create table public.outbound_whatsapp_requests (
  idempotency_key text primary key,
  phone_number text not null,
  message_text text not null,
  state text not null default 'pending' check (state in ('pending', 'accepted')),
  provider_message_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.whatsapp_messages enable row level security;
alter table public.outbound_whatsapp_requests enable row level security;

create policy "Admins can select WhatsApp messages"
on public.whatsapp_messages
for select
to authenticated
using (public.is_admin());

create policy "Admins can update WhatsApp messages"
on public.whatsapp_messages
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.record_whatsapp_message(
  p_whatsapp_message_id text,
  p_phone_number text,
  p_direction text,
  p_message_type text,
  p_message_text text,
  p_status text,
  p_status_event_at timestamptz,
  p_raw_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.whatsapp_messages (
    whatsapp_message_id, phone_number, direction, message_type, message_text, status, status_event_at, raw_payload
  ) values (
    p_whatsapp_message_id, p_phone_number, p_direction, coalesce(p_message_type, 'unknown'),
    p_message_text, coalesce(p_status, 'received'), p_status_event_at, coalesce(p_raw_payload, '{}'::jsonb)
  )
  on conflict (whatsapp_message_id) do update set
    phone_number = coalesce(excluded.phone_number, public.whatsapp_messages.phone_number),
    direction = excluded.direction,
    message_type = case
      when excluded.message_type = 'unknown' then public.whatsapp_messages.message_type
      else coalesce(excluded.message_type, public.whatsapp_messages.message_type)
    end,
    message_text = coalesce(excluded.message_text, public.whatsapp_messages.message_text),
    status = case
      when public.whatsapp_messages.status = 'failed' then public.whatsapp_messages.status
      when excluded.status = 'failed'
        and (
          public.whatsapp_messages.status_event_at is null
          or excluded.status_event_at is null
          or excluded.status_event_at >= public.whatsapp_messages.status_event_at
        ) then excluded.status
      when case public.whatsapp_messages.status
        when 'accepted' then 1 when 'sent' then 2 when 'delivered' then 3 when 'read' then 4
        when 'failed' then 5 else 0 end
        >= case excluded.status
          when 'accepted' then 1 when 'sent' then 2 when 'delivered' then 3 when 'read' then 4
          when 'failed' then 5 else 0 end
        then public.whatsapp_messages.status
      when public.whatsapp_messages.status_event_at is not null
        and excluded.status_event_at is not null
        and excluded.status_event_at < public.whatsapp_messages.status_event_at
        then public.whatsapp_messages.status
      else excluded.status
    end,
    status_event_at = case
      when public.whatsapp_messages.status = 'failed' then public.whatsapp_messages.status_event_at
      when case public.whatsapp_messages.status
        when 'accepted' then 1 when 'sent' then 2 when 'delivered' then 3 when 'read' then 4
        when 'failed' then 5 else 0 end
        >= case excluded.status
          when 'accepted' then 1 when 'sent' then 2 when 'delivered' then 3 when 'read' then 4
          when 'failed' then 5 else 0 end
        then public.whatsapp_messages.status_event_at
      when public.whatsapp_messages.status_event_at is null then excluded.status_event_at
      when excluded.status_event_at is null then public.whatsapp_messages.status_event_at
      when excluded.status_event_at >= public.whatsapp_messages.status_event_at then excluded.status_event_at
      else public.whatsapp_messages.status_event_at
    end,
    raw_payload = case
      when public.whatsapp_messages.status = 'failed' then public.whatsapp_messages.raw_payload
      when case public.whatsapp_messages.status
        when 'accepted' then 1 when 'sent' then 2 when 'delivered' then 3 when 'read' then 4
        when 'failed' then 5 else 0 end
        > case excluded.status
          when 'accepted' then 1 when 'sent' then 2 when 'delivered' then 3 when 'read' then 4
          when 'failed' then 5 else 0 end
        then public.whatsapp_messages.raw_payload
      when public.whatsapp_messages.status_event_at is not null
        and (
          excluded.status_event_at is null
          or excluded.status_event_at < public.whatsapp_messages.status_event_at
        )
        then public.whatsapp_messages.raw_payload
      else excluded.raw_payload
    end,
    updated_at = now();
end;
$$;

create or replace function public.create_or_get_outbound_whatsapp_request(
  p_idempotency_key text,
  p_phone_number text,
  p_message_text text
)
returns table (
  idempotency_key text,
  phone_number text,
  message_text text,
  state text,
  provider_message_id text,
  created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with inserted as (
    insert into public.outbound_whatsapp_requests (idempotency_key, phone_number, message_text)
    values (p_idempotency_key, p_phone_number, p_message_text)
    on conflict (idempotency_key) do nothing
    returning outbound_whatsapp_requests.idempotency_key, outbound_whatsapp_requests.phone_number,
      outbound_whatsapp_requests.message_text, outbound_whatsapp_requests.state,
      outbound_whatsapp_requests.provider_message_id, true as created
  )
  select * from inserted
  union all
  select request.idempotency_key, request.phone_number, request.message_text, request.state,
    request.provider_message_id, false as created
  from public.outbound_whatsapp_requests as request
  where request.idempotency_key = p_idempotency_key
    and not exists (select 1 from inserted);
end;
$$;

create or replace function public.complete_outbound_whatsapp_request(
  p_idempotency_key text,
  p_provider_message_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.outbound_whatsapp_requests
  set state = 'accepted', provider_message_id = p_provider_message_id, updated_at = now()
  where idempotency_key = p_idempotency_key and state = 'pending';

  return found;
end;
$$;

revoke all on function public.record_whatsapp_message(text, text, text, text, text, text, timestamptz, jsonb) from public;
revoke all on function public.create_or_get_outbound_whatsapp_request(text, text, text) from public;
revoke all on function public.complete_outbound_whatsapp_request(text, text) from public;
grant execute on function public.record_whatsapp_message(text, text, text, text, text, text, timestamptz, jsonb) to service_role;
grant execute on function public.create_or_get_outbound_whatsapp_request(text, text, text) to service_role;
grant execute on function public.complete_outbound_whatsapp_request(text, text) to service_role;
