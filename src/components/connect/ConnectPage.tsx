import { Link } from "@tanstack/react-router";
import {
  Facebook,
  Globe,
  Instagram,
  Mail,
  MessageCircle,
  Music2,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { useStorefrontSettings } from "@/providers/StorefrontSettingsProvider";
import { emailUrl, externalUrl, whatsappUrl, type StorefrontSettings } from "@/services/store-settings";

type Channel = {
  label: string;
  href: string;
  Icon: LucideIcon;
};

function channelsFrom(settings: StorefrontSettings): Channel[] {
  return [
    { label: "Instagram", href: externalUrl(settings.instagram), Icon: Instagram },
    { label: "Facebook", href: externalUrl(settings.facebook), Icon: Facebook },
    { label: "TikTok", href: externalUrl(settings.tiktok), Icon: Music2 },
    { label: "WhatsApp", href: whatsappUrl(settings.whatsapp), Icon: MessageCircle },
    { label: "Email", href: emailUrl(settings.email), Icon: Mail },
  ].filter((channel) => channel.href);
}

function ChannelButton({ channel }: { channel: Channel }) {
  const external = channel.href.startsWith("http");
  const { Icon } = channel;

  return (
    <a
      href={channel.href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex min-h-16 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] px-5 text-left transition-colors hover:border-teal/50 hover:bg-teal/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-teal transition-colors group-hover:border-teal/30 group-hover:bg-teal/10">
        <Icon className="size-5" />
      </span>
      <span className="text-sm font-medium tracking-wide">{channel.label}</span>
    </a>
  );
}

export function ConnectPage() {
  const settings = useStorefrontSettings();
  const channels = channelsFrom(settings);

  return (
    <main className="bg-noise flex min-h-screen items-center px-6 py-28 sm:py-32">
      <section className="mx-auto w-full max-w-[30rem] text-center">
        <div className="flex justify-center">
          <BrandMark size="lg" showTagline={false} />
        </div>
        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.38em] text-teal">
          Own your style.
        </p>
        <h1 className="text-display mt-4 text-4xl font-light sm:text-5xl">Connect with QYVERO</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground sm:text-base">
          Stay connected with us through our official channels.
        </p>

        <div className="mt-10 grid gap-3 text-left">
          <Link
            to="/"
            className="group flex min-h-16 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] px-5 text-left transition-colors hover:border-teal/50 hover:bg-teal/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.035] text-teal transition-colors group-hover:border-teal/30 group-hover:bg-teal/10">
              <Globe className="size-5" />
            </span>
            <span className="text-sm font-medium tracking-wide">Shop Website</span>
          </Link>
          {channels.map((channel) => (
            <ChannelButton key={channel.label} channel={channel} />
          ))}
        </div>
      </section>
    </main>
  );
}

export default ConnectPage;
