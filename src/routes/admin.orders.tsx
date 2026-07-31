import { createFileRoute } from "@tanstack/react-router";
import { OrdersManagement } from "@/components/admin/OrdersManagement";
export const Route = createFileRoute("/admin/orders")({ component: OrdersManagement });
