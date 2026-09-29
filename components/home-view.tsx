import {
  likeCountLabel,
  localFavoritesHeading,
  seeAllInCity,
  t,
  type Locale,
  type MessageKey,
} from "@/domain/messages";
import type { CSSProperties } from "react";
import type { HomepageData, LocalFavorites } from "@/domain/viewModels";
import { AppRow } from "@/components/app-row";
import { VERBS } from "@/components/how-it-works";
import { SearchBox } from "@/components/search-box";
import { PhotoFrame, SpotLinkCard } from "@/components/visual";
import { HERO_SCENE } from "@/lib/scenes";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function HomeView({
  locale,
  homepage,
}: {
  locale: Locale;
  homepage: HomepageData;
}) {
  return (
    <main>
      <section className="relative -mt-16 min-h-[92svh] sm:-mt-[4.5rem]">
        <PhotoFrame scene={HERO_SCENE} ken className="absolute inset-0" />
        <div className="relative mx-auto flex min-h-[92svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 md:pb-20">
          <h1 className="text-shadow-photo max-w-xl font-display text-[clamp(1.875rem,6vw,3.25rem)] leading-[1.05] tracking-wide text-white">
            {t(locale, "hero")}
          </h1>
          <p className="text-shadow-photo mt-4 max-w-lg text-base font-semibold leading-7 text-white sm:text-lg">
            {t(locale, "intro")}
          </p>
          <SearchBox locale={locale} />
          <nav className="mt-5 flex flex-wrap gap-x-6 gap-y-1">
            <HeroLink href="/how-it-works">{t(locale, "howItWorks")}</HeroLink>
            <HeroLink href="/nl/woonplaatsen">{t(locale, "heroTownIndex")}</HeroLink>
          </nav>
        </div>
      </section>

      <LocalFavoritesSection
        locale={locale}
        localFavorites={homepage.localFavorites}
      />

      <Steps locale={locale} />

      <AppRow
        locale={locale}
        stores={homepage.stores}
        titleKey="appRowBragTitle"
        bodyKey="appRowBragBody"
        phoneFirst={false}
      />
      <AppRow
        locale={locale}
        stores={homepage.stores}
        titleKey="appRowPhotosTitle"
        bodyKey="appRowPhotosBody"
        phoneFirst
      />
    </main>
  );
}

/** Crawlable ways in beside the search, which only works with script. */
function HeroLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="text-shadow-photo inline-flex items-center gap-1.5 rounded-full py-1 text-sm font-bold text-white transition-[color,transform] duration-press ease-out-strong active:scale-[0.97] pointer-fine:hover:text-yolk sm:text-base"
    >
      {children}
      <ArrowRight aria-hidden className="size-4" strokeWidth={2.75} />
    </Link>
  );
}

const STEP_BODY = {
  search: "stepSearchBody",
  brag: "stepBragBody",
  like: "stepLikeBody",
  climb: "stepClimbBody",
} as const satisfies Record<(typeof VERBS)[number]["id"], MessageKey>;

/** The four verbs of how it works, one line each, each opening its poster. */
function Steps({ locale }: { locale: Locale }) {
  return (
    <section aria-labelledby="steps-title" className="bg-berry text-white">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <h2 id="steps-title" className="font-display text-3xl tracking-wide sm:text-4xl">
          {t(locale, "stepsTitle")}
        </h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VERBS.map((verb) => (
            <li
              key={verb.id}
              className="step-card relative grid grid-cols-[6.25rem_1fr] items-center gap-x-4 rounded-slab bg-white/7 p-5 ring-1 ring-white/10 sm:flex sm:flex-col sm:items-start sm:p-6 sm:pt-7 transition-[background-color,scale] duration-press ease-out-strong has-[a:active]:scale-[0.985] pointer-fine:hover:bg-white/12"
            >
              <h3>
                <Link
                  href={`/how-it-works#${verb.id}`}
                  aria-describedby={`step-${verb.id}`}
                  style={{ "--tilt": `${verb.tilt}deg` } as CSSProperties}
                  className={cn(
                    "hiw-sticker sticker inline-flex rounded-full px-4 py-1 font-display text-2xl tracking-wide text-berry sm:px-5 sm:py-1.5 sm:text-3xl",
                    "focus-visible:outline-none! after:absolute after:inset-0 after:rounded-slab after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-yolk",
                    verb.ink,
                  )}
                >
                  {t(locale, verb.word)}
                </Link>
              </h3>
              <p
                id={`step-${verb.id}`}
                className="text-base leading-7 font-semibold text-pretty text-milk/85 sm:mt-6"
              >
                {t(locale, STEP_BODY[verb.id])}
              </p>
            </li>
          ))}
        </ol>
        <Link
          href="/how-it-works"
          className="mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-base font-bold text-berry transition-[color,transform] duration-press ease-out-strong active:scale-[0.97] pointer-fine:hover:text-blush"
        >
          {t(locale, "stepsMore")}
          <ArrowRight aria-hidden className="size-4" strokeWidth={2.75} />
        </Link>
      </div>
    </section>
  );
}

function LocalFavoritesSection({
  locale,
  localFavorites,
}: {
  locale: Locale;
  localFavorites: LocalFavorites;
}) {
  if (localFavorites.kind === "omit") {
    return null;
  }
  const cityName =
    locale === "en" ? localFavorites.city.nameEn : localFavorites.city.nameNl;
  return (
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <h2 className="font-display text-3xl tracking-wide sm:text-4xl">
        {localFavoritesHeading(locale, cityName)}
      </h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {localFavorites.spots.map((spot) => (
          <li key={spot.slug}>
            <SpotLinkCard
              href={`/nl/${spot.citySlug}/${spot.slug}`}
              src={spot.photoUrl}
              title={spot.name}
              meta={likeCountLabel(locale, spot.likeCount)}
            />
          </li>
        ))}
      </ul>
      <p className="mt-6">
        <Link
          href={`/nl/${localFavorites.city.slug}`}
          className="text-sm font-bold text-blush transition-colors duration-press ease-out-strong pointer-fine:hover:text-berry focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yolk"
        >
          {seeAllInCity(locale, cityName)}
        </Link>
      </p>
    </section>
  );
}
