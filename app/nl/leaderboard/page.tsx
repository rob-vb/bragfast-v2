import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { loadAppStores, loadLeaderboard } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { likeCountLabel, t, uniqueSpotsLabel } from "@/domain/messages";
import { PageHero, PageHeroLead, PageHeroTitle } from "@/components/page-hero";
import { Podium } from "@/components/podium";
import { StoreButtons } from "@/components/store-buttons";
import { Egg } from "@/components/visual";
import { cn } from "@/lib/utils";

/** The podium holds the first three; the rest line up below it. */
const PODIUM = 3;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${t(locale, "leaderboard")} · brag.fast` };
}

export default async function LeaderboardPage() {
  const locale = await getLocale();
  const { adders } = await loadLeaderboard();
  const stores = loadAppStores();
  // Two "Coming soon" keys say nothing the copy does not; show the stores once one is live
  const storeLive = stores.ios.kind === "live" || stores.android.kind === "live";
  const rest = adders.slice(PODIUM);
  // The leader's likes are the full bar; nobody below has more
  const lead = adders[0]?.likeSum ?? 0;

  return (
    <main>
      <PageHero className="overflow-hidden">
        <div className="grid gap-y-8 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-0">
          <div className="lg:col-span-12">
            <PageHeroTitle size="lg">{t(locale, "leaderboard")}</PageHeroTitle>
          </div>
          <PageHeroLead className="max-w-sm text-balance text-milk sm:text-xl lg:col-span-4">
            {t(locale, "leaderboardIntro")}
          </PageHeroLead>
          <div className="-mb-10 lg:col-span-8">
            <Podium locale={locale} adders={adders} label={t(locale, "leaderboard")} />
          </div>
        </div>
      </PageHero>

      <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
        {rest.length > 0 ? (
          <ol start={PODIUM + 1} className="grid gap-3">
            {rest.map((adder, index) => (
              <li key={adder.username}>
                <Link
                  href={`/nl/u/${adder.username}`}
                  className="group/row grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-slab bg-milk py-3 pr-5 pl-3 text-berry transition-[background-color,scale] duration-press ease-out-strong active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,16rem)_6.5rem] sm:gap-6 pointer-fine:hover:bg-shell"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-yolk font-display text-xl tracking-wide tabular-nums">
                    {PODIUM + index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 font-display text-2xl leading-tight tracking-wide wrap-break-word">
                      <span className="text-blush">@</span>
                      {adder.username}
                    </span>
                    <span className="block text-sm font-semibold text-berry/70 tabular-nums">
                      {uniqueSpotsLabel(locale, adder.spotCount)}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="hidden h-2.5 overflow-hidden rounded-full bg-white sm:block"
                  >
                    {adder.likeSum > 0 ? (
                      <span
                        className="like-bar block h-full rounded-full bg-blush"
                        style={{ "--share": adder.likeSum / lead } as CSSProperties}
                      />
                    ) : null}
                  </span>
                  <span className="inline-flex items-center justify-end gap-1.5 text-sm font-extrabold whitespace-nowrap tabular-nums">
                    <Heart
                      aria-hidden
                      className="size-4 fill-blush text-blush"
                      strokeWidth={2.5}
                    />
                    {likeCountLabel(locale, adder.likeSum)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : null}

        <section
          aria-labelledby="climb-heading"
          className={cn(
            "flex flex-col gap-6 rounded-slab border border-milk bg-shell p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8",
            rest.length > 0 && "mt-12 sm:mt-16",
          )}
        >
          <Egg size={76} className="-rotate-8 drop-shadow-sticker" />
          <div className="min-w-0 flex-1">
            <h2
              id="climb-heading"
              className="font-display text-2xl leading-tight tracking-wide text-balance sm:text-3xl"
            >
              {adders.length === 0 ? t(locale, "leaderboardEmpty") : t(locale, "climbTitle")}
            </h2>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-pretty text-berry/70">
              {t(locale, "climbBody")}
            </p>
          </div>
          {storeLive ? (
            <StoreButtons
              locale={locale}
              ios={stores.ios}
              android={stores.android}
              className="mt-0 shrink-0"
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}
