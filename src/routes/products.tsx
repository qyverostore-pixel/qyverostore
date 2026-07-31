import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/products")({
  component: ProductsRoute,
});

function ProductsRoute() {
  return <Outlet />;
}
