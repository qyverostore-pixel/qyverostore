import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
export const Route = createFileRoute("/privacy-policy")({ component: () => <LegalPage type="privacy" /> });
