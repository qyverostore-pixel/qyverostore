import { Star } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useHasPurchasedProduct, useProductReviews, useReviewMutations } from "@/hooks/use-reviews";
import { useAuth } from "@/providers/AuthProvider";
import type { ProductReview } from "@/services/reviews";

function Stars({
  rating,
  interactive = false,
  onChange,
}: {
  rating: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  return (
    <div className="flex gap-1 text-amber-300" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) =>
        interactive ? (
          <button
            key={index}
            type="button"
            aria-label={`Rate ${index + 1} stars`}
            onClick={() => onChange?.(index + 1)}
            className="transition hover:scale-110"
          >
            <Star className={cn("h-5 w-5", index < rating && "fill-current")} />
          </button>
        ) : (
          <Star key={index} className={cn("h-4 w-4", index < rating && "fill-current")} />
        ),
      )}
    </div>
  );
}
function ReviewForm({
  existing,
  customerName,
  onCancel,
  onSubmit,
  pending,
}: {
  existing?: ProductReview;
  customerName: string;
  onCancel?: () => void;
  onSubmit: (rating: number, review: string) => void;
  pending: boolean;
}) {
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [review, setReview] = useState(existing?.review ?? "");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(rating, review);
  };
  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            {existing ? "Edit your review" : "Write a Review"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Posting as {customerName}</p>
        </div>
        <Stars rating={rating} interactive onChange={setRating} />
      </div>
      <Textarea
        value={review}
        onChange={(event) => setReview(event.target.value)}
        maxLength={2000}
        required
        placeholder="Share your experience with this product"
        className="mt-4 min-h-28 border-white/15 bg-black/15"
      />
      <div className="mt-4 flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save review"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function ReviewsSection({ productId }: { productId: string }) {
  const { user, profile } = useAuth();
  const { data: reviews = [], isLoading } = useProductReviews(productId);
  const { data: purchased = false } = useHasPurchasedProduct(productId, user?.id);
  const { create, update, remove } = useReviewMutations(productId);
  const [writing, setWriting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const customerName = profile?.full_name?.trim() || user?.email?.split("@")[0] || "Customer";
  const ownReview = reviews.find((review) => review.customer_id === user?.id);
  const save = (rating: number, review: string) => {
    if (ownReview)
      update.mutate(
        { id: ownReview.id, input: { rating, review } },
        {
          onSuccess: () => {
            setEditingId(null);
            toast.success("Review updated");
          },
          onError: (error) =>
            toast.error("Unable to update review", { description: error.message }),
        },
      );
    else
      create.mutate(
        { productId, rating, review, customerName },
        {
          onSuccess: () => {
            setWriting(false);
            toast.success("Review published");
          },
          onError: (error) =>
            toast.error("Unable to publish review", { description: error.message }),
        },
      );
  };
  const deleteOwn = (id: string) =>
    remove.mutate(id, {
      onSuccess: () => toast.success("Review deleted"),
      onError: (error) => toast.error("Unable to delete review", { description: error.message }),
    });
  return (
    <section className="py-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-display text-2xl font-medium text-foreground">Reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">Feedback from verified customers.</p>
        </div>
        {purchased && !ownReview && !writing && (
          <Button type="button" variant="outline" onClick={() => setWriting(true)}>
            Write a Review
          </Button>
        )}
      </div>
      {writing && (
        <div className="mt-6">
          <ReviewForm
            customerName={customerName}
            onCancel={() => setWriting(false)}
            onSubmit={save}
            pending={create.isPending}
          />
        </div>
      )}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reviews yet. Verified customers can be the first to share their experience.
          </p>
        ) : (
          reviews.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
            >
              {editingId === item.id ? (
                <ReviewForm
                  existing={item}
                  customerName={customerName}
                  onCancel={() => setEditingId(null)}
                  onSubmit={save}
                  pending={update.isPending}
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Stars rating={item.rating} />
                      <p className="mt-3 text-sm font-medium text-foreground">
                        {item.customer_name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    {item.customer_id === user?.id && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(item.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={remove.isPending}
                          onClick={() => deleteOwn(item.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground/80">
                    {item.review}
                  </p>
                </>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
