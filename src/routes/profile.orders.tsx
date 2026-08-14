import { createFileRoute, redirect } from "@tanstack/react-router";
import { MyOrdersPage } from "@/components/orders/MyOrdersPage";
import { supabase } from "@/lib/supabase";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/profile/orders")({
  head: () => seoHead({ title: "Your Orders", description: "View your QYVERO orders.", path: "/profile/orders", robots: "noindex,nofollow" }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth/signin" });
  },
  component: MyOrdersPage,
});
