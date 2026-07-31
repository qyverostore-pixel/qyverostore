import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/about/AboutPage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () =>
    seoHead({
      title: "About QYVERO",
      description:
        "Meet QYVERO, a modern men's lifestyle brand shaped by quality, utility, and understated style.",
      path: "/about",
    }),
});
