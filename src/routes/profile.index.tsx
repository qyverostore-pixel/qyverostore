import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/profile/ProfilePage";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/profile/")({
  head: () => seoHead({ title: "Your Profile", description: "Manage your QYVERO profile.", path: "/profile", robots: "noindex,nofollow" }),
  component: ProfilePage,
});
