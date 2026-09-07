"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { t, type Locale } from "@/domain/messages";
import { Button } from "@/components/ui/button";
import { SpotLinkCard } from "@/components/visual";
import { cityScene } from "@/lib/scenes";

const NEARBY_CAP = 3;

export function NearMe({
  locale,
  onActiveChange,
}: {
  locale: Locale;
  onActiveChange?: (active: boolean) => void;
}) {
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [denied, setDenied] = useState(false);
  const [asking, setAsking] = useState(false);
  const nearby = useQuery(
    api.catalog.nearby,
    origin ? { lat: origin.lat, lng: origin.lng } : "skip",
  );

  const loading = Boolean(origin) && nearby === undefined;
  const spots = nearby?.spots.slice(0, NEARBY_CAP) ?? [];
  const active = spots.length > 0;

  useEffect(() => {
    onActiveChange?.(active);
    return () => onActiveChange?.(false);
  }, [active, onActiveChange]);

  function ask() {
    if (!navigator.geolocation) {
      setDenied(true);
      setAsking(false);
      return;
    }
    setDenied(false);
    setAsking(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAsking(false);
        setOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setAsking(false);
        setOrigin(null);
        setDenied(true);
      },
    );
  }

  function dismiss() {
    setOrigin(null);
    setDenied(false);
    setAsking(false);
  }

  const nearestName =
    nearby?.nearestCity &&
    (locale === "en" ? nearby.nearestCity.nameEn : nearby.nearestCity.nameNl);
  const busy = asking || loading;

  return (
    <div className="mt-5 max-w-xl">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          aria-busy={busy}
          disabled={busy}
          onClick={ask}
        >
          {t(locale, "nearMe")}
        </Button>
        {active || denied ? (
          <Button
            type="button"
            variant="ghost"
            className="text-white hover:bg-white/20 hover:text-white"
            onClick={dismiss}
          >
            {t(locale, "nearMeDismiss")}
          </Button>
        ) : null}
      </div>
      {asking ? (
        <p className="text-shadow-photo mt-3 text-sm font-semibold text-white" aria-live="polite">
          {t(locale, "nearMePending")}
        </p>
      ) : null}
      {loading ? (
        <p className="text-shadow-photo mt-3 text-sm font-semibold text-white" aria-live="polite">
          {t(locale, "nearMeLoading")}
        </p>
      ) : null}
      {denied ? (
        <p className="text-shadow-photo mt-3 text-sm font-semibold text-white" role="status">
          {t(locale, "nearMeDenied")}{" "}
          <button
            type="button"
            className="font-bold text-yolk underline-offset-2 hover:underline"
            onClick={ask}
          >
            {t(locale, "nearMeRetry")}
          </button>
        </p>
      ) : null}
      {nearby ? (
        <div className="mt-5">
          {nearby.nearestCity && nearestName ? (
            <p className="text-shadow-photo text-sm font-semibold text-white">
              <span className="font-bold">{t(locale, "nearestCity")} </span>
              <a
                href={`/nl/${nearby.nearestCity.slug}`}
                className="font-bold text-yolk underline-offset-2 hover:underline"
              >
                {nearestName}
              </a>
            </p>
          ) : null}
          {spots.length > 0 ? (
            <>
              <h2 className="text-shadow-photo mt-5 font-display text-xl tracking-wide text-white">
                {t(locale, "nearbySpots")}
              </h2>
              <ul className="mt-3 grid gap-3">
                {spots.map((spot) => {
                  const cityName =
                    locale === "en" ? spot.cityNameEn : spot.cityNameNl;
                  return (
                    <li key={`${spot.citySlug}-${spot.slug}`}>
                      <SpotLinkCard
                        href={`/nl/${spot.citySlug}/${spot.slug}`}
                        src={cityScene(spot.citySlug)}
                        title={spot.name}
                        meta={cityName}
                        stamp={t(locale, "atmosphere")}
                        className="min-h-36"
                      />
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
