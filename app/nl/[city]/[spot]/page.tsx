import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { foodEstablishmentJsonLd } from "@/domain/jsonld";
import { canonicalCitySlug } from "@/domain/cities";
import {
  moreInCity,
  seeAllInCity,
  t,
  uniqueSpotsLabel,
  type Locale,
} from "@/domain/messages";
import { loadCityPage, loadSpotPage, publicSiteUrl } from "@/lib/catalog";
import { getLocale } from "@/lib/i18n";
import { SpotShare } from "@/components/spot-share";
import { LikeButton } from "@/components/like-button";
import { SpotPhotos } from "@/components/spot-photos";
import { SpotLocation } from "@/components/spot-location";
import { PrintGlow, SpotPrint } from "@/components/spot-print";
import { PageHero, PageHeroPoster } from "@/components/page-hero";
import { SpotLinkCard } from "@/components/visual";
import { cn } from "@/lib/utils";

type Params = { city: string; spot: string };

/** The board's first prints fanned on the tile that leads back to it. */
function BoardFan({ photos }: { photos: string[] }) {
  const mid = (photos.length - 1) / 2;
  return (
    <span aria-hidden className="board-fan">
      {photos.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          style={
            {
              "--x": i - mid,
              zIndex: photos.length - Math.abs(i - mid) * 2,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}

/** At most this many neighbours, then the tile back to the board. */
const MORE_IN_CITY = 2;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city, spot } = await params;
  const canonical = canonicalCitySlug(city);
  if (canonical && canonical !== city) {
    redirect(`/nl/${canonical}/${spot}`);
  }
  const page = await loadSpotPage(city, spot);
  if (!page) {
    return { title: "brag.fast" };
  }
  const { street, place } = addressLines(page.address);
  const description = place ? `${street}, ${place}` : street;
  const image = page.licensedImage?.url;
  return {
    title: `${page.name} · brag.fast`,
    description,
    openGraph: {
      title: page.name,
      description,
      url: `${publicSiteUrl()}${page.canonicalPath}`,
      siteName: "brag.fast",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary" },
  };
}

function cityName(locale: Locale, city: { nameNl: string; nameEn: string }): string {
  return locale === "en" ? city.nameEn : city.nameNl;
}

/**
 * "Grootestraat 13, 7571 EJ Oldenzaal, Nederland" →
 * { street: "Grootestraat 13", place: "7571 EJ Oldenzaal" }.
 * Every spot is Dutch, so the country line is noise.
 */
function addressLines(address: string): { street: string; place: string | null } {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 1 && /^(nederland|netherlands|the netherlands)$/i.test(parts.at(-1)!)) {
    parts.pop();
  }
  const [street = address, ...rest] = parts;
  return { street, place: rest.length > 0 ? rest.join(", ") : null };
}

function directionsUrl(name: string, address: string): string {
  const destination = encodeURIComponent(`${name}, ${address}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

export default async function SpotPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { city, spot } = await params;
  const canonical = canonicalCitySlug(city);
  if (canonical && canonical !== city) {
    redirect(`/nl/${canonical}/${spot}`);
  }
  const [locale, page] = await Promise.all([getLocale(), loadSpotPage(city, spot)]);
  if (!page) {
    notFound();
  }
  const board = await loadCityPage(page.city.slug);
  const neighbours =
    board?.kind === "listed"
      ? board.spots.filter((row) => row.slug !== page.slug)
      : [];
  const more = neighbours.slice(0, MORE_IN_CITY);

  const name = cityName(locale, page.city);
  const jsonLd = foodEstablishmentJsonLd({
    name: page.name,
    address: page.address,
    cityName: name,
    geo: page.geo,
    hours: page.hours,
    spotType: page.spotType,
    url: `${publicSiteUrl()}${page.canonicalPath}`,
    image: page.licensedImage,
  });
  const closed = page.lifecycle.kind === "gravestone";
  const hero = page.licensedImage?.url ?? null;
  const { street, place } = addressLines(page.address);
  const directions = directionsUrl(page.name, page.address);
  const boardHref = `/nl/${page.city.slug}`;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero
        size="spot"
        className="z-10"
        backdrop={hero ? <PrintGlow src={hero} /> : null}
      >
        <div className="grid items-end gap-y-10 lg:grid-cols-12 lg:gap-x-12">
          <div className="@container lg:col-span-7 lg:pb-2">
            <Link
              href={boardHref}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/12 pr-4 pl-2.5 text-sm font-bold text-milk transition-[background-color,transform] duration-press ease-out-strong active:scale-[0.97] pointer-fine:hover:bg-white/20"
            >
              <ArrowLeft aria-hidden className="size-4" strokeWidth={2.5} />
              <span className="sr-only">{t(locale, "backToCity")} </span>
              {name}
            </Link>
            <div className="mt-6 sm:mt-8">
              <PageHeroPoster fit="spot">{page.name}</PageHeroPoster>
            </div>
            <p className="mt-4 flex items-start gap-2 text-lg font-semibold text-milk sm:mt-5 sm:text-xl">
              <MapPin
                aria-hidden
                className="mt-1 size-5 shrink-0 text-candy"
                strokeWidth={2.5}
              />
              <span>
                {street}
                {place ? `, ${place}` : null}
              </span>
            </p>
            {closed ? (
              <p className="sticker mt-5 w-fit -rotate-2 rounded-full bg-candy px-4 py-1.5 font-extrabold text-berry">
                {t(locale, "closed")}
              </p>
            ) : null}
            <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-8">
              <LikeButton
                locale={locale}
                spotId={page.id}
                likeCount={page.likeCount}
                size="lg"
              />
              <SpotShare
                locale={locale}
                url={`${publicSiteUrl()}${page.canonicalPath}`}
                name={page.name}
              />
            </div>
          </div>
          {hero ? (
            <div className="-mb-[8.5rem] sm:mx-auto sm:w-4/5 lg:col-span-5 lg:mx-0 lg:-mb-[12rem] lg:w-auto">
              <SpotPrint
                locale={locale}
                src={hero}
                alt={page.name}
                adderSlug={page.adderSlug}
                addedAt={page.addedAt}
                closed={closed}
              />
            </div>
          ) : null}
        </div>
      </PageHero>

      <div
        className={cn(
          "mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24",
          hero ? "pt-[9rem] lg:pt-16" : "pt-12 sm:pt-16",
        )}
      >
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-x-12">
          <div className="lg:col-span-7">
            <SpotPhotos locale={locale} name={page.name} photos={page.photos} />
          </div>
          <section
            aria-labelledby="where-heading"
            className={cn("lg:col-span-5", hero && "lg:pt-[9.5rem]")}
          >
            <h2
              id="where-heading"
              className="font-display text-3xl tracking-wide text-berry sm:text-4xl"
            >
              {t(locale, "gettingThere")}
            </h2>
            <div className="mt-6">
              <SpotLocation
                locale={locale}
                street={street}
                place={place}
                geo={page.geo}
                directionsHref={directions}
              />
            </div>
          </section>
        </div>

        {more.length > 0 && board?.kind === "listed" ? (
          <section aria-labelledby="more-heading" className="mt-20 sm:mt-28">
            <h2
              id="more-heading"
              className="font-display text-3xl tracking-wide text-berry sm:text-4xl"
            >
              {moreInCity(locale, name)}
            </h2>
            <ul
              className={cn(
                "mt-6 grid gap-4 sm:grid-cols-2 lg:gap-5",
                more.length > 1 && "lg:grid-cols-3",
              )}
            >
              {more.map((row) => (
                <li key={row.slug}>
                  <SpotLinkCard
                    href={`/nl/${row.citySlug}/${row.slug}`}
                    src={row.photoUrl}
                    title={row.name}
                    meta={addressLines(row.address).street}
                    action={
                      <LikeButton
                        locale={locale}
                        spotId={row.id}
                        likeCount={row.likeCount}
                      />
                    }
                  />
                </li>
              ))}
              <li>
                <Link
                  href={boardHref}
                  className="group/board @container relative flex h-full min-h-80 flex-col justify-end overflow-hidden rounded-slab bg-berry p-6 text-white transition-[translate,scale,box-shadow] duration-300 ease-out-strong active:scale-[0.985] sm:p-7 pointer-fine:hover:-translate-y-1 pointer-fine:hover:shadow-lift"
                >
                  <BoardFan photos={board.spots.slice(0, 3).map((row) => row.photoUrl)} />
                  <span className="relative flex items-end justify-between gap-4">
                    <span>
                      <span className="sticker mb-4 block w-fit -rotate-3 rounded-full bg-yolk px-4 py-1.5 text-base font-extrabold text-berry tabular-nums">
                        {uniqueSpotsLabel(locale, board.spots.length)}
                      </span>
                      <span className="block font-display text-3xl leading-[1.02] tracking-wide text-balance @[22rem]:text-4xl">
                        {seeAllInCity(locale, name)}
                      </span>
                    </span>
                    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-blush text-white transition-transform duration-300 ease-out-strong pointer-fine:group-hover/board:translate-x-1">
                      <ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />
                    </span>
                  </span>
                </Link>
              </li>
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
