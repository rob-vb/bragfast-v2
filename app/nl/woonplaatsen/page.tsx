import type { Metadata } from "next";
import Link from "next/link";
import { EggEmpty } from "@/components/egg-empty";
import { PageHero, PageHeroLead, PageHeroTitle } from "@/components/page-hero";
import { SearchBox } from "@/components/search-box";
import { loadBoardIndex } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { t, townCountLabel, uniqueSpotsLabel } from "@/domain/messages";
import { townIndexGroups } from "@/domain/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const boards = await loadBoardIndex();
  return {
    ...pageMetadata(locale, {
      title: t(locale, "townIndexMetaTitle"),
      description: t(locale, "townIndexMetaDescription"),
      path: "/nl/woonplaatsen",
    }),
    ...(boards.length === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

/**
 * Every woonplaats board with a live spot, A to Z. Not a featured list: the
 * order is the alphabet, and a board joins with its first spot.
 */
export default async function TownIndexPage() {
  const locale = await getLocale();
  const boards = await loadBoardIndex();
  const groups = townIndexGroups(boards, locale);

  return (
    <main>
      <PageHero>
        <PageHeroTitle size="lg">{t(locale, "townIndex")}</PageHeroTitle>
        {boards.length > 0 ? (
          <p className="sticker mt-7 w-fit -rotate-3 rounded-full bg-yolk px-4 py-1.5 text-base font-extrabold text-berry tabular-nums">
            {townCountLabel(locale, boards.length)}
          </p>
        ) : null}
        <PageHeroLead className="mt-5 max-w-xl text-pretty text-milk sm:text-xl">
          {t(locale, "townIndexLead")}
        </PageHeroLead>
        <SearchBox locale={locale} />
      </PageHero>

      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        {groups.length === 0 ? (
          <EggEmpty
            title={t(locale, "townIndexEmpty")}
            description={t(locale, "townIndexEmptyHint")}
          />
        ) : (
          <div className="divide-y divide-berry/12">
            {groups.map((group) => (
              <section
                key={group.letter}
                aria-labelledby={`letter-${group.letter}`}
                className="grid grid-cols-[3rem_1fr] items-start gap-x-4 py-6 first:pt-0 last:pb-0 sm:grid-cols-[4.5rem_1fr]"
              >
                <h2
                  id={`letter-${group.letter}`}
                  className="font-display text-4xl leading-none tracking-wide sm:text-5xl"
                >
                  {group.letter}
                </h2>
                <ul className="flex flex-wrap gap-3">
                  {group.entries.map((entry) => (
                    <li key={entry.city.slug}>
                      <Link
                        href={`/nl/${entry.city.slug}`}
                        className="inline-flex h-12 items-center gap-3 rounded-full bg-milk pr-2 pl-5 text-berry transition-[background-color,transform] duration-press ease-out-strong active:scale-[0.97] pointer-fine:hover:bg-candy/45"
                      >
                        <span className="font-display text-xl tracking-wide">
                          {locale === "en" ? entry.city.nameEn : entry.city.nameNl}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-berry/75 tabular-nums">
                          {uniqueSpotsLabel(locale, entry.spotCount)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
