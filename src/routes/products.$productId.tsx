import { createFileRoute } from "@tanstack/react-router";
import { ProductDetailsPage } from "@/components/products/ProductDetailsPage";

export const Route = createFileRoute("/products/$productId")({
  component: ProductRoute,
});

function ProductRoute() {
  const { productId } = Route.useParams();
  return <ProductDetailsPage productId={productId} />;
}
