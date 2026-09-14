import Link from "next/link";
import type { Locale } from "@/domain/messages";
import { t } from "@/domain/messages";
import { LEGAL_LINKS, chromeLinks } from "@/domain/chrome";
import { Egg } from "@/components/visual";

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="bg-blush px-5 py-10 text-berry sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6">
        <div className="flex items-end gap-4">
          <Egg size={56} className="-rotate-6" />
          <div>
            <p className="font-display text-3xl tracking-wide">
              {t(locale, "footerLine")}
            </p>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6">
              {t(locale, "footerExplain")}
            </p>
          </div>
        </div>
        <p className="font-display text-2xl">#bragfast</p>
      </div>
      <nav className="mx-auto mt-6 flex max-w-6xl flex-wrap gap-4 text-sm font-bold">
        {chromeLinks("footer").map((item) => (
          <Link key={item.href} href={item.href}>
            {t(locale, item.label)}
          </Link>
        ))}
        {LEGAL_LINKS.map((item) => (
          <Link key={item.href} href={item.href}>
            {t(locale, item.label)}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
