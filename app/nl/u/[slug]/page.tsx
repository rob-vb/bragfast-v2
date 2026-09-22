import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { CityMap } from "@/components/city-map-loader";
import { BoardEmpty } from "@/components/board-empty";
import { PageHero, PageHeroLead, PageHeroTitle } from "@/components/page-hero";
import { loadPassport } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { t, uniqueSpotsLabel } from "@/domain/messages";
import { SegmentLink, Segmented, SpotLinkCard } from "@/components/visual";
import { stillFor } from "@/lib/scenes";

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
    title: `${page.slug} · brag.fast`,
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
      <PageHero>
        <PageHeroTitle>{page.slug}</PageHeroTitle>
        <PageHeroLead>{uniqueSpotsLabel(locale, page.uniqueSpotCount)}</PageHeroLead>
      </PageHero>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        {page.spots.length === 0 ? (
          <BoardEmpty icon={<MapPin />} title={t(locale, "passportEmpty")} />
        ) : (
          <>
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

            {filters.view === "map" ? (
              <div className="mt-8">
                <CityMap spots={page.spots} />
              </div>
            ) : (
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {page.spots.map((spot) => (
                  <li key={`${spot.citySlug}/${spot.slug}`}>
                    <SpotLinkCard
                      href={`/nl/${spot.citySlug}/${spot.slug}`}
                      src={spot.photoUrl ?? stillFor(spot.slug)}
                      title={spot.name}
                      meta={spot.closed ? t(locale, "closed") : undefined}
                    />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}
