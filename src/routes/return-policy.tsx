import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal/LegalPage";
export const Route = createFileRoute("/return-policy")({ component: () => <LegalPage type="returns" /> });
