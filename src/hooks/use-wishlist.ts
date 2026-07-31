import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addToWishlist, getWishlist, removeFromWishlist, type WishlistItem, type WishlistRecord } from "@/services/wishlist";
import type { StoreProduct } from "@/services/products";

export const wishlistKeys = { all: ["wishlist"] as const };
type WishlistMutationResult = { action: "added" } | { action: "removed"; record: WishlistRecord };
type WishlistAction = "add" | "remove";
type WishlistMutationVariables = { action: WishlistAction; product: StoreProduct };
type WishlistMutationContext = { previous: WishlistItem[] | undefined };

export const useWishlist = (enabled = true) => useQuery({
  queryKey: wishlistKeys.all,
  queryFn: getWishlist,
  enabled,
  staleTime: 0,
  gcTime: 5 * 60 * 1000,
  refetchOnMount: true,
  refetchOnWindowFocus: false,
});

export function useWishlistToggle(product: StoreProduct) {
  const queryClient = useQueryClient();
  const mutation = useMutation<WishlistMutationResult, Error, WishlistMutationVariables, WishlistMutationContext>({
    mutationFn: async ({ action, product: selectedProduct }) => {
      if (action === "remove") return { action: "removed", record: await removeFromWishlist(selectedProduct.id) };
      await addToWishlist(selectedProduct.id);
      return { action: "added" };
    },
    onMutate: async ({ action, product: selectedProduct }) => {
      await queryClient.cancelQueries({ queryKey: wishlistKeys.all });
      const previous = queryClient.getQueryData<WishlistItem[]>(wishlistKeys.all);
      queryClient.setQueryData<WishlistItem[]>(wishlistKeys.all, (current = []) => action === "remove"
        ? current.filter((item) => item.product_id !== selectedProduct.id)
        : [{ id: `pending-${selectedProduct.id}`, customer_id: "", product_id: selectedProduct.id, created_at: new Date().toISOString(), product: selectedProduct }, ...current]);
      return { previous };
    },
    onError: (_error, _variables, context) => queryClient.setQueryData(wishlistKeys.all, context?.previous),
    onSuccess: (result) => {
      if (result.action === "removed") {
        queryClient.setQueryData<WishlistItem[]>(wishlistKeys.all, (current = []) => current.filter((item) => item.product_id !== result.record.product_id));
      }
      return queryClient.invalidateQueries({ queryKey: wishlistKeys.all, refetchType: "none" });
    },
  });
  const toggle = useCallback(() => {
    const current = queryClient.getQueryData<WishlistItem[]>(wishlistKeys.all) ?? [];
    const action: WishlistAction = current.some((item) => item.product_id === product.id) ? "remove" : "add";
    mutation.mutate({ action, product });
  }, [mutation, product, queryClient]);
  return { ...mutation, toggle };
}
