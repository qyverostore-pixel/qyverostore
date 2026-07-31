import { createFileRoute } from "@tanstack/react-router";
import { MessagesManagement } from "@/components/admin/MessagesManagement";
export const Route = createFileRoute("/admin/messages")({ component: MessagesManagement });
