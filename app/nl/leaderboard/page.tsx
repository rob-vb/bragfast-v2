import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { loadLeaderboard } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { likeCountLabel, t, uniqueSpotsLabel } from "@/domain/messages";
import { BoardEmpty } from "@/components/board-empty";
import { PageHero, PageHeroLead, PageHeroTitle } from "@/components/page-hero";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: `${t(locale, "leaderboard")} · brag.fast` };
}

export default async function LeaderboardPage() {
  const locale = await getLocale();
  const { adders } = await loadLeaderboard();

  return (
    <main>
      <PageHero>
        <PageHeroTitle>{t(locale, "leaderboard")}</PageHeroTitle>
        <PageHeroLead>{t(locale, "leaderboardIntro")}</PageHeroLead>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        {adders.length === 0 ? (
          <BoardEmpty icon={<Trophy />} title={t(locale, "leaderboardEmpty")} />
        ) : (
          <ol className="grid gap-3">
            {adders.map((adder, index) => (
              <li key={adder.username}>
                <Link
                  href={`/nl/u/${adder.username}`}
                  className="flex items-center gap-4 rounded-slab bg-milk px-4 py-3 text-berry transition-colors duration-press ease-out-strong pointer-fine:hover:bg-shell focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-yolk font-display text-xl tracking-wide tabular-nums">
                    {index + 1}
                  </span>
                  <span className="font-display text-2xl tracking-wide">
                    {adder.username}
                  </span>
                  <span className="ml-auto text-right text-sm font-bold">
                    <span className="block tabular-nums">
                      {likeCountLabel(locale, adder.likeSum)}
                    </span>
                    <span className="mt-0.5 block font-semibold text-berry/70">
                      {uniqueSpotsLabel(locale, adder.spotCount)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
