import { createFileRoute } from "@tanstack/react-router";
import { CustomersPage } from "@/components/admin/AdminPages";
export const Route = createFileRoute("/admin/customers")({ component: CustomersPage });
