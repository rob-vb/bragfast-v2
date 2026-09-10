"use client";

import { useState } from "react";
import { sortByDistance } from "@/domain/geo";
import { t, type Locale } from "@/domain/messages";
import type { CitySpotCard } from "@/domain/viewModels";
import { SegmentButton, Segmented, SpotLinkCard } from "@/components/visual";
import { stillFor } from "@/lib/scenes";

export function CitySpots({
  locale,
  spots,
}: {
  locale: Locale;
  spots: CitySpotCard[];
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
    sort === "distance" && origin ? sortByDistance(origin, spots) : spots;

  if (spots.length === 0) {
    return <p className="mt-8 text-berry/70">{t(locale, "noSpotsYet")}</p>;
  }

  return (
    <section className="mt-8">
      <div className="flex justify-end">
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
      </div>
      {denied ? (
        <p className="mt-3 text-sm text-berry/70">{t(locale, "nearMeDenied")}</p>
      ) : null}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((spot) => (
          <li key={spot.slug}>
            <SpotLinkCard
              href={`/nl/${spot.citySlug}/${spot.slug}`}
              src={stillFor(spot.slug)}
              title={spot.name}
              meta={spot.address}
              egg={spot.bragged !== null}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
