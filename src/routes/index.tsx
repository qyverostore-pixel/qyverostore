import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home/HomeSections";

export const Route = createFileRoute("/")({
  component: HomePage,
});
