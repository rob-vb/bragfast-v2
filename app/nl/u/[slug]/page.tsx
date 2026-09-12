import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CityMap } from "@/components/city-map-loader";
import { loadPassport } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { t, uniqueSpotsLabel } from "@/domain/messages";
import {
  PhotoFrame,
  SegmentLink,
  Segmented,
  SpotLinkCard,
} from "@/components/visual";
import { HERO_SCENE, stillFor } from "@/lib/scenes";

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
  const indexable = page.uniqueSpotCount > 0;
  return {
    title: `${page.displayName} · brag.fast`,
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
    return `/nl/u/${slug}?view=map`;
  }
  return `/nl/u/${slug}`;
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
  const page = await loadPassport(slug);
  if (!page) {
    notFound();
  }

  const filters = {
    view: search.view === "map" ? ("map" as const) : ("list" as const),
  };

  return (
    <main>
      <section className="relative -mt-16 min-h-[42svh] sm:-mt-[4.5rem]">
        <PhotoFrame src={HERO_SCENE} className="absolute inset-0" />
        <div className="relative mx-auto flex min-h-[42svh] max-w-6xl flex-col justify-end px-5 pb-10 pt-28 sm:px-8">
          {page.avatarUrl ? (
            <img
              src={page.avatarUrl}
              alt=""
              className="mb-4 size-20 rounded-full object-cover ring-4 ring-yolk"
            />
          ) : null}
          <h1 className="text-shadow-photo font-display text-[clamp(2.4rem,8vw,5.5rem)] leading-[0.92] tracking-wide text-white">
            {page.displayName}
          </h1>
          <p className="text-shadow-photo mt-3 text-lg text-white">
            {uniqueSpotsLabel(locale, page.uniqueSpotCount)}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <Segmented label={t(locale, "viewMode")}>
          <SegmentLink
            href={hrefFor(page.slug, filters, { view: "list" })}
            active={filters.view === "list"}
          >
            {t(locale, "viewList")}
          </SegmentLink>
          <SegmentLink
            href={hrefFor(page.slug, filters, { view: "map" })}
            active={filters.view === "map"}
          >
            {t(locale, "viewMap")}
          </SegmentLink>
        </Segmented>

        {page.spots.length === 0 ? (
          <p className="mt-8 text-berry/70">{t(locale, "passportEmpty")}</p>
        ) : filters.view === "map" ? (
          <div className="mt-8">
            <CityMap spots={page.spots} />
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.spots.map((spot) => (
              <li key={`${spot.citySlug}/${spot.slug}`}>
                <SpotLinkCard
                  href={`/nl/${spot.citySlug}/${spot.slug}`}
                  src={stillFor(spot.slug)}
                  title={spot.name}
                  meta={spot.closed ? t(locale, "closed") : undefined}
                  egg
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
