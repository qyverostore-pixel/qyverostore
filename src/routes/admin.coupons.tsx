import { createFileRoute } from "@tanstack/react-router";
import { CouponsManagement } from "@/components/admin/CouponsManagement";
export const Route = createFileRoute("/admin/coupons")({ component: CouponsManagement });
