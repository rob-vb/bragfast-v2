"use client";

import { useMemo, useState } from "react";
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

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Select
            items={keyItems}
            value={sort.key}
            onValueChange={(value) => {
              if (value) {
                setSort(parseCityBoardSort(value, sort.dir));
              }
            }}
          >
            <SelectTrigger size="sm" aria-label={t(locale, "sortKey")}>
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
                setSort(parseCityBoardSort(sort.key, value));
              }
            }}
          >
            <SelectTrigger size="sm" aria-label={t(locale, "sortDir")}>
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
        <Segmented label={t(locale, "viewMode")}>
          <SegmentLink href={listHref} active={view === "list"}>
            {t(locale, "viewList")}
          </SegmentLink>
          <SegmentLink href={mapHref} active={view === "map"}>
            {t(locale, "viewMap")}
          </SegmentLink>
        </Segmented>
      </div>
      {view === "map" ? (
        <div className="mt-8">
          <CityMap spots={spots} />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((spot) => (
            <li key={spot.slug}>
              <SpotLinkCard
                href={`/nl/${spot.citySlug}/${spot.slug}`}
                src={spot.photoUrl}
                title={spot.name}
                meta={spot.address}
                action={
                  <LikeButton
                    locale={locale}
                    spotId={spot.id}
                    likeCount={spot.likeCount}
                  />
                }
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
