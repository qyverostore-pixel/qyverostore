import { createFileRoute } from "@tanstack/react-router";
import { OrderSuccessPage } from "@/components/orders/OrderSuccessPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/order-success")({
  head: () =>
    seoHead({
      title: "Order Confirmed",
      description: "Your QYVERO order confirmation.",
      path: "/order-success",
      robots: "noindex,nofollow",
    }),
  validateSearch: (search: Record<string, unknown>) => ({
    orderId: typeof search.orderId === "string" ? search.orderId : undefined,
  }),
  component: OrderSuccessRoute,
});

function OrderSuccessRoute() {
  const { orderId } = Route.useSearch();
  return <OrderSuccessPage orderId={orderId} />;
}
