import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/admin/AdminPages";
export const Route = createFileRoute("/admin")({ component: DashboardPage });
