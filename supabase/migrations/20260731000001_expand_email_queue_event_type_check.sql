-- The queue was intentionally removed in an earlier migration. Preserve any legacy
-- production queue table while allowing fresh databases to continue safely without it.
do $$
begin
  if to_regclass('public.email_queue') is not null then
    alter table public.email_queue drop constraint if exists email_queue_event_type_check;
    alter table public.email_queue add constraint email_queue_event_type_check check (
      event_type in (
        'order_created', 'order_confirmation', 'order_status', 'order_confirmed',
        'order_preparing', 'order_shipped', 'order_delivered', 'payment_received',
        'payment_confirmed', 'payment_rejected', 'password_reset',
        'email_verification', 'review_request', 'newsletter_welcome', 'test'
      )
    );
  end if;
end;
$$;
