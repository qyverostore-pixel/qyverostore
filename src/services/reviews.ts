import { supabase } from "@/lib/supabase";

export type ProductReview = {
  id: string;
  product_id: string;
  customer_id: string;
  customer_name: string;
  rating: number;
  review: string;
  created_at: string;
  product?: { id: string; name: string; slug: string } | null;
};

export type ReviewInput = {
  productId: string;
  rating: number;
  review: string;
  customerName: string;
};

const fail = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  fail(error);
  if (!data.user) throw new Error("Please sign in to write a review.");
  return data.user.id;
}

function validate(input: Pick<ReviewInput, "rating" | "review">) {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)
    throw new Error("Please choose a rating between 1 and 5.");
  if (!input.review.trim()) throw new Error("Please write a review.");
  if (input.review.trim().length > 2000)
    throw new Error("Reviews must be 2,000 characters or fewer.");
}

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("id,product_id,customer_id,customer_name,rating,review,created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  fail(error);
  return (data ?? []) as ProductReview[];
}

export async function getAllReviews(): Promise<ProductReview[]> {
  const { data, error } = await supabase
    .from("product_reviews")
    .select(
      "id,product_id,customer_id,customer_name,rating,review,created_at,product:products(id,name,slug)",
    )
    .order("created_at", { ascending: false });
  fail(error);
  return (data ?? []).map((review) => ({
    ...review,
    product: Array.isArray(review.product) ? (review.product[0] ?? null) : review.product,
  })) as ProductReview[];
}

export async function hasPurchasedProduct(productId: string): Promise<boolean> {
  const customerId = await currentUserId();
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id")
    .eq("customer_id", customerId)
    .neq("status", "cancelled");
  fail(ordersError);
  const ids = (orders ?? []).map((order) => order.id);
  if (!ids.length) return false;
  const { data, error } = await supabase
    .from("order_items")
    .select("id")
    .eq("product_id", productId)
    .in("order_id", ids)
    .limit(1);
  fail(error);
  return Boolean(data?.length);
}

export async function createReview(input: ReviewInput): Promise<ProductReview> {
  validate(input);
  const customerId = await currentUserId();
  const { data, error } = await supabase
    .from("product_reviews")
    .insert({
      product_id: input.productId,
      customer_id: customerId,
      customer_name: input.customerName.trim() || "Customer",
      rating: input.rating,
      review: input.review.trim(),
    })
    .select()
    .single();
  fail(error);
  return data as ProductReview;
}

export async function updateReview(
  id: string,
  input: Pick<ReviewInput, "rating" | "review">,
): Promise<ProductReview> {
  validate(input);
  const { data, error } = await supabase
    .from("product_reviews")
    .update({ rating: input.rating, review: input.review.trim() })
    .eq("id", id)
    .select()
    .single();
  fail(error);
  return data as ProductReview;
}

export async function deleteReview(id: string) {
  const { error } = await supabase.from("product_reviews").delete().eq("id", id);
  fail(error);
}
