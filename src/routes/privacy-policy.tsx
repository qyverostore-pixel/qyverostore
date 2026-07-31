import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/privacy-policy")({
  head: () =>
    seoHead({
      title: "Privacy Policy",
      description: "How QYVERO collects, uses, and protects your information.",
      path: "/privacy-policy",
    }),
  component: () => <LegalPage type="privacy" />,
});
