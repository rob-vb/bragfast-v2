import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t, type Locale } from "@/domain/messages";
import type { StoreButton } from "@/domain/viewModels";

/** The web app lives beside the site, not in it: a plain link, not next/link. */
const WEB_APP_HREF = "/app/";

export function StoreButtons({
  locale,
  ios,
  className,
}: {
  locale: Locale;
  ios: StoreButton;
  className?: string;
}) {
  return (
    <div className={cn("mt-6 flex flex-wrap items-center gap-3", className)}>
      <a href={WEB_APP_HREF} className={buttonVariants({ size: "lg" })}>
        {t(locale, "addBreakfast")}
      </a>
      <AppStoreBadge locale={locale} store={ios} />
    </div>
  );
}

const BADGE =
  "inline-flex h-12 shrink-0 items-center gap-2.5 rounded-full bg-berry pl-4 pr-6 text-white";

/** Reads as an App Store badge even while the app is in review, so nobody hunts for it. */
function AppStoreBadge({ locale, store }: { locale: Locale; store: StoreButton }) {
  const label = (
    <>
      <AppleLogo />
      <span className="flex flex-col items-start leading-none">
        <span className="text-[10px] font-extrabold tracking-[0.14em] uppercase opacity-75">
          {store.kind === "live" ? t(locale, "appStoreOn") : t(locale, "comingSoon")}
        </span>
        <span className="mt-1 text-lg font-black tracking-[-0.01em]">
          {t(locale, "downloadIos")}
        </span>
      </span>
    </>
  );
  switch (store.kind) {
    case "live":
      return (
        <a
          href={store.href}
          className={cn(
            BADGE,
            "outline-none transition-transform duration-press ease-out-strong active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-yolk focus-visible:ring-offset-2",
          )}
          aria-label={`${t(locale, "appStoreOn")} ${t(locale, "downloadIos")}`}
        >
          {label}
        </a>
      );
    case "comingSoon":
      return (
        <span
          aria-disabled="true"
          aria-label={`${t(locale, "downloadIos")}: ${t(locale, "comingSoon")}`}
          className={cn(BADGE, "cursor-default opacity-45 select-none")}
        >
          {label}
        </span>
      );
    default: {
      const _exhaustive: never = store;
      return _exhaustive;
    }
  }
}

function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6 -translate-y-px" fill="currentColor">
      <path d="M17.564 12.659c-.022-2.34 1.913-3.46 1.998-3.516-1.088-1.592-2.783-1.81-3.39-1.836-1.442-.146-2.815.85-3.547.85-.733 0-1.86-.829-3.057-.806-1.572.024-3.022.914-3.832 2.32-1.636 2.834-.418 7.027 1.176 9.327.778 1.123 1.706 2.385 2.92 2.34 1.171-.048 1.615-.758 3.03-.758 1.413 0 1.815.758 3.052.735 1.26-.022 2.057-1.146 2.829-2.273.892-1.305 1.258-2.567 1.28-2.632-.028-.013-2.456-.94-2.48-3.751zM15.193 5.78c.646-.785 1.083-1.872.964-2.957-.932.038-2.064.621-2.733 1.404-.6.694-1.124 1.804-.984 2.866 1.042.08 2.107-.529 2.753-1.313z" />
    </svg>
  );
}
