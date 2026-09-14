import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CitySpots } from "@/components/city-spots";
import { EmptyCityBoard } from "@/components/empty-city-board";
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
      <section className="relative -mt-16 min-h-[52svh] bg-berry sm:-mt-[4.5rem]">
        <div className="relative mx-auto flex min-h-[52svh] max-w-6xl flex-col justify-end px-5 pb-10 pt-28 sm:px-8">
          <h1 className="font-display text-[clamp(3rem,10vw,7rem)] leading-[0.9] tracking-wide text-white">
            {name}
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
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
