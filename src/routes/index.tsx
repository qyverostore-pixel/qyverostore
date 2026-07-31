import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home/HomeSections";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () =>
    seoHead({
      title: "Luxury Men's Lifestyle",
      description:
        "Discover QYVERO: luxury men's lifestyle essentials, refined accessories, and modern everyday distinction.",
      path: "/",
    }),
});
