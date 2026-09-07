import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddSpot } from "@/components/add-spot";
import { CityMap } from "@/components/city-map-loader";
import { CityTail } from "@/components/city-tail";
import { loadCityPage } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { t } from "@/domain/messages";
import type { Locale } from "@/domain/messages";
import { openNow } from "@/domain/ranking";
import type { RankedSpotCard } from "@/domain/viewModels";
import {
  Chip,
  PhotoFrame,
  SegmentLink,
  Segmented,
  SpotLinkCard,
} from "@/components/visual";
import { cityScene } from "@/lib/scenes";

type Params = { city: string };
type Search = {
  open?: string;
  brags?: string;
  view?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city } = await params;
  const page = await loadCityPage(city);
  if (!page) {
    return { title: "brag.fast" };
  }
  const locale = await getLocale();
  const name = locale === "en" ? page.city.nameEn : page.city.nameNl;
  return { title: `${name} · brag.fast` };
}

function cityName(
  locale: Locale,
  city: { nameNl: string; nameEn: string },
): string {
  return locale === "en" ? city.nameEn : city.nameNl;
}

function matches(
  spot: { hours: RankedSpotCard["hours"] },
  filters: { open: boolean },
): boolean {
  if (filters.open && !openNow(spot.hours, new Date())) {
    return false;
  }
  return true;
}

function hrefFor(
  citySlug: string,
  current: { open: boolean; brags: boolean; view: "list" | "map" },
  patch: Partial<typeof current>,
): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  if (next.open) {
    params.set("open", "1");
  }
  if (next.brags) {
    params.set("brags", "1");
  }
  if (next.view === "map") {
    params.set("view", "map");
  }
  const query = params.toString();
  return query ? `/nl/${citySlug}?${query}` : `/nl/${citySlug}`;
}

export default async function CityPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { city } = await params;
  const search = await searchParams;
  const locale = await getLocale();
  const page = await loadCityPage(city);
  if (!page) {
    notFound();
  }

  const filters = {
    open: search.open === "1",
    brags: search.brags === "1",
    view: search.view === "map" ? ("map" as const) : ("list" as const),
  };

  const board = page.board.filter((spot) => matches(spot, filters));
  const tail = filters.brags
    ? []
    : page.tail.filter((spot) => matches(spot, filters));
  const mapSpots = [...board, ...tail];
  const name = cityName(locale, page.city);
  const empty = board.length === 0 && tail.length === 0;

  return (
    <main>
      <section className="relative -mt-16 min-h-[52svh] sm:-mt-[4.5rem]">
        <PhotoFrame src={cityScene(page.city.slug)} className="absolute inset-0" />
        <div className="relative mx-auto flex min-h-[52svh] max-w-6xl flex-col justify-end px-5 pb-10 pt-28 sm:px-8">
          <h1 className="text-shadow-photo font-display text-[clamp(3rem,10vw,7rem)] leading-[0.9] tracking-wide text-white">
            {name}
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Chip
              href={hrefFor(page.city.slug, filters, { open: !filters.open })}
              active={filters.open}
              tone="yolk"
            >
              {t(locale, "openNow")}
            </Chip>
            <Chip
              href={hrefFor(page.city.slug, filters, { brags: !filters.brags })}
              active={filters.brags}
              tone="mint"
            >
              {t(locale, "filterBrags")}
            </Chip>
          </div>
          <Segmented label={t(locale, "viewMode")}>
            <SegmentLink
              href={hrefFor(page.city.slug, filters, { view: "list" })}
              active={filters.view === "list"}
            >
              {t(locale, "viewList")}
            </SegmentLink>
            <SegmentLink
              href={hrefFor(page.city.slug, filters, { view: "map" })}
              active={filters.view === "map"}
            >
              {t(locale, "viewMap")}
            </SegmentLink>
          </Segmented>
        </div>

        <AddSpot locale={locale} citySlug={page.city.slug} />

        {filters.view === "map" ? (
          empty ? (
            <p className="mt-8 text-berry/70">{t(locale, "noSpotsYet")}</p>
          ) : (
            <CityMap spots={mapSpots} />
          )
        ) : (
          <>
            {board.length > 0 ? (
              <section className="mt-12">
                <h2 className="font-display text-3xl tracking-wide">
                  {t(locale, "boardHeading")}
                </h2>
                <ol className="mt-6 grid gap-4 sm:grid-cols-2">
                  {board.map((spot) => (
                    <li key={spot.slug}>
                      <SpotLinkCard
                        href={`/nl/${spot.citySlug}/${spot.slug}`}
                        src={cityScene(spot.citySlug)}
                        title={spot.name}
                        meta={String(spot.score)}
                        rank={spot.rank}
                        stamp={t(locale, "atmosphere")}
                        className="min-h-56"
                      />
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {!filters.brags ? <CityTail locale={locale} tail={tail} /> : null}
          </>
        )}
      </div>
    </main>
  );
}
