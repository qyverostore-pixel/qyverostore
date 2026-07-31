import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/admin")({ head: () => seoHead({ title: "Store Administration", description: "QYVERO store administration.", path: "/admin", robots: "noindex,nofollow" }), component: AdminRoute });

function AdminRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname === "/admin" ? <AnalyticsDashboard /> : <Outlet />;
}
