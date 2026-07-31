import { createFileRoute } from "@tanstack/react-router";
import { ConnectPage } from "@/components/connect/ConnectPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/connect")({
  component: ConnectPage,
  head: () =>
    seoHead({
      title: "Connect with QYVERO",
      description: "Connect with QYVERO through our official website and social channels.",
      path: "/connect",
    }),
});
