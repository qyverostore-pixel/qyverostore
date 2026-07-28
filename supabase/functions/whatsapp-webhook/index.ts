const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
const appSecret = Deno.env.get("META_APP_SECRET");
const businessAccountId = Deno.env.get("WHATSAPP_BUSINESS_ACCOUNT_ID");

type JsonRecord = Record<string, unknown>;

function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing required Edge Function secret: ${name}`);
  return value;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : null;
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function validSignature(rawBody: ArrayBuffer, signature: string | null) {
  if (!signature?.startsWith("sha256=")) return false;
  const secret = required(appSecret, "META_APP_SECRET");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, rawBody));
  const expected = signature.slice("sha256=".length).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expected)) return false;
  const provided = new Uint8Array(
    expected.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)),
  );
  return timingSafeEqual(digest, provided);
}

function messageText(message: JsonRecord, type: string) {
  if (type === "text" && isRecord(message.text)) return stringValue(message.text.body);
  if (type === "interactive" && isRecord(message.interactive)) {
    const buttonReply = isRecord(message.interactive.button_reply)
      ? message.interactive.button_reply
      : null;
    const listReply = isRecord(message.interactive.list_reply)
      ? message.interactive.list_reply
      : null;
    return (
      (buttonReply && (stringValue(buttonReply.title) ?? stringValue(buttonReply.id))) ??
      (listReply && (stringValue(listReply.title) ?? stringValue(listReply.id)))
    );
  }
  return null;
}

async function recordMessage(input: {
  id: string;
  phone: string | null;
  direction: "inbound" | "outbound";
  type: string;
  text: string | null;
  status: string;
  statusEventAt: string | null;
  raw: JsonRecord;
}) {
  const url = required(supabaseUrl, "SUPABASE_URL");
  const key = required(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${url}/rest/v1/rpc/record_whatsapp_message`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      p_whatsapp_message_id: input.id,
      p_phone_number: input.phone,
      p_direction: input.direction,
      p_message_type: input.type,
      p_message_text: input.text,
      p_status: input.status,
      p_status_event_at: input.statusEventAt,
      p_raw_payload: input.raw,
    }),
  });
  if (!response.ok) throw new Error(`Database write failed (${response.status})`);
}

Deno.serve(async (request) => {
  if (request.method === "GET") {
    const url = new URL(request.url);
    if (
      url.searchParams.get("hub.mode") !== "subscribe" ||
      url.searchParams.get("hub.verify_token") !== verifyToken
    ) {
      return new Response(null, { status: 403 });
    }
    const challenge = url.searchParams.get("hub.challenge");
    return challenge === null
      ? new Response(null, { status: 403 })
      : new Response(challenge, {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
  }

  if (request.method !== "POST")
    return Response.json({ error: "Method not allowed" }, { status: 405 });

  try {
    const rawBody = await request.arrayBuffer();
    if (!(await validSignature(rawBody, request.headers.get("x-hub-signature-256")))) {
      return Response.json({ error: "Invalid signature" }, { status: 403 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(new TextDecoder().decode(rawBody));
    } catch {
      return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    if (!isRecord(payload) || payload.object !== "whatsapp_business_account") {
      return Response.json({ error: "Invalid WhatsApp webhook payload" }, { status: 400 });
    }

    const configuredBusinessAccountId = required(businessAccountId, "WHATSAPP_BUSINESS_ACCOUNT_ID");
    const entries = Array.isArray(payload.entry) ? payload.entry : [];
    const recordJobs: Promise<void>[] = [];
    for (const entry of entries) {
      if (
        !isRecord(entry) ||
        stringValue(entry.id) !== configuredBusinessAccountId ||
        !Array.isArray(entry.changes)
      )
        continue;
      for (const change of entry.changes) {
        if (!isRecord(change) || !isRecord(change.value)) continue;
        const value = change.value;
        const contacts = Array.isArray(value.contacts) ? value.contacts : [];
        const contact = contacts.find(isRecord);
        const contactPhone = contact && stringValue(contact.wa_id);
        const messages = Array.isArray(value.messages) ? value.messages : [];
        for (const item of messages) {
          if (!isRecord(item)) continue;
          const id = stringValue(item.id);
          if (!id) continue;
          const type = stringValue(item.type) ?? "unknown";
          recordJobs.push(
            recordMessage({
              id,
              phone: stringValue(item.from) ?? contactPhone ?? null,
              direction: "inbound",
              type,
              text: messageText(item, type),
              status: "received",
              statusEventAt: null,
              raw: item,
            }),
          );
        }
        const statuses = Array.isArray(value.statuses) ? value.statuses : [];
        for (const item of statuses) {
          if (!isRecord(item)) continue;
          const id = stringValue(item.id);
          if (!id) continue;
          const timestamp = stringValue(item.timestamp);
          const timestampSeconds = timestamp && /^\d+$/.test(timestamp) ? Number(timestamp) : NaN;
          const statusDate = Number.isSafeInteger(timestampSeconds)
            ? new Date(timestampSeconds * 1000)
            : null;
          const statusEventAt =
            statusDate && Number.isFinite(statusDate.getTime()) ? statusDate.toISOString() : null;
          recordJobs.push(
            recordMessage({
              id,
              phone: stringValue(item.recipient_id) ?? contactPhone ?? null,
              direction: "outbound",
              type: "unknown",
              text: null,
              status: stringValue(item.status) ?? "unknown",
              statusEventAt,
              raw: item,
            }),
          );
        }
      }
    }
    await Promise.all(recordJobs);
    return Response.json({ received: true });
  } catch (error) {
    console.error(error instanceof Error ? error.message : "WhatsApp webhook failed");
    return Response.json({ error: "Unable to process webhook" }, { status: 500 });
  }
});
