import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/return-policy")({
  head: () =>
    seoHead({
      title: "Return & Refund Policy",
      description: "QYVERO return and refund guidance.",
      path: "/return-policy",
    }),
  component: () => <LegalPage type="returns" />,
});
