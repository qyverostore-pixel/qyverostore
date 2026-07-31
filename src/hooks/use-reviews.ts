import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReview,
  deleteReview,
  getProductReviews,
  hasPurchasedProduct,
  updateReview,
  type ProductReview,
  type ReviewInput,
} from "@/services/reviews";

export const reviewKeys = {
  all: ["reviews"] as const,
  product: (productId: string) => ["reviews", "product", productId] as const,
  purchased: (productId: string, userId?: string) =>
    ["reviews", "purchased", productId, userId] as const,
};
export const useProductReviews = (productId: string) =>
  useQuery({
    queryKey: reviewKeys.product(productId),
    queryFn: () => getProductReviews(productId),
    enabled: Boolean(productId),
  });
export const useHasPurchasedProduct = (productId: string, userId?: string) =>
  useQuery({
    queryKey: reviewKeys.purchased(productId, userId),
    queryFn: () => hasPurchasedProduct(productId),
    enabled: Boolean(productId && userId),
  });

export function useReviewMutations(productId: string) {
  const client = useQueryClient();
  const queryKey = reviewKeys.product(productId);
  const invalidate = () => client.invalidateQueries({ queryKey: reviewKeys.all });
  const create = useMutation({
    mutationFn: createReview,
    onMutate: async (input) => {
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData<ProductReview[]>(queryKey);
      const optimistic: ProductReview = {
        id: `pending-${crypto.randomUUID()}`,
        product_id: input.productId,
        customer_id: "",
        customer_name: input.customerName,
        rating: input.rating,
        review: input.review.trim(),
        created_at: new Date().toISOString(),
      };
      client.setQueryData<ProductReview[]>(queryKey, (old = []) => [optimistic, ...old]);
      return { previous };
    },
    onError: (_error, _input, context) => client.setQueryData(queryKey, context?.previous),
    onSettled: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Pick<ReviewInput, "rating" | "review"> }) =>
      updateReview(id, input),
    onMutate: async ({ id, input }) => {
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData<ProductReview[]>(queryKey);
      client.setQueryData<ProductReview[]>(queryKey, (old = []) =>
        old.map((review) =>
          review.id === id
            ? { ...review, rating: input.rating, review: input.review.trim() }
            : review,
        ),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => client.setQueryData(queryKey, context?.previous),
    onSettled: invalidate,
  });
  const remove = useMutation({
    mutationFn: deleteReview,
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey });
      const previous = client.getQueryData<ProductReview[]>(queryKey);
      client.setQueryData<ProductReview[]>(queryKey, (old = []) =>
        old.filter((review) => review.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) => client.setQueryData(queryKey, context?.previous),
    onSettled: invalidate,
  });
  return { create, update, remove };
}
