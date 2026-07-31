import { createFileRoute, Outlet } from "@tanstack/react-router";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/profile")({
  component: Outlet,
  head: () => seoHead({ title: "Your Profile", description: "Manage your QYVERO profile and orders.", path: "/profile", robots: "noindex,nofollow" }),
});
