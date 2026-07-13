import { createFileRoute } from "@tanstack/react-router";
import { ProductsPage } from "@/components/products/ProductsPage";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
});
