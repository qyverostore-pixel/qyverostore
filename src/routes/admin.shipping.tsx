import { createFileRoute } from "@tanstack/react-router";
import { ShippingManagement } from "@/components/admin/ShippingManagement";

export const Route = createFileRoute("/admin/shipping")({ component: ShippingManagement });
