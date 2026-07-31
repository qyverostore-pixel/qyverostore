import { createFileRoute } from "@tanstack/react-router";
import { ContactPage } from "@/components/contact/ContactPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => seoHead({ title: "Contact QYVERO", description: "Contact QYVERO for product, order, and customer support enquiries.", path: "/contact" }),
});
