import { Link } from "@tanstack/react-router";
import { useLocale } from "@/providers/LocaleProvider";

export function BrandMark({
  size = "md",
  showTagline = false,
  asLink = true,
}: {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  asLink?: boolean;
}) {
  const { t } = useLocale();
  const sizes = {
    sm: { logo: "h-8 w-8", text: "text-lg", tag: "text-[10px]" },
    md: { logo: "h-10 w-10", text: "text-2xl", tag: "text-[11px]" },
    lg: { logo: "h-14 w-14", text: "text-4xl", tag: "text-xs" },
  }[size];

  const inner = (
    <div className="qy-brand-mark flex items-center gap-3">
      <div
        className={`${sizes.logo} qy-brand-icon relative grid shrink-0 place-items-center rounded-full border`}
        aria-hidden
      >
        <span className="text-display qy-brand-letter font-semibold leading-none">Q</span>
        <span
          className="absolute -bottom-[3px] right-[3px] h-[6px] w-[14px] rotate-[-25deg] rounded-[1px] bg-teal"
          style={{ boxShadow: "0 0 0 2px var(--background)" }}
        />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`text-display qy-brand-wordmark font-medium tracking-[0.28em] ${sizes.text}`}>
          QYVERO
        </span>
        {showTagline && (
          <span
            className={`mt-1.5 tracking-[0.4em] text-teal ${sizes.tag} uppercase`}
          >
            {t("brand.tagline")}
          </span>
        )}
      </div>
    </div>
  );

  if (!asLink) return inner;
  return (
    <Link to="/" className="qy-brand-link inline-flex cursor-pointer rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      {inner}
    </Link>
  );
}
