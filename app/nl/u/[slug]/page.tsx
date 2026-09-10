import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CityMap } from "@/components/city-map-loader";
import { loadPassport } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import {
  postsThisWeekLabel,
  t,
  uniqueSpotsLabel,
  type Locale,
} from "@/domain/messages";
import {
  PhotoFrame,
  SegmentLink,
  Segmented,
  SpotLinkCard,
} from "@/components/visual";
import { HERO_SCENE, stillFor } from "@/lib/scenes";

type Params = { slug: string };
type Search = {
  tab?: string;
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
  current: { tab: "spots" | "week"; view: "list" | "map" },
  patch: Partial<typeof current>,
): string {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  if (next.tab === "week") {
    params.set("tab", "week");
  }
  if (next.view === "map") {
    params.set("view", "map");
  }
  const query = params.toString();
  return query ? `/nl/u/${slug}?${query}` : `/nl/u/${slug}`;
}

function weekDate(locale: Locale, createdAt: number): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "nl-NL", {
    dateStyle: "medium",
  }).format(new Date(createdAt));
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
    tab: search.tab === "week" ? ("week" as const) : ("spots" as const),
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
          <p className="text-shadow-photo mt-1 text-lg text-white">
            {postsThisWeekLabel(locale, page.postsThisWeek)}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented label={t(locale, "passportSpots")}>
            <SegmentLink
              href={hrefFor(page.slug, filters, { tab: "spots" })}
              active={filters.tab === "spots"}
            >
              {t(locale, "passportSpots")}
            </SegmentLink>
            <SegmentLink
              href={hrefFor(page.slug, filters, { tab: "week" })}
              active={filters.tab === "week"}
            >
              {t(locale, "passportWeek")}
            </SegmentLink>
          </Segmented>
          {filters.tab === "spots" ? (
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
          ) : null}
        </div>

        {filters.tab === "week" ? (
          page.weekPosts.length === 0 ? (
            <p className="mt-8 text-berry/70">{t(locale, "thisWeekEmpty")}</p>
          ) : (
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {page.weekPosts.map((post) => (
                <li key={post.postId}>
                  <SpotLinkCard
                    href={`/nl/${post.citySlug}/${post.spotSlug}`}
                    src={stillFor(post.spotSlug)}
                    title={post.name}
                    meta={weekDate(locale, post.createdAt)}
                    egg
                  />
                </li>
              ))}
            </ul>
          )
        ) : filters.view === "map" ? (
          page.spots.length === 0 ? (
            <p className="mt-8 text-berry/70">{t(locale, "passportEmpty")}</p>
          ) : (
            <CityMap spots={page.spots} />
          )
        ) : page.spots.length === 0 ? (
          <p className="mt-8 text-berry/70">{t(locale, "passportEmpty")}</p>
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
