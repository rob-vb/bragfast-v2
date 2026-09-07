import Link from "next/link";
import { t } from "@/domain/messages";
import { Logo } from "@/components/visual";
import { LanguageSwitch } from "@/components/language-switch";
import { AuthControl } from "@/components/auth-control";
import type { Preloaded } from "convex/react";
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
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk"
        >
          <Logo size="header" />
        </Link>
        <span className="hidden font-display text-sm text-blush sm:inline">
          #bragfast
        </span>
        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          {isOwner ? (
            <Link href="/admin" className="text-sm font-bold text-berry">
              {t(locale, "viewAdmin")}
            </Link>
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
