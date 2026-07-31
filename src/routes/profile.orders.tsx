import { createFileRoute, redirect } from "@tanstack/react-router";
import { MyOrdersPage } from "@/components/orders/MyOrdersPage";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/profile/orders")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth/signin" });
  },
  component: MyOrdersPage,
});
