import { createFileRoute } from "@tanstack/react-router";
import { ProductDetailsPage } from "@/components/products/ProductDetailsPage";
import { getProduct } from "@/services/products";
import { productSchema, seoHead } from "@/lib/seo";

export const Route = createFileRoute("/products/$productId")({
  loader: ({ params }) => getProduct(params.productId),
  head: ({ loaderData }) =>
    loaderData
      ? seoHead({
          title: loaderData.meta_title || loaderData.name_en || loaderData.name,
          description:
            loaderData.meta_description ||
            loaderData.description_en ||
            loaderData.short_description ||
            `${loaderData.name_en || loaderData.name} by QYVERO.`,
          path: `/products/${loaderData.slug}`,
          image: loaderData.images[0]?.image_url,
          keywords: `${loaderData.name_en || loaderData.name}, ${loaderData.category?.name_en || loaderData.category?.name || "men's lifestyle"}, ${loaderData.brand || "QYVERO"}`,
          type: "product",
          structuredData: productSchema(loaderData),
        })
      : seoHead({ title: "Product", description: "Explore QYVERO products.", path: "/products", robots: "noindex,follow" }),
  component: ProductRoute,
});

function ProductRoute() {
  const { productId } = Route.useParams();
  return <ProductDetailsPage productId={productId} />;
}
