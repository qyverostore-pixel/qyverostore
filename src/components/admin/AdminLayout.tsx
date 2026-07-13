import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Boxes, ChevronLeft, ClipboardList, LayoutDashboard, LogOut, Mail, Menu, Settings, Tags, Users, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "sonner";

const items = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard }, { label: "Products", to: "/admin/products", icon: Boxes }, { label: "Categories", to: "/admin/categories", icon: Tags }, { label: "Orders", to: "/admin/orders", icon: ClipboardList }, { label: "Customers", to: "/admin/customers", icon: Users }, { label: "Messages", to: "/admin/messages", icon: Mail }, { label: "Settings", to: "/admin/settings", icon: Settings },
] as const;

export function AdminLayout({ title, description, actions, children }: { title: string; description: string; actions?: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth/signin", replace: true });
      return;
    }
    if (profile?.role !== "admin") navigate({ to: "/", replace: true });
  }, [loading, navigate, profile, user]);
  if (loading) return null;
  if (!user || profile?.role !== "admin") {
    return null;
  }
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate({ to: "/auth/signin" });
    } catch (error) {
      toast.error("Unable to sign out", { description: error instanceof Error ? error.message : "Please try again." });
    }
  };
  const sidebar = <aside className="flex h-full w-72 flex-col border-r border-white/10 bg-[#111318] p-5"><div className="mb-10 flex items-center justify-between"><BrandMark asLink={false} size="sm" /><Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></Button></div><nav className="space-y-1">{items.map(({ label, to, icon: Icon }) => { const active = to === "/admin" ? pathname === to : pathname.startsWith(to); return <Link key={to} to={to} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors", active ? "bg-teal/15 text-white ring-1 ring-teal/20" : "text-muted-foreground hover:bg-white/5 hover:text-white")}><Icon className="size-[18px]" />{label}</Link>; })}</nav><div className="mt-auto space-y-3"><div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="text-xs font-medium">QYVERO Admin</p><p className="mt-1 text-[11px] text-muted-foreground">Store management workspace</p></div><button type="button" onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"><LogOut className="size-[18px]" />Logout</button></div></aside>;
  return <div className="min-h-screen bg-[#0d0f13] text-foreground"><div className="fixed inset-y-0 left-0 z-40 hidden md:block">{sidebar}</div>{open && <div className="fixed inset-0 z-50 md:hidden"><button className="absolute inset-0 bg-black/70" aria-label="Close navigation" onClick={() => setOpen(false)} /><div className="relative h-full shadow-2xl">{sidebar}</div></div>}<div className="md:pl-72"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#0d0f13]/90 px-4 backdrop-blur-xl sm:px-8"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></Button><div><p className="text-sm font-semibold">{title}</p><p className="hidden text-xs text-muted-foreground sm:block">{description}</p></div></div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="size-[18px]" /></Button><div className="grid size-8 place-items-center rounded-full bg-teal text-xs font-bold text-teal-foreground">QA</div></div></header><main className="mx-auto max-w-7xl p-4 sm:p-8"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-display text-2xl font-medium sm:text-3xl">{title}</h1><p className="mt-1 text-sm text-muted-foreground sm:hidden">{description}</p></div>{actions}</div>{children}</main></div></div>;
}

export function AdminBackLink() { return <Link to="/admin/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"><ChevronLeft className="size-4" />Back to products</Link>; }
