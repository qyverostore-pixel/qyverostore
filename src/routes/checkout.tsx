import { createFileRoute } from "@tanstack/react-router";
import { CheckoutPage } from "@/components/checkout/CheckoutPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/checkout")({
  head: () => seoHead({ title: "Checkout", description: "Complete your QYVERO order.", path: "/checkout", robots: "noindex,nofollow" }),
  component: CheckoutPage,
});
