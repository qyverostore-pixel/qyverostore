import { createFileRoute } from "@tanstack/react-router";
import { ProductsPage } from "@/components/products/ProductsPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/products/")({
  component: ProductsPage,
  head: () => seoHead({ title: "Shop the Collection", description: "Shop QYVERO's curated collection of modern men's lifestyle essentials and accessories.", path: "/products" }),
});
