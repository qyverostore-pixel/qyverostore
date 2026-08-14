import { createFileRoute } from "@tanstack/react-router";
import { ProductsPage } from "@/components/products/ProductsPage";
import { breadcrumbSchema, seoHead } from "@/lib/seo";
import { getCategories } from "@/services/products";

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): { category?: string } =>
    typeof search.category === "string" ? { category: search.category } : {},
  loaderDeps: ({ search }) => ({ category: search.category }),
  loader: async ({ deps }) => {
    if (!deps.category) return null;
    return (await getCategories()).find((category) => category.slug === deps.category) ?? null;
  },
  component: ProductsPage,
  head: ({ loaderData }) => {
    const categoryName = loaderData?.name_en || loaderData?.name;
    const path = loaderData ? `/products?category=${encodeURIComponent(loaderData.slug)}` : "/products";
    return seoHead({
      title: categoryName ? `${categoryName} Collection` : "Shop the Collection",
      description: categoryName ? `Shop QYVERO ${categoryName} essentials and accessories.` : "Shop QYVERO's curated collection of modern men's lifestyle essentials and accessories.",
      path,
      structuredData: breadcrumbSchema([{ name: "Home", path: "/" }, { name: categoryName || "Products", path }]),
    });
  },
});
