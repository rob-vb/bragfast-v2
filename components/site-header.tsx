import Link from "next/link";
import type { Preloaded } from "convex/react";
import { t } from "@/domain/messages";
import { chromeLinks } from "@/domain/chrome";
import { Logo } from "@/components/visual";
import { LanguageSwitch } from "@/components/language-switch";
import { AuthControl } from "@/components/auth-control";
import { ChromeNavLink } from "@/components/chrome-nav-link";
import { api } from "@/convex/_generated/api";
import type { Locale } from "@/domain/messages";

export function SiteHeader({
  locale,
  preloadedUser,
  passportSlug,
  isOwner,
}: {
  locale: Locale;
  preloadedUser: Preloaded<typeof api.auth.getCurrentUser>;
  passportSlug: string | null;
  isOwner: boolean;
}) {
  return (
    <header className="relative z-20 bg-milk/85 text-berry backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 sm:h-[4.5rem] sm:px-8">
        <Link
          href="/"
          aria-label="brag.fast"
          className="flex items-center gap-2.5 rounded-full transition-transform duration-press ease-out-strong active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk"
        >
          <Logo size="header" />
        </Link>
        <span className="hidden font-display text-sm text-blush sm:inline">
          #bragfast
        </span>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          {chromeLinks("header").map((item) => (
            <ChromeNavLink
              key={item.href}
              href={item.href}
              hiddenOnMobile={item.href === "/how-it-works"}
            >
              {t(locale, item.label)}
            </ChromeNavLink>
          ))}
          {isOwner ? (
            <ChromeNavLink href="/admin">{t(locale, "viewAdmin")}</ChromeNavLink>
          ) : null}
          <LanguageSwitch locale={locale} label={t(locale, "language")} />
          <AuthControl
            locale={locale}
            preloadedUser={preloadedUser}
            passportSlug={passportSlug}
          />
        </div>
      </div>
    </header>
  );
}
