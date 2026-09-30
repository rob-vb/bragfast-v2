import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag, Heart, LayoutGrid, MapIcon, Trophy } from "lucide-react";
import { CityMap } from "@/components/city-map-loader";
import { EggEmpty } from "@/components/egg-empty";
import { PassportStamps } from "@/components/passport-stamps";
import { PageHero, PageHeroPoster } from "@/components/page-hero";
import { loadPassport, loadPassportPage } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { NL_CITIES } from "@/domain/cities";
import {
  discoveredCountLabel,
  inCitiesLabel,
  leaderboardRankLabel,
  likeCountLabel,
  passportMetaDescription,
  photoCountLabel,
  shortDate,
  t,
  type Locale,
} from "@/domain/messages";
import { passportStamps, photographedSpots } from "@/domain/passport";
import { SegmentLink, Segmented, SpotLinkCard } from "@/components/visual";

type Params = { slug: string };
type Search = {
  view?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPassport(slug);
  if (!page) {
    return { title: "brag.fast" };
  }
  const locale = await getLocale();
  const indexable = page.photos.length > 0;
  return {
    ...pageMetadata(locale, {
      title: `@${page.slug}`,
      description: passportMetaDescription(
        locale,
        page.slug,
        page.photos.length,
        page.discoveredCount,
      ),
      path: `/u/${page.slug}`,
    }),
    robots: { index: indexable, follow: indexable },
  };
}

function hrefFor(
  slug: string,
  current: { view: "list" | "map" },
  patch: Partial<typeof current>,
): string {
  const next = { ...current, ...patch };
  if (next.view === "map") {
    return `/u/${slug}?view=map`;
  }
  return `/u/${slug}`;
}

function cityName(locale: Locale, citySlug: string): string {
  const city = NL_CITIES.find((row) => row.slug === citySlug);
  if (!city) {
    return citySlug;
  }
  return locale === "en" ? city.nameEn : city.nameNl;
}

export default async function PassportPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  const locale = await getLocale();
  const page = await loadPassportPage(slug);
  if (!page) {
    notFound();
  }

  const filters = {
    view: search.view === "map" ? ("map" as const) : ("list" as const),
  };
  // The map pins each spot once, on the first photo taken there
  const spots = photographedSpots(
    page.photos.map((photo) => ({
      createdAt: photo.createdAt,
      spot: { ...photo.spot, photoUrl: photo.url },
    })),
  );
  const stamps = passportStamps(spots).map((stamp) => ({
    ...stamp,
    name: cityName(locale, stamp.citySlug),
  }));

  return (
    <main>
      <PageHero>
        <div className="grid items-end gap-y-10 lg:grid-cols-12 lg:gap-x-12">
          <div className="@container lg:col-span-7">
            {page.standing ? (
              <Link
                href="/nl/leaderboard"
                className="inline-flex h-9 items-center gap-2 rounded-full bg-white/12 pr-4 pl-3 text-sm font-bold text-milk tabular-nums transition-[background-color,transform] duration-press ease-out-strong active:scale-[0.97] pointer-fine:hover:bg-white/20"
              >
                <Trophy aria-hidden className="size-4 text-yolk" strokeWidth={2.5} />
                {leaderboardRankLabel(locale, page.standing.rank)}
              </Link>
            ) : null}
            <div className="mt-6 sm:mt-8">
              <PageHeroPoster fit="handle">{page.slug}</PageHeroPoster>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-7">
              <p className="sticker w-fit -rotate-3 rounded-full bg-yolk px-4 py-1.5 text-base font-extrabold text-berry tabular-nums">
                {photoCountLabel(locale, page.photos.length)}
              </p>
              {stamps.length > 0 ? (
                <p className="flex flex-wrap items-center gap-x-2.5 text-lg font-semibold text-milk tabular-nums sm:text-xl">
                  {page.discoveredCount > 0 ? (
                    <>
                      <span className="inline-flex items-center gap-1.5">
                        <Flag
                          aria-hidden
                          className="size-4.5 fill-yolk text-yolk"
                          strokeWidth={2.5}
                        />
                        {discoveredCountLabel(locale, page.discoveredCount)}
                      </span>
                      <span aria-hidden className="text-candy">
                        ·
                      </span>
                    </>
                  ) : null}
                  {inCitiesLabel(locale, stamps.length)}
                  {page.standing ? (
                    <>
                      <span aria-hidden className="text-candy">
                        ·
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Heart
                          aria-hidden
                          className="size-4.5 fill-candy text-candy"
                          strokeWidth={2.5}
                        />
                        {likeCountLabel(locale, page.standing.likeSum)}
                      </span>
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>
          </div>
          {stamps.length > 0 ? (
            <div className="lg:col-span-5">
              <PassportStamps locale={locale} stamps={stamps} />
            </div>
          ) : null}
        </div>
      </PageHero>

      <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-12">
        {page.photos.length === 0 ? (
          <EggEmpty
            title={t(locale, "passportEmpty")}
            description={t(locale, "appRowBragBody")}
          />
        ) : (
          <>
            <Segmented label={t(locale, "viewMode")} className="ml-auto">
              <SegmentLink
                href={hrefFor(page.slug, filters, { view: "list" })}
                active={filters.view === "list"}
              >
                <LayoutGrid aria-hidden className="size-4" strokeWidth={2.5} />
                <span className="max-sm:sr-only">{t(locale, "viewList")}</span>
              </SegmentLink>
              <SegmentLink
                href={hrefFor(page.slug, filters, { view: "map" })}
                active={filters.view === "map"}
              >
                <MapIcon aria-hidden className="size-4" strokeWidth={2.5} />
                <span className="max-sm:sr-only">{t(locale, "viewMap")}</span>
              </SegmentLink>
            </Segmented>

            {filters.view === "map" ? (
              <div className="mt-6">
                <CityMap locale={locale} spots={spots} />
              </div>
            ) : (
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {page.photos.map((photo, index) => {
                  const where = cityName(locale, photo.spot.citySlug);
                  return (
                    <li key={photo.id}>
                      <SpotLinkCard
                        href={`/nl/${photo.spot.citySlug}/${photo.spot.slug}`}
                        src={photo.url}
                        title={photo.spot.name}
                        meta={
                          photo.spot.closed
                            ? `${t(locale, "closed")} · ${where}`
                            : `${where} · ${shortDate(locale, photo.createdAt)}`
                        }
                        className="aspect-square"
                        heading="h2"
                        eager={index < 3}
                        muted={photo.spot.closed}
                        badge={
                          photo.discovery ? (
                            <p className="sticker inline-flex -rotate-3 items-center gap-1.5 rounded-full bg-yolk py-1 pr-3 pl-2.5 text-sm font-extrabold text-berry">
                              <Flag
                                aria-hidden
                                className="size-3.5 fill-berry"
                                strokeWidth={2.5}
                              />
                              {t(locale, "discoveryBadge")}
                              <span className="sr-only">
                                . {t(locale, "discoveryHint")}
                              </span>
                            </p>
                          ) : undefined
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}
