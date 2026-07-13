import type { Category } from "@/types";

export type AdminProductStatus = "Active" | "Draft" | "Archived";
export type OrderStatus = "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";

export interface AdminProduct { id: string; name: string; category: Category; price: number; stock: number; featured: boolean; status: AdminProductStatus; sku: string; tone: string; description: string; brand: string; comparePrice?: number; tags: string[]; specifications: string; }
export interface AdminCategory { id: string; name: string; slug: string; productCount: number; }
export interface AdminOrder { id: string; customer: string; products: number; total: number; status: OrderStatus; date: string; }
export interface AdminCustomer { id: string; name: string; email: string; orders: number; spent: number; status: "Active" | "Inactive"; }
export interface AdminMessage { id: string; name: string; email: string; subject: string; message: string; date: string; status: "New" | "Read"; }
export interface Activity { id: string; title: string; detail: string; time: string; }

export const adminProducts: AdminProduct[] = [
  { id: "1", name: "Bifold Leather Wallet", category: "Wallets", price: 89, stock: 42, featured: true, status: "Active", sku: "QY-WAL-001", tone: "from-stone-500 to-neutral-950", description: "A quietly refined everyday essential, crafted from full-grain leather.", brand: "QYVERO", comparePrice: 109, tags: ["leather", "wallet"], specifications: "Material: Full-grain leather\nDimensions: 11 × 9 × 1.5 cm" },
  { id: "2", name: "Chrono Steel 42mm", category: "Watches", price: 349, stock: 8, featured: true, status: "Active", sku: "QY-WAT-002", tone: "from-teal/30 to-neutral-950", description: "Precision steel timepiece for everyday distinction.", brand: "QYVERO", tags: ["watch", "steel"], specifications: "Case: Stainless steel\nDiameter: 42 mm" },
  { id: "3", name: "Signature Belt — Onyx", category: "Belts", price: 79, stock: 3, featured: false, status: "Active", sku: "QY-BEL-003", tone: "from-neutral-600 to-neutral-950", description: "A sleek leather belt finished with a signature buckle.", brand: "QYVERO", tags: ["belt", "leather"], specifications: "Material: Genuine leather\nWidth: 3.5 cm" },
  { id: "4", name: "Noir Eau de Parfum", category: "Perfumes", price: 129, stock: 0, featured: true, status: "Draft", sku: "QY-PER-004", tone: "from-amber-900/50 to-neutral-950", description: "A bold, lingering fragrance with a warm finish.", brand: "QYVERO", tags: ["fragrance"], specifications: "Volume: 100 ml\nType: Eau de Parfum" },
  { id: "5", name: "Urban Cross Bag", category: "Cross Bags", price: 149, stock: 19, featured: false, status: "Active", sku: "QY-BAG-005", tone: "from-neutral-800 to-neutral-950", description: "Compact utility, refined silhouette.", brand: "QYVERO", tags: ["bag"], specifications: "Material: Vegan leather\nCapacity: 3 L" },
];

export const adminCategories: AdminCategory[] = [
  { id: "wallets", name: "Wallets", slug: "wallets", productCount: 12 }, { id: "watches", name: "Watches", slug: "watches", productCount: 8 }, { id: "belts", name: "Belts", slug: "belts", productCount: 7 }, { id: "perfumes", name: "Perfumes", slug: "perfumes", productCount: 9 }, { id: "bags", name: "Cross Bags", slug: "cross-bags", productCount: 6 }, { id: "accessories", name: "Accessories", slug: "accessories", productCount: 11 },
];
export const adminOrders: AdminOrder[] = [
  { id: "#QY-1048", customer: "Omar Hassan", products: 2, total: 238, status: "Pending", date: "Jul 11, 2026" }, { id: "#QY-1047", customer: "Youssef Adel", products: 1, total: 349, status: "Confirmed", date: "Jul 11, 2026" }, { id: "#QY-1046", customer: "Karim Mostafa", products: 3, total: 417, status: "Shipped", date: "Jul 10, 2026" }, { id: "#QY-1045", customer: "Adam Nabil", products: 1, total: 79, status: "Delivered", date: "Jul 09, 2026" }, { id: "#QY-1044", customer: "Mazen Fathy", products: 2, total: 198, status: "Cancelled", date: "Jul 08, 2026" },
];
export const adminCustomers: AdminCustomer[] = [
  { id: "1", name: "Omar Hassan", email: "omar@example.com", orders: 4, spent: 786, status: "Active" }, { id: "2", name: "Youssef Adel", email: "youssef@example.com", orders: 3, spent: 584, status: "Active" }, { id: "3", name: "Karim Mostafa", email: "karim@example.com", orders: 7, spent: 1230, status: "Active" }, { id: "4", name: "Adam Nabil", email: "adam@example.com", orders: 1, spent: 79, status: "Inactive" },
];
export const adminMessages: AdminMessage[] = [
  { id: "1", name: "Nour Ahmed", email: "nour@example.com", subject: "Product availability", message: "When will the Noir Eau de Parfum be available again?", date: "Jul 11, 2026", status: "New" }, { id: "2", name: "Hassan Tarek", email: "hassan@example.com", subject: "Order delivery", message: "I would like an update on my delivery.", date: "Jul 10, 2026", status: "Read" }, { id: "3", name: "Sara Emad", email: "sara@example.com", subject: "Corporate gifts", message: "Can you support a corporate order of 20 wallets?", date: "Jul 08, 2026", status: "Read" },
];
export const recentActivity: Activity[] = [
  { id: "1", title: "New order received", detail: "#QY-1048 from Omar Hassan", time: "12 minutes ago" }, { id: "2", title: "Product stock updated", detail: "Chrono Steel 42mm is low in stock", time: "45 minutes ago" }, { id: "3", title: "New customer registered", detail: "Youssef Adel joined QYVERO", time: "2 hours ago" }, { id: "4", title: "Order shipped", detail: "#QY-1046 is on its way", time: "5 hours ago" },
];
export const dashboardStats = [{ label: "Total Products", value: "53", change: "+8.2%", icon: "Package" }, { label: "Orders", value: "1,248", change: "+12.5%", icon: "ShoppingBag" }, { label: "Customers", value: "842", change: "+6.8%", icon: "Users" }, { label: "Revenue", value: "$24,680", change: "+18.4%", icon: "DollarSign" }];
