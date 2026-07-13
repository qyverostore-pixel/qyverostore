import type { ReactNode } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AdminTable({ columns, children }: { columns: string[]; children: ReactNode }) { return <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.025]"><Table><TableHeader><TableRow className="hover:bg-transparent">{columns.map((column) => <TableHead key={column} className="h-12 whitespace-nowrap px-4 text-[11px] uppercase tracking-wider">{column}</TableHead>)}</TableRow></TableHeader><TableBody>{children}</TableBody></Table></div>; }

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) { const styles = { neutral: "bg-white/10 text-white/75", success: "bg-emerald-400/10 text-emerald-300", warning: "bg-amber-400/10 text-amber-300", danger: "bg-red-400/10 text-red-300", info: "bg-sky-400/10 text-sky-300" }; return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles[tone]}`}>{children}</span>; }
