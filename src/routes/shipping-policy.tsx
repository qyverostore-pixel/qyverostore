import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
export const Route = createFileRoute("/shipping-policy")({ component: () => <LegalPage type="shipping" /> });
