const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const whatsappAccessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const whatsappPhoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "",
};

function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing required Edge Function secret: ${name}`);
  return value;
}

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function normalizePhone(value: unknown) {
  if (typeof value !== "string") return null;
  const digits = value.replace(/[\s()+-]/g, "");
  return /^\d{8,15}$/.test(digits) ? digits : null;
}

function validIdempotencyKey(value: unknown) {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(value) ? value : null;
}

async function isAdmin(authorization: string) {
  const url = required(supabaseUrl, "SUPABASE_URL");
  const key = required(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${url}/rest/v1/rpc/is_admin`, {
    method: "POST",
    headers: { apikey: key, Authorization: authorization, "Content-Type": "application/json" },
    body: "{}",
  });
  return response.ok && (await response.json()) === true;
}

async function recordOutgoing(id: string, phone: string, message: string) {
  const url = required(supabaseUrl, "SUPABASE_URL");
  const key = required(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${url}/rest/v1/rpc/record_whatsapp_message`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      p_whatsapp_message_id: id,
      p_phone_number: phone,
      p_direction: "outbound",
      p_message_type: "text",
      p_message_text: message,
      p_status: "accepted",
      p_status_event_at: null,
      p_raw_payload: { provider_message_id: id },
    }),
  });
  if (!response.ok) throw new Error(`Database write failed (${response.status})`);
}

type OutboundRequest = {
  idempotency_key: string;
  phone_number: string;
  message_text: string;
  state: "pending" | "accepted";
  provider_message_id: string | null;
  created: boolean;
};

async function createOrGetOutboundRequest(idempotencyKey: string, phone: string, message: string) {
  const url = required(supabaseUrl, "SUPABASE_URL");
  const key = required(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${url}/rest/v1/rpc/create_or_get_outbound_whatsapp_request`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      p_idempotency_key: idempotencyKey,
      p_phone_number: phone,
      p_message_text: message,
    }),
  });
  if (!response.ok) throw new Error(`Outbound request write failed (${response.status})`);
  const [request] = (await response.json()) as OutboundRequest[];
  if (!request) throw new Error("Outbound request was not created");
  return request;
}

async function completeOutboundRequest(idempotencyKey: string, providerMessageId: string) {
  const url = required(supabaseUrl, "SUPABASE_URL");
  const key = required(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${url}/rest/v1/rpc/complete_outbound_whatsapp_request`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      p_idempotency_key: idempotencyKey,
      p_provider_message_id: providerMessageId,
    }),
  });
  if (!response.ok) throw new Error(`Outbound request completion failed (${response.status})`);
  return (await response.json()) === true;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Authentication required" }, 401);
    if (!(await isAdmin(authorization))) return json({ error: "Admin access required" }, 403);
    const payload = (await request.json()) as {
      to?: unknown;
      message?: unknown;
      idempotency_key?: unknown;
    };
    const to = normalizePhone(payload.to);
    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    if (!to) return json({ error: "A valid E.164 phone number without + is required" }, 400);
    if (!message || message.length > 4096)
      return json({ error: "Message must contain 1 to 4096 characters" }, 400);
    const suppliedIdempotencyKey =
      payload.idempotency_key === undefined ? null : validIdempotencyKey(payload.idempotency_key);
    if (payload.idempotency_key !== undefined && !suppliedIdempotencyKey)
      return json({ error: "idempotency_key must be 1 to 128 URL-safe characters" }, 400);
    const idempotencyKey = suppliedIdempotencyKey ?? crypto.randomUUID();
    const outboundRequest = await createOrGetOutboundRequest(idempotencyKey, to, message);
    if (outboundRequest.phone_number !== to || outboundRequest.message_text !== message)
      return json({ error: "idempotency_key has already been used for a different request" }, 409);
    if (!outboundRequest.created) {
      if (outboundRequest.state === "accepted" && outboundRequest.provider_message_id) {
        return json({
          sent: true,
          providerMessageId: outboundRequest.provider_message_id,
          idempotencyKey,
          duplicate: true,
        });
      }
      return json(
        {
          error: "A previous request with this idempotency_key is still pending; it was not resent",
          idempotencyKey,
        },
        409,
      );
    }

    const token = required(whatsappAccessToken, "WHATSAPP_ACCESS_TOKEN");
    const phoneNumberId = required(whatsappPhoneNumberId, "WHATSAPP_PHONE_NUMBER_ID");
    const providerResponse = await fetch(
      `https://graph.facebook.com/v25.0/${encodeURIComponent(phoneNumberId)}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { body: message },
        }),
      },
    );
    if (!providerResponse.ok) {
      console.error(`WhatsApp Cloud API request failed (${providerResponse.status})`);
      return json({ error: "WhatsApp message was not accepted by the provider" }, 502);
    }
    const providerPayload = (await providerResponse.json()) as {
      messages?: Array<{ id?: unknown }>;
    };
    const messageId = providerPayload.messages?.[0]?.id;
    if (typeof messageId !== "string")
      return json({ error: "WhatsApp provider returned an invalid response" }, 502);
    await recordOutgoing(messageId, to, message);
    const completed = await completeOutboundRequest(idempotencyKey, messageId);
    if (!completed) throw new Error("Outbound request completion was not recorded");
    return json({ sent: true, providerMessageId: messageId, idempotencyKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send WhatsApp message";
    console.error(message);
    return json(
      {
        error: message.startsWith("Missing required")
          ? "WhatsApp integration is not configured"
          : "Unable to send WhatsApp message",
      },
      500,
    );
  }
});
