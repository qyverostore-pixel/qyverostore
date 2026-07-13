import type { Company } from "@/types";

export const company: Company = { name: "QYVERO", tagline: "Own your style.", description: "Modern men's lifestyle brand combining fashion and technology — crafted for the ones who own their style.", email: "qyverostore@gmail.com", whatsappNumber: "201505967144", foundedYear: 2026 };

export const aboutTimeline = ["Brand Started", "First Collection", "100 Customers", "1000 Customers", "Private Label", "Global Brand"];

export const companyFaqs = [
  ["How can I place an order?", "Choose a product and use its WhatsApp order button. Our team will confirm availability, delivery details, and payment with you directly."],
  ["How long does delivery take?", "Orders are prepared within 1–2 business days. Delivery times vary by location, and tracking details are shared once your order is dispatched."],
  ["Do you ship nationwide?", "Yes. QYVERO delivers across Egypt, so your selected essentials can reach you wherever you are."],
  ["Can I ask about a product before ordering?", "Absolutely. Message us on WhatsApp or Instagram and we will gladly help with product details, availability, and recommendations."],
  ["How do I stay updated on new releases?", "Follow QYVERO on Instagram and TikTok for new drops, product updates, and the stories behind the collection."],
] as const;

export const businessInformation = [
  { key: "hours", title: "Business Hours", text: "Daily, 10:00 AM – 10:00 PM" },
  { key: "response", title: "Response Time", text: "Within 24 hours on business days" },
  { key: "delivery", title: "Delivery", text: "Nationwide shipping across Egypt" },
] as const;
