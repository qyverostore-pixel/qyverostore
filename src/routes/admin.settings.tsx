import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/admin/AdminPages";
export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });
