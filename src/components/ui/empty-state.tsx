import type { ReactNode } from "react";
import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ title, description, action, icon }: { title: string; description: string; action?: ReactNode; icon?: ReactNode }) {
  return <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center sm:px-10"><div className="mx-auto grid size-14 place-items-center rounded-2xl border border-teal/20 bg-teal/10 text-teal">{icon ?? <PackageOpen className="size-6" />}</div><h2 className="text-display mt-6 text-2xl font-medium">{title}</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>{action && <div className="mt-6">{action}</div>}</section>;
}

export function EmptyStateAction({ children, onClick }: { children: ReactNode; onClick?: () => void }) { return <Button type="button" variant="outline" onClick={onClick}>{children}</Button>; }
