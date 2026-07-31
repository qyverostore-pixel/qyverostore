const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = Deno.env.get("RESEND_API_KEY");

type EmailSettings = {
  sender_name: string;
  sender_email: string | null;
  reply_to: string | null;
};

type SendEmailRequest = {
  type?: string;
  recipient?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing required Edge Function secret: ${name}`);
  return value;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function testEmailHtml() {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body style="margin:0;background:#0d0f13;color:#f7f7f7;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:620px;background:#15181e;border:1px solid #2a3039;border-radius:18px" cellpadding="0" cellspacing="0"><tr><td style="padding:32px"><p style="color:#22c7b8;letter-spacing:3px;font-size:12px;font-weight:bold">QYVERO</p><h1 style="font-weight:500;font-size:28px">QYVERO email settings test</h1><p>Your Resend email integration is working correctly.</p><p style="margin-top:32px;color:#a5adb8;font-size:12px">Modern essentials, crafted with intent.</p></td></tr></table></td></tr></table></body></html>`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
  }

  try {
    const url = required(supabaseUrl, "SUPABASE_URL");
    const key = required(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
    const resend = required(resendApiKey, "RESEND_API_KEY");
    const authorization = request.headers.get("Authorization");

    if (!authorization) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const adminResponse = await fetch(`${url}/rest/v1/rpc/is_admin`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: "{}",
    });

    if (!adminResponse.ok || !(await adminResponse.json())) {
      return Response.json(
        { error: "Admin access required" },
        { status: 403, headers: corsHeaders },
      );
    }

    const { type, recipient } = (await request.json()) as SendEmailRequest;
    const normalizedRecipient = recipient?.trim().toLowerCase();

    if (!normalizedRecipient || !isValidEmail(normalizedRecipient)) {
      return Response.json(
        { error: "A valid recipient email is required" },
        { status: 400, headers: corsHeaders },
      );
    }

    const settingsResponse = await fetch(
      `${url}/rest/v1/email_settings?select=sender_name,sender_email,reply_to&id=eq.true`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );

    if (!settingsResponse.ok) {
      throw new Error(`Unable to load email settings: ${await settingsResponse.text()}`);
    }

    const [settings] = (await settingsResponse.json()) as EmailSettings[];
    const sender = settings?.sender_email
      ? `${settings.sender_name || "QYVERO"} <${settings.sender_email}>`
      : "QYVERO <onboarding@resend.dev>";

    switch (type) {
      case "test": {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resend}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: sender,
            to: [normalizedRecipient],
            reply_to: settings?.reply_to || undefined,
            subject: "QYVERO email settings test",
            html: testEmailHtml(),
          }),
        });

        if (!resendResponse.ok) {
          throw new Error(
            `Resend request failed: ${resendResponse.status} ${await resendResponse.text()}`,
          );
        }

        return Response.json(
          { sent: true, id: (await resendResponse.json()).id },
          { headers: corsHeaders },
        );
      }
      case "order_confirmation":
      case "order_shipped":
      case "newsletter":
      case "contact":
        return Response.json(
          { error: `Email type \"${type}\" is not implemented` },
          { status: 501, headers: corsHeaders },
        );
      default:
        return Response.json(
          { error: "Unsupported email type" },
          { status: 400, headers: corsHeaders },
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send email";
    console.error(message);
    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
