import { createFileRoute } from "@tanstack/react-router";
import { MessagesPage } from "@/components/admin/AdminPages";
export const Route = createFileRoute("/admin/messages")({ component: MessagesPage });
