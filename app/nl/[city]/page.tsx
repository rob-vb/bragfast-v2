import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CitySpots } from "@/components/city-spots";
import { AddSpot } from "@/components/add-spot";
import { loadCityPage } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { t } from "@/domain/messages";
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
  const page = await loadCityPage(city);
  if (!page) {
    notFound();
  }

  const view = search.view === "map" ? ("map" as const) : ("list" as const);
  const name = cityName(locale, page.city);

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
        {page.spots.length === 0 ? (
          <>
            <p className="mt-8 text-berry/70">{t(locale, "noSpotsYet")}</p>
            <AddSpot locale={locale} />
          </>
        ) : (
          <CitySpots
            locale={locale}
            citySlug={page.city.slug}
            spots={page.spots}
            view={view}
          />
        )}
      </div>
    </main>
  );
}
