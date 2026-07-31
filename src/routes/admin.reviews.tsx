import { createFileRoute } from "@tanstack/react-router";
import { ReviewsManagement } from "@/components/admin/ReviewsManagement";

export const Route = createFileRoute("/admin/reviews")({ component: ReviewsManagement });
