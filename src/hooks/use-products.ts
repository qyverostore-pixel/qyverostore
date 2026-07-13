import { useQuery } from "@tanstack/react-query";
import { getCategories, getFeaturedProducts, getProduct, getProducts, getRelatedProducts, type StoreProduct } from "@/services/products";

export const productKeys = { all: ["products"] as const, list: (admin = false) => ["products", "list", admin] as const, detail: (id: string, admin = false) => ["products", "detail", id, admin] as const, categories: ["categories"] as const, featured: ["products", "featured"] as const };
export const useProducts = (admin = false) => useQuery({ queryKey: productKeys.list(admin), queryFn: () => getProducts(admin) });
export const useCategories = () => useQuery({ queryKey: productKeys.categories, queryFn: getCategories });
export const useProduct = (id: string, admin = false) => useQuery({ queryKey: productKeys.detail(id, admin), queryFn: () => getProduct(id, admin) });
export const useFeaturedProducts = () => useQuery({ queryKey: productKeys.featured, queryFn: getFeaturedProducts });
export const useRelatedProducts = (product: StoreProduct | null) => useQuery({ queryKey: ["products", "related", product?.id], queryFn: () => getRelatedProducts(product!), enabled: Boolean(product) });
