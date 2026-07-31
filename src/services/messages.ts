import { supabase } from "@/lib/supabase";

export type MessageStatus = "new" | "read";

export type ContactMessage = {
  id: string;
  full_name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  created_at: string;
};

export type ContactMessageInput = Omit<ContactMessage, "id" | "status" | "created_at">;

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

export async function createMessage(input: ContactMessageInput) {
  const { error } = await supabase.from("messages").insert({ ...input, status: "new" });

  fail(error);
}

export async function getMessages() {
  const { data, error } = await supabase
    .from("messages")
    .select("id,full_name,email,subject,message,status,created_at")
    .order("created_at", { ascending: false });

  fail(error);

  return (data ?? []) as ContactMessage[];
}

export async function markMessageRead(id: string) {
  const { error } = await supabase.from("messages").update({ status: "read" }).eq("id", id);

  fail(error);
}

export async function deleteMessage(id: string) {
  const { error } = await supabase.from("messages").delete().eq("id", id);

  fail(error);
}
