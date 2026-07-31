-- Removes objects created exclusively for the retired WhatsApp Cloud API integration.
-- Manual wa.me ordering and all checkout, payment, and email objects remain untouched.

drop function if exists public.record_whatsapp_message(text, text, text, text, text, text, timestamptz, jsonb);
drop function if exists public.create_or_get_outbound_whatsapp_request(text, text, text);
drop function if exists public.complete_outbound_whatsapp_request(text, text);

drop table if exists public.outbound_whatsapp_requests;
drop table if exists public.whatsapp_messages;
