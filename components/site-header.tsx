import Link from "next/link";
import type { Preloaded } from "convex/react";
import { t } from "@/domain/messages";
import { chromeLinks } from "@/domain/chrome";
import { Logo } from "@/components/visual";
import { LanguageSwitch } from "@/components/language-switch";
import { AuthControl } from "@/components/auth-control";
import { ChromeNavLink } from "@/components/chrome-nav-link";
import { MobileMenu } from "@/components/mobile-menu";
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
          className="flex shrink-0 items-center gap-2.5 rounded-full transition-transform duration-press ease-out-strong active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk"
        >
          <Logo size="header" />
        </Link>
        <span className="hidden font-display text-sm text-blush lg:inline">
          #bragfast
        </span>
        <div className="ml-auto flex items-center gap-4">
          {/* Below md the row does not fit beside the lockup; it moves into
              the Menu sheet. AuthControl stays mounted: it owns sign-in. */}
          {chromeLinks("header").map((item) => (
            <ChromeNavLink
              key={item.href}
              href={item.href}
              className="hidden md:inline-flex"
            >
              {t(locale, item.label)}
            </ChromeNavLink>
          ))}
          {isOwner ? (
            <ChromeNavLink href="/admin" className="hidden md:inline-flex">
              {t(locale, "viewAdmin")}
            </ChromeNavLink>
          ) : null}
          <div className="hidden md:block">
            <LanguageSwitch locale={locale} label={t(locale, "language")} />
          </div>
          <div className="hidden md:contents">
            <AuthControl
              locale={locale}
              preloadedUser={preloadedUser}
              passportSlug={passportSlug}
            />
          </div>
          <MobileMenu
            locale={locale}
            preloadedUser={preloadedUser}
            passportSlug={passportSlug}
            isOwner={isOwner}
            className="md:hidden"
          />
        </div>
      </div>
    </header>
  );
}
