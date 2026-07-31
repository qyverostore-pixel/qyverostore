import { Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteReview, getAllReviews } from "@/services/reviews";

export function ReviewsManagement() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("all");
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", "admin"],
    queryFn: getAllReviews,
  });
  const remove = useMutation({
    mutationFn: deleteReview,
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: ["reviews"] });
      const previous = client.getQueryData<typeof reviews>(["reviews", "admin"]);
      client.setQueryData<typeof reviews>(["reviews", "admin"], (old = []) =>
        old.filter((review) => review.id !== id),
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      client.setQueryData(["reviews", "admin"], context?.previous);
      toast.error("Unable to delete review", { description: error.message });
    },
    onSuccess: () => toast.success("Review deleted"),
    onSettled: () => client.invalidateQueries({ queryKey: ["reviews"] }),
  });
  const filtered = useMemo(
    () =>
      reviews.filter(
        (review) =>
          (rating === "all" || review.rating === Number(rating)) &&
          `${review.customer_name} ${review.product?.name ?? ""} ${review.review}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [rating, reviews, search],
  );
  return (
    <AdminLayout title="Reviews" description="Moderate customer product feedback">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer, product, or review"
            className="border-white/10 bg-white/[0.025] pl-9"
          />
        </div>
        <Select value={rating} onValueChange={setRating}>
          <SelectTrigger className="w-full border-white/10 bg-white/[0.025] sm:w-44">
            <SelectValue placeholder="All ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value} star{value !== 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading reviews…</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-white/10 p-5 text-sm text-muted-foreground">
            No reviews match these filters.
          </p>
        ) : (
          filtered.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-white/10 bg-white/[0.025] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1 text-amber-300">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={`size-4 ${index < review.rating ? "fill-current" : ""}`}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-medium">
                    {review.customer_name}{" "}
                    <span className="font-normal text-muted-foreground">
                      reviewed {review.product?.name ?? "Deleted product"}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Delete review"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(review.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/80">
                {review.review}
              </p>
            </article>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
