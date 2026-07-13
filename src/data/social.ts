import { Facebook, Instagram, Mail, MessageCircle, Music2 } from "lucide-react";
import type { SocialLink } from "@/types";

export const socialLinks: SocialLink[] = [
  { label: "Instagram", href: "https://www.instagram.com/qyverostore", handle: "@qyverostore", Icon: Instagram },
  { label: "Facebook", href: "https://www.facebook.com/share/1JiGemJjBM/", handle: "QYVERO Store", Icon: Facebook },
  { label: "TikTok", href: "https://www.tiktok.com/@qyvero.store", handle: "@qyvero.store", Icon: Music2 },
  { label: "WhatsApp", href: "https://wa.me/201505967144", handle: "+20 150 596 7144", Icon: MessageCircle },
  { label: "Email", href: "mailto:qyverostore@gmail.com", handle: "qyverostore@gmail.com", Icon: Mail },
];

export const getSocialLink = (label: SocialLink["label"]) => socialLinks.find((link) => link.label === label)!;
