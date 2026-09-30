import Link from "next/link";
import type { Preloaded } from "convex/react";
import { t } from "@/domain/messages";
import { chromeLinks } from "@/domain/chrome";
import { HeaderLockup } from "@/components/visual";
import { LanguageSwitch } from "@/components/language-switch";
import { AuthControl } from "@/components/auth-control";
import { HeaderNav } from "@/components/header-nav";
import { HeaderShell } from "@/components/header-shell";
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
  const links = [
    ...chromeLinks("header").map((item) => ({
      href: item.href,
      label: t(locale, item.label),
    })),
    ...(isOwner ? [{ href: "/admin", label: t(locale, "viewAdmin") }] : []),
  ];

  return (
    <HeaderShell>
      <div className="relative mx-auto flex h-full max-w-6xl items-center gap-4 px-5 sm:px-8">
        <Link
          href="/"
          aria-label="brag.fast"
          className="header-lockup shrink-0 rounded-full transition-[scale] duration-press ease-out-strong active:scale-[0.97]"
        >
          <HeaderLockup />
        </Link>
        <span className="header-tag hidden h-7 items-center rounded-full bg-candy px-2.5 font-display text-[0.9375rem] leading-none tracking-wide text-berry xl:inline-flex">
          #bragfast
        </span>
        <div className="ml-auto flex items-center gap-2">
          {/* Below lg the row does not fit beside the lockup; it moves into
              the Menu sheet. AuthControl stays mounted: it owns sign-in. */}
          <HeaderNav
            label={t(locale, "menu")}
            links={links}
            className="hidden lg:block"
          />
          <span aria-hidden className="mx-1 hidden h-5 w-px bg-berry/15 lg:block" />
          <div className="hidden lg:block">
            <LanguageSwitch
              locale={locale}
              label={t(locale, "language")}
              variant="bar"
            />
          </div>
          <div className="hidden lg:contents">
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
            className="lg:hidden"
          />
        </div>
      </div>
    </HeaderShell>
  );
}
