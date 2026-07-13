import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/components/admin/AdminPages";
export const Route = createFileRoute("/admin/orders")({ component: OrdersPage });
