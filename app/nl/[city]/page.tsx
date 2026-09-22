import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CitySpots } from "@/components/city-spots";
import { EmptyCityBoard } from "@/components/empty-city-board";
import { PageHero, PageHeroTitle } from "@/components/page-hero";
import { loadCityPage } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import type { Locale } from "@/domain/messages";
import { canonicalCitySlug } from "@/domain/cities";

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
    return { title: "brag.fast" };
  }
  const locale = await getLocale();
  const name = locale === "en" ? board.city.nameEn : board.city.nameNl;
  return { title: `${name} · brag.fast` };
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

  return (
    <main>
      <PageHero size="city">
        <PageHeroTitle size="lg">{name}</PageHeroTitle>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        {board.kind === "empty" ? (
          <EmptyCityBoard locale={locale} />
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
