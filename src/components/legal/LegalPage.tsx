import { Link } from "@tanstack/react-router";

const content = {
  privacy: { eyebrow: "Privacy", title: "Privacy Policy", text: "QYVERO respects your privacy. We collect only the information needed to respond to your requests, process orders, and improve your store experience." },
  terms: { eyebrow: "Terms", title: "Terms & Conditions", text: "By using QYVERO, you agree to use the store lawfully and provide accurate information when placing an order. Product availability and pricing may change as collections evolve." },
  shipping: { eyebrow: "Delivery", title: "Shipping Policy", text: "Orders are prepared within one to two business days and delivered nationwide across Egypt. Our team will confirm delivery details and timing by WhatsApp." },
  returns: { eyebrow: "Returns", title: "Return Policy", text: "If something is not right with your order, contact QYVERO within seven days of delivery. Our team will review the item and guide you through the available return options." },
} as const;

export function LegalPage({ type }: { type: keyof typeof content }) {
  const page = content[type];
  return <main className="min-h-screen bg-noise py-24 sm:py-32"><div className="mx-auto max-w-3xl px-6"><p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-teal">{page.eyebrow}</p><h1 className="text-display mt-5 text-4xl font-light sm:text-6xl">{page.title}</h1><div className="glass-card mt-10 rounded-[2rem] p-7 sm:p-10"><p className="text-base leading-8 text-muted-foreground">{page.text}</p><p className="mt-6 text-sm leading-7 text-muted-foreground">For questions about this policy, please contact us through the QYVERO contact page.</p></div><Link to="/contact" className="mt-8 inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm transition hover:border-teal hover:text-teal">Contact QYVERO</Link></div></main>;
}
