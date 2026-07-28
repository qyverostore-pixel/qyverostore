# WhatsApp Cloud API setup

This project uses two Supabase Edge Functions. `whatsapp-webhook` receives Meta callbacks and stores messages/statuses; `send-whatsapp-message` is an authenticated, admin-only endpoint for sending plain-text messages. The browser never calls Meta directly.

## 1. Configure Meta

1. In [Meta for Developers](https://developers.facebook.com/), create/select the QYVERO app and add the **WhatsApp** product.
2. Create or select the WhatsApp Business Account (WABA), add a business phone number, and complete the verification/registration flow. Production messaging also requires Meta business/payment setup where Meta requires it.
3. Create a long-lived system-user access token with the WhatsApp permissions Meta requires, then note the **Phone number ID** and **WhatsApp Business Account ID**.
4. In the App Dashboard, set the Callback URL to:

   `https://kysnaortzvvxutqwgukq.supabase.co/functions/v1/whatsapp-webhook`

5. Enter the exact value of `WHATSAPP_VERIFY_TOKEN` as the Meta Verify Token. It is an application secret chosen by QYVERO, not the access token.
6. Subscribe the app/WABA to the `messages` field. This delivers inbound messages and message status events (`sent`, `delivered`, `read`, and `failed`).

## 2. Configure Supabase secrets

From the linked project directory, set the required secrets. Keep the values out of `.env` files and Git.

```bash
supabase secrets set WHATSAPP_VERIFY_TOKEN="your-random-verify-token"
supabase secrets set WHATSAPP_ACCESS_TOKEN="your-meta-system-user-token"
supabase secrets set WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
supabase secrets set WHATSAPP_BUSINESS_ACCOUNT_ID="your-waba-id"
supabase secrets set META_APP_SECRET="your-meta-app-secret"
```

`send-whatsapp-message` additionally uses the platform-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Set `ALLOWED_ORIGIN` to the production QYVERO origin if this function will be invoked by the browser; it intentionally has no wildcard fallback.

## 3. Deploy

Apply the database migration through the usual project migration workflow, then deploy:

```bash
supabase functions deploy whatsapp-webhook
supabase functions deploy send-whatsapp-message
```

The included `supabase/config.toml` disables gateway JWT checks for these functions: Meta cannot supply a Supabase JWT, and the sender needs unauthenticated CORS preflight. The webhook itself verifies Meta's `X-Hub-Signature-256` HMAC using `META_APP_SECRET`; `send-whatsapp-message` performs its own authenticated-admin check.

## 4. Test

1. Enter the callback URL and verify token in Meta, then click **Verify and save**. Meta's GET verification must return the challenge.
2. Send a WhatsApp message from an allowed test recipient to the registered test/production number. Check the `whatsapp_messages` table for an `inbound` row.
3. Send a message via the `send-whatsapp-message` function as a signed-in QYVERO admin with `{ "to": "201xxxxxxxxx", "message": "Hello from QYVERO", "idempotency_key": "a-client-generated-retry-key" }`. Meta accepts digits only, including country code. Reuse the same key only when retrying the same request.
4. Confirm the recipient receives it and inspect `whatsapp_messages` as status callbacks update the outbound row.
5. Use Supabase function logs to troubleshoot. Do not paste access tokens, app secrets, or full customer message bodies into tickets/logs.

## Troubleshooting

- **Meta verification fails (403):** confirm `hub.mode=subscribe` and that Meta's Verify Token exactly matches `WHATSAPP_VERIFY_TOKEN`.
- **Webhook returns 403 for POST:** confirm `META_APP_SECRET` belongs to the Meta app configured for the webhook; the raw body must match Meta's `X-Hub-Signature-256` HMAC.
- **No webhook events:** verify the app is subscribed to the WABA and the `messages` field, and that the phone number is registered.
- **Send returns 502:** check the Meta token, Phone Number ID, app permissions, recipient/test-number eligibility, and Meta template/window rules. Outside the customer-service window, Meta may require an approved template instead of free-form text.
- **Database write fails:** apply the WhatsApp migration before deploying the functions.

## Security notes

- Credentials are Edge Function secrets only; `.env.example` contains blank placeholders.
- The webhook validates the request signature before parsing or storing it and deduplicates by Meta message ID.
- The outbound endpoint requires an authenticated QYVERO administrator and exposes no Meta error response or token.
- Outbound send requests are recorded before contacting Meta. A retry with the same idempotency key returns the prior accepted result and never sends again. Because Meta is external, a provider-accepted message whose final database update fails remains `pending` and is deliberately not automatically resent; reconcile that request before retrying with a new key.
- Follow Meta's current [Cloud API documentation](https://developers.facebook.com/docs/whatsapp/cloud-api) before changing message types or upgrading the Graph API version. This implementation uses Graph API `v25.0`, the current stable version verified during implementation.
