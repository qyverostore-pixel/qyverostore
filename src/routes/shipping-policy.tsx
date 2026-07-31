import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/shipping-policy")({ head: () => seoHead({ title: "Shipping Policy", description: "QYVERO delivery preparation and shipping information.", path: "/shipping-policy" }), component: () => <LegalPage type="shipping" /> });
