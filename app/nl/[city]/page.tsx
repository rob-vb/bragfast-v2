import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CitySpots } from "@/components/city-spots";
import { EggEmpty } from "@/components/egg-empty";
import { PageHero, PageHeroPoster } from "@/components/page-hero";
import { loadCityPage, publicSiteUrl } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { SITE_NAME, pageMetadata } from "@/lib/seo";
import {
  cityMetaDescription,
  cityMetaTitle,
  t,
  uniqueSpotsLabel,
  type Locale,
} from "@/domain/messages";
import { canonicalCitySlug } from "@/domain/cities";
import {
  breadcrumbJsonLd,
  itemListJsonLd,
  jsonLdGraph,
  jsonLdScript,
} from "@/domain/jsonld";

type Params = { city: string };
type Search = {
  view?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city } = await params;
  const canonical = canonicalCitySlug(city);
  if (canonical && canonical !== city) {
    redirect(`/nl/${canonical}`);
  }
  const board = await loadCityPage(city);
  if (!board) {
    return {};
  }
  const locale = await getLocale();
  const name = cityName(locale, board.city);
  const count = board.kind === "empty" ? 0 : board.spots.length;
  return {
    ...pageMetadata(locale, {
      title: cityMetaTitle(locale, name),
      description: cityMetaDescription(locale, name, count),
      path: `/nl/${board.city.slug}`,
    }),
    // Search still finds an empty board; it is indexed from its first spot
    ...(board.kind === "empty" ? { robots: { index: false, follow: true } } : {}),
  };
}

function cityName(
  locale: Locale,
  city: { nameNl: string; nameEn: string },
): string {
  return locale === "en" ? city.nameEn : city.nameNl;
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
  const canonical = canonicalCitySlug(city);
  if (canonical && canonical !== city) {
    redirect(`/nl/${canonical}`);
  }
  const board = await loadCityPage(city);
  if (!board) {
    notFound();
  }

  const name = cityName(locale, board.city);
  const origin = publicSiteUrl();
  const boardUrl = `${origin}/nl/${board.city.slug}`;
  // An empty board is noindex; it has nothing to describe
  const jsonLd =
    board.kind === "empty"
      ? null
      : jsonLdGraph([
          itemListJsonLd({
            name: cityMetaTitle(locale, name),
            url: boardUrl,
            order: "ranked",
            items: board.spots.map((spot) => ({
              name: spot.name,
              url: `${origin}/nl/${spot.citySlug}/${spot.slug}`,
            })),
          }),
          breadcrumbJsonLd([
            { name: SITE_NAME, url: `${origin}/` },
            { name: t(locale, "townIndex"), url: `${origin}/nl/steden` },
            { name, url: boardUrl },
          ]),
        ]);

  return (
    <main>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
        />
      ) : null}
      <PageHero size="poster" edge="scallop">
        <PageHeroPoster>{name}</PageHeroPoster>
        {board.kind === "empty" ? null : (
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-7">
            <p className="sticker w-fit -rotate-3 rounded-full bg-yolk px-4 py-1.5 text-base font-extrabold text-berry tabular-nums">
              {uniqueSpotsLabel(locale, board.spots.length)}
            </p>
            <p className="text-lg font-semibold text-milk sm:text-xl">
              {t(locale, "cityBoardLead")}
            </p>
          </div>
        )}
      </PageHero>

      <div className="mx-auto w-full max-w-6xl px-5 pb-14 pt-14 sm:px-8 sm:pb-20 sm:pt-16">
        {board.kind === "empty" ? (
          <EggEmpty
            title={t(locale, "noSpotsYet")}
            description={t(locale, "emptyBoardAppHint")}
          />
        ) : (
          <CitySpots
            locale={locale}
            citySlug={board.city.slug}
            spots={board.spots}
            view={search.view === "map" ? "map" : "list"}
          />
        )}
      </div>
    </main>
  );
}
