"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { LayoutGrid, MapIcon } from "lucide-react";
import {
  applyCityBoardSort,
  DEFAULT_CITY_BOARD_SORT,
  parseCityBoardSort,
  type CityBoardSort,
} from "@/domain/like";
import { t, type Locale } from "@/domain/messages";
import type { CitySlug } from "@/domain/ids";
import type { CitySpotCard } from "@/domain/viewModels";
import { CityMap } from "@/components/city-map-loader";
import { LikeButton } from "@/components/like-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SegmentLink, Segmented, SpotLinkCard } from "@/components/visual";
import { cn } from "@/lib/utils";

/** "Grootestraat 13, 7571 EJ Oldenzaal, Nederland" → "Grootestraat 13" */
function streetLine(address: string): string {
  return address.split(",")[0]?.trim() || address;
}

/** Glide cards to their new places where the browser can. */
function withViewTransition(update: () => void) {
  if (
    typeof document.startViewTransition !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}

export function CitySpots({
  locale,
  citySlug,
  spots,
  view,
}: {
  locale: Locale;
  citySlug: CitySlug;
  spots: readonly [CitySpotCard, ...CitySpotCard[]];
  view: "list" | "map";
}) {
  const [sort, setSort] = useState<CityBoardSort>(DEFAULT_CITY_BOARD_SORT);
  const collator = useMemo(
    () => new Intl.Collator(locale === "en" ? "en" : "nl", { sensitivity: "base" }),
    [locale],
  );
  const ordered = applyCityBoardSort(spots, sort, collator);
  const listHref = `/nl/${citySlug}`;
  const mapHref = `/nl/${citySlug}?view=map`;
  const keyItems = [
    { value: "likes", label: t(locale, "sortByLikes") },
    { value: "name", label: t(locale, "sortByName") },
  ];
  const dirItems = [
    { value: "desc", label: t(locale, "sortDirDesc") },
    { value: "asc", label: t(locale, "sortDirAsc") },
  ];

  // The most liked spot gets the big print, but only on the likes board and
  // only once it has earned a like; otherwise every print is the same size.
  const featured =
    sort.key === "likes" && sort.dir === "desc" && ordered[0].likeCount > 0;
  const alone = ordered.length === 1;

  function changeSort(next: CityBoardSort) {
    withViewTransition(() => setSort(next));
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        {view === "list" ? (
          <div className="flex min-w-0 gap-2">
            <Select
              items={keyItems}
              value={sort.key}
              onValueChange={(value) => {
                if (value) {
                  changeSort(parseCityBoardSort(value, sort.dir));
                }
              }}
            >
              <SelectTrigger aria-label={t(locale, "sortKey")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {keyItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              items={dirItems}
              value={sort.dir}
              onValueChange={(value) => {
                if (value) {
                  changeSort(parseCityBoardSort(sort.key, value));
                }
              }}
            >
              <SelectTrigger aria-label={t(locale, "sortDir")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dirItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <Segmented label={t(locale, "viewMode")} className="ml-auto shrink-0">
          <SegmentLink href={listHref} active={view === "list"}>
            <LayoutGrid aria-hidden className="size-4" strokeWidth={2.5} />
            <span className="max-sm:sr-only">{t(locale, "viewList")}</span>
          </SegmentLink>
          <SegmentLink href={mapHref} active={view === "map"}>
            <MapIcon aria-hidden className="size-4" strokeWidth={2.5} />
            <span className="max-sm:sr-only">{t(locale, "viewMap")}</span>
          </SegmentLink>
        </Segmented>
      </div>
      {view === "map" ? (
        <div className="mt-6">
          <CityMap locale={locale} spots={spots} />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {ordered.map((spot, index) => {
            const big = featured && index === 0;
            return (
              <li
                key={spot.slug}
                style={{ viewTransitionName: `spot-${spot.slug}` } as CSSProperties}
                className={cn(
                  big && "sm:col-span-2",
                  big && ordered.length > 2 && "lg:row-span-2",
                )}
              >
                <SpotLinkCard
                  href={`/nl/${spot.citySlug}/${spot.slug}`}
                  src={spot.photoUrl}
                  title={spot.name}
                  meta={streetLine(spot.address)}
                  heading="h2"
                  featured={big}
                  eager={index < 3}
                  className={
                    big
                      ? cn(
                          "sm:aspect-[16/9]",
                          !alone && "lg:aspect-auto lg:min-h-56 lg:flex-1",
                        )
                      : undefined
                  }
                  action={
                    <LikeButton
                      locale={locale}
                      spotId={spot.id}
                      likeCount={spot.likeCount}
                    />
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
