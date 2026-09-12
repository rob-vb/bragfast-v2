import Link from "next/link";
import type { Locale } from "@/domain/messages";
import { t } from "@/domain/messages";
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
      <nav className="mx-auto mt-6 flex max-w-6xl gap-4 text-sm font-bold">
        <Link href="/nl/leaderboard">{t(locale, "leaderboard")}</Link>
        <Link href="/privacy">{t(locale, "privacy")}</Link>
        <Link href="/privacy/data-deletion">{t(locale, "dataDeletion")}</Link>
      </nav>
    </footer>
  );
}
