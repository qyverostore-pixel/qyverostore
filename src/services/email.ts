import { supabase } from "@/lib/supabase";

export type EmailSettings = {
  sender_name: string;
  sender_email: string;
  reply_to: string;
};

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export async function subscribeNewsletter(email: string) {
  const { error } = await supabase.rpc("subscribe_newsletter", {
    p_email: email,
  });

  fail(error);
}

export async function getEmailSettings(): Promise<EmailSettings> {
  const { data, error } = await supabase
    .from("email_settings")
    .select("sender_name,sender_email,reply_to")
    .eq("id", true)
    .maybeSingle();

  fail(error);

  return {
    sender_name: data?.sender_name ?? "QYVERO",
    sender_email: data?.sender_email ?? "",
    reply_to: data?.reply_to ?? "",
  };
}

export async function saveEmailSettings(settings: EmailSettings) {
  const { error } = await supabase
    .from("email_settings")
    .update({
      sender_name: settings.sender_name,
      sender_email: settings.sender_email || null,
      reply_to: settings.reply_to || null,
    })
    .eq("id", true);

  fail(error);
}

export async function sendTestEmail(recipient: string) {
  const { error } = await supabase.functions.invoke("send-email", {
    body: { type: "test", recipient },
  });

  fail(error);
}

export async function getSubscribers() {
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("email,subscribed_at,is_active")
    .order("subscribed_at", { ascending: false });

  fail(error);

  return data ?? [];
}
