import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
export const Route = createFileRoute("/terms-and-conditions")({ component: () => <LegalPage type="terms" /> });
