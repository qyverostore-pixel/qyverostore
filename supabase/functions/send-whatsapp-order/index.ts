const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const automationSecret = Deno.env.get("ORDER_AUTOMATION_SECRET");
const whatsappAccessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const whatsappPhoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const whatsappTemplateName = Deno.env.get("WHATSAPP_ORDER_TEMPLATE_NAME");
const whatsappTemplateLanguage = Deno.env.get("WHATSAPP_TEMPLATE_LANGUAGE") ?? "en";
const whatsappGraphApiVersion = Deno.env.get("WHATSAPP_GRAPH_API_VERSION");

type OrderRecord = {
  order_number: string;
  phone: string | null;
  payment_method: "cash_on_delivery" | "vodafone_cash" | "instapay";
  total_amount: number | string;
};

type StoreSettings = {
  vodafone_cash_number: string | null;
  instapay_account: string | null;
  cod_deposit_percentage: number | string | null;
};

const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: { "Content-Type": "application/json" } });

function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing required Edge Function secret: ${name}`);
  return value;
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function money(value: number) {
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} EGP`;
}

function normalizeEgyptPhone(phone: string | null) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (/^01\d{9}$/.test(digits)) return `2${digits}`;
  if (/^201\d{9}$/.test(digits)) return digits;
  throw new Error("The order does not have a valid Egyptian customer phone number");
}

function createPaymentMessage(order: OrderRecord, settings: StoreSettings) {
  const total = toNumber(order.total_amount);
  const depositPercentage = toNumber(settings.cod_deposit_percentage) || 20;

  if (order.payment_method === "cash_on_delivery") {
    const deposit = Math.round(total * depositPercentage) / 100;
    const remaining = Math.round((total - deposit) * 100) / 100;
    return [
      "QYVERO Order Confirmation",
      "",
      `Order: #${order.order_number}`,
      `Total: ${money(total)}`,
      "",
      "Payment method: Cash on Delivery",
      "",
      `Required deposit: ${money(deposit)}`,
      `Remaining on delivery: ${money(remaining)}`,
      "",
      "Please send the deposit confirmation here to confirm the order.",
    ].join("\n");
  }

  const isVodafoneCash = order.payment_method === "vodafone_cash";
  const account = isVodafoneCash
    ? settings.vodafone_cash_number || "COMING_SOON"
    : settings.instapay_account || "COMING_SOON";
  const method = isVodafoneCash ? "Vodafone Cash" : "InstaPay";
  return [
    "QYVERO Order Payment",
    "",
    `Order: #${order.order_number}`,
    `Total: ${money(total)}`,
    "",
    `Payment method: ${method}`,
    "",
    `Please transfer ${money(total)} to:`,
    account,
    "",
    "After completing the transfer, send the payment screenshot here.",
  ].join("\n");
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    if (request.headers.get("x-order-automation-secret") !== required(automationSecret, "ORDER_AUTOMATION_SECRET")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const payload = await request.json() as {
      orderNumber?: unknown;
      record?: { order_number?: unknown };
    };
    const orderNumber = typeof payload.orderNumber === "string"
      ? payload.orderNumber
      : payload.record?.order_number;
    if (typeof orderNumber !== "string" || !orderNumber.trim()) {
      return json({ error: "orderNumber is required" }, 400);
    }

    const url = required(supabaseUrl, "SUPABASE_URL");
    const key = required(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
    const orderResponse = await fetch(
      `${url}/rest/v1/orders?select=order_number,phone,payment_method,total_amount&order_number=eq.${encodeURIComponent(orderNumber.trim().toUpperCase())}&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!orderResponse.ok) throw new Error(`Unable to load order: ${await orderResponse.text()}`);
    const [order] = (await orderResponse.json()) as OrderRecord[];
    if (!order) return json({ error: "Order not found" }, 404);

    const settingsResponse = await fetch(
      `${url}/rest/v1/store_settings?select=vodafone_cash_number,instapay_account,cod_deposit_percentage&id=eq.true`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!settingsResponse.ok) throw new Error(`Unable to load payment settings: ${await settingsResponse.text()}`);
    const [settings] = (await settingsResponse.json()) as StoreSettings[];
    const paymentSettings: StoreSettings = settings ?? {
      vodafone_cash_number: "COMING_SOON",
      instapay_account: "COMING_SOON",
      cod_deposit_percentage: 20,
    };
    const message = createPaymentMessage(order, paymentSettings);
    const recipient = normalizeEgyptPhone(order.phone);

    const token = required(whatsappAccessToken, "WHATSAPP_ACCESS_TOKEN");
    const phoneNumberId = required(whatsappPhoneNumberId, "WHATSAPP_PHONE_NUMBER_ID");
    const templateName = required(whatsappTemplateName, "WHATSAPP_ORDER_TEMPLATE_NAME");
    const graphApiVersion = required(whatsappGraphApiVersion, "WHATSAPP_GRAPH_API_VERSION");
    const providerResponse = await fetch(
      `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipient,
          type: "template",
          template: {
            name: templateName,
            language: { code: whatsappTemplateLanguage },
            components: [{ type: "body", parameters: [{ type: "text", text: message }] }],
          },
        }),
      },
    );
    if (!providerResponse.ok) {
      throw new Error(`WhatsApp Cloud API request failed: ${providerResponse.status} ${await providerResponse.text()}`);
    }

    const providerResult = await providerResponse.json();
    return json({ sent: true, providerMessageId: providerResult.messages?.[0]?.id ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send WhatsApp order message";
    console.error(message);
    const configurationError = message.startsWith("Missing required Edge Function secret:");
    return json({ error: message }, configurationError ? 503 : 500);
  }
});
