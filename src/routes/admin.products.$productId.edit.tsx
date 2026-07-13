import { createFileRoute } from "@tanstack/react-router";
import { ProductFormPage } from "@/components/admin/ProductManagement";
export const Route = createFileRoute("/admin/products/$productId/edit")({ component: ProductEditRoute });
function ProductEditRoute() { const { productId } = Route.useParams(); return <ProductFormPage productId={productId} />; }
