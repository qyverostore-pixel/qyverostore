import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/AdminTable";
import { deleteMessage, getMessages, markMessageRead } from "@/services/messages";

const messageKey = ["messages"] as const;

export function MessagesManagement() {
  const queryClient = useQueryClient(); const { data: messages = [] } = useQuery({ queryKey: messageKey, queryFn: getMessages });
  const refresh = () => queryClient.invalidateQueries({ queryKey: messageKey });
  const markRead = async (id: string) => { try { await markMessageRead(id); await refresh(); toast.success("Message marked as read"); } catch (error) { toast.error("Unable to update message", { description: error instanceof Error ? error.message : "Please try again." }); } };
  const remove = async (id: string) => { try { await deleteMessage(id); await refresh(); toast.success("Message deleted"); } catch (error) { toast.error("Unable to delete message", { description: error instanceof Error ? error.message : "Please try again." }); } };
  return <AdminLayout title="Messages" description="Contact form submissions from your store"><div className="space-y-3">{messages.map((message) => <article key={message.id} className="rounded-xl border border-white/10 bg-white/[0.025] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-medium">{message.subject}</h2><StatusBadge tone={message.status === "new" ? "info" : "neutral"}>{message.status === "new" ? "New" : "Read"}</StatusBadge></div><p className="mt-1 text-sm text-muted-foreground">{message.full_name} · {message.email}</p></div><p className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleDateString()}</p></div><p className="mt-4 text-sm text-white/80">{message.message}</p><div className="mt-4 flex gap-2">{message.status === "new" && <Button size="sm" variant="outline" onClick={() => void markRead(message.id)}>Mark as read</Button>}<Button size="sm" variant="ghost" onClick={() => void remove(message.id)}>Delete</Button></div></article>)}</div></AdminLayout>;
}
