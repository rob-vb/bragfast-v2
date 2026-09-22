import {
  likeCountLabel,
  localFavoritesHeading,
  seeAllInCity,
  t,
  type Locale,
} from "@/domain/messages";
import type { HomepageData, LocalFavorites } from "@/domain/viewModels";
import { AppRow } from "@/components/app-row";
import { SearchBox } from "@/components/search-box";
import { PhotoFrame, SpotLinkCard } from "@/components/visual";
import { HERO_SCENE } from "@/lib/scenes";
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
        <PhotoFrame src={HERO_SCENE} ken className="absolute inset-0" />
        <div className="relative mx-auto flex min-h-[92svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 sm:px-8 md:pb-20">
          <h1 className="text-shadow-photo max-w-xl font-display text-[clamp(1.875rem,6vw,3.25rem)] leading-[1.05] tracking-wide text-white">
            {t(locale, "hero")}
          </h1>
          <p className="text-shadow-photo mt-4 max-w-lg text-base font-semibold leading-7 text-white sm:text-lg">
            {t(locale, "intro")}
          </p>
          <SearchBox locale={locale} />
        </div>
      </section>

      <LocalFavoritesSection
        locale={locale}
        localFavorites={homepage.localFavorites}
      />

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
