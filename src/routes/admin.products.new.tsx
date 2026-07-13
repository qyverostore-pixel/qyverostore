import { createFileRoute } from "@tanstack/react-router";
import { ProductFormPage } from "@/components/admin/ProductManagement";
export const Route = createFileRoute("/admin/products/new")({ component: ProductFormPage });
