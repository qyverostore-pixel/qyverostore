import { createFileRoute } from "@tanstack/react-router";
import { EmailSettingsPage } from "@/components/admin/EmailSettingsPage";
export const Route = createFileRoute("/admin/email-settings")({ component: EmailSettingsPage });
