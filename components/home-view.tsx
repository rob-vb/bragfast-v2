"use client";

import { useState } from "react";
import { boardCityLabel, t, type Locale } from "@/domain/messages";
import type { CityCard } from "@/domain/viewModels";
import { SearchBox } from "@/components/search-box";
import { PhotoFrame, SpotLinkCard } from "@/components/visual";
import { HERO_SCENE, cityScene } from "@/lib/scenes";
import { cn } from "@/lib/utils";

export function HomeView({
  locale,
  featured,
}: {
  locale: Locale;
  featured: CityCard[];
}) {
  const [moreCities, setMoreCities] = useState(false);

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

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <h2 className="font-display text-3xl tracking-wide sm:text-4xl">
          {t(locale, "featuredCities")}
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((city, index) => {
            const name = locale === "en" ? city.nameEn : city.nameNl;
            const hiddenOnMobile = index >= 4 && !moreCities;
            const featuredHero = index === 0;
            return (
              <li
                key={city.slug}
                className={cn(
                  featuredHero && "sm:col-span-2 lg:row-span-2",
                  hiddenOnMobile && "max-sm:hidden",
                )}
              >
                <SpotLinkCard
                  href={`/nl/${city.slug}`}
                  src={cityScene(city.slug)}
                  title={name}
                  meta={
                    city.boardCount
                      ? boardCityLabel(locale, city.boardCount)
                      : undefined
                  }
                  className={
                    featuredHero ? "min-h-48 sm:min-h-72 lg:min-h-full" : "min-h-48"
                  }
                />
              </li>
            );
          })}
        </ul>
        {featured.length > 4 && !moreCities ? (
          <button
            type="button"
            className="mt-5 text-sm font-bold text-blush sm:hidden"
            onClick={() => setMoreCities(true)}
          >
            {t(locale, "moreCities")}
          </button>
        ) : null}
      </section>
    </main>
  );
}
