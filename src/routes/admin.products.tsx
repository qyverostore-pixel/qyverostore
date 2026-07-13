import { createFileRoute } from "@tanstack/react-router";
import { ProductsPage } from "@/components/admin/ProductManagement";
export const Route = createFileRoute("/admin/products")({ component: ProductsPage });
