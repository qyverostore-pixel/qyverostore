import { createFileRoute } from "@tanstack/react-router";
import { PoliciesPage } from "@/components/legal/PoliciesPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/policies")({
  head: () => seoHead({ title: "Policies", description: "QYVERO privacy, terms, returns, and shipping policies.", path: "/policies" }),
  component: PoliciesPage,
});
