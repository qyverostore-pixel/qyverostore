import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
import { seoHead } from "@/lib/seo";
export const Route = createFileRoute("/terms-and-conditions")({
  head: () =>
    seoHead({
      title: "Terms & Conditions",
      description: "Terms that apply to use of the QYVERO store.",
      path: "/terms-and-conditions",
    }),
  component: () => <LegalPage type="terms" />,
});
