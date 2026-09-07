"use client";

import { useState } from "react";
import { sortByDistance } from "@/domain/geo";
import { t, type Locale } from "@/domain/messages";
import type { SeedSpotCard } from "@/domain/viewModels";
import { SegmentButton, Segmented, SpotLinkCard } from "@/components/visual";
import { cityScene } from "@/lib/scenes";

export function CityTail({
  locale,
  tail,
}: {
  locale: Locale;
  tail: SeedSpotCard[];
}) {
  const [sort, setSort] = useState<"name" | "distance">("name");
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [denied, setDenied] = useState(false);

  function chooseDistance() {
    if (origin) {
      setSort("distance");
      setDenied(false);
      return;
    }
    if (!navigator.geolocation) {
      setDenied(true);
      setSort("name");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setSort("distance");
        setDenied(false);
      },
      () => {
        setDenied(true);
        setSort("name");
      },
    );
  }

  const ordered =
    sort === "distance" && origin ? sortByDistance(origin, tail) : tail;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl tracking-wide">
          {t(locale, "seedHeading")}
        </h2>
        {tail.length > 0 ? (
          <Segmented label={t(locale, "sortByName")}>
            <SegmentButton
              active={sort === "name"}
              onClick={() => setSort("name")}
            >
              {t(locale, "sortByName")}
            </SegmentButton>
            <SegmentButton active={sort === "distance"} onClick={chooseDistance}>
              {t(locale, "sortByDistance")}
            </SegmentButton>
          </Segmented>
        ) : null}
      </div>
      {denied ? (
        <p className="mt-3 text-sm text-berry/70">{t(locale, "nearMeDenied")}</p>
      ) : null}
      {tail.length === 0 ? (
        <p className="mt-6 text-berry/70">{t(locale, "noSpotsYet")}</p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((spot) => (
            <li key={spot.slug}>
              <SpotLinkCard
                href={`/nl/${spot.citySlug}/${spot.slug}`}
                src={cityScene(spot.citySlug)}
                title={spot.name}
                meta={spot.address}
                stamp={t(locale, "atmosphere")}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
