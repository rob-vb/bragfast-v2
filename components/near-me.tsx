"use client";

import { useEffect, useMemo, useState } from "react";
import { NL_CITIES } from "@/domain/cities";
import { nearestCity } from "@/domain/geo";
import { parseCitySlug } from "@/domain/ids";
import { t, type Locale } from "@/domain/messages";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    onActiveChange?.(false);
    return () => onActiveChange?.(false);
  }, [onActiveChange]);

  const nearest = useMemo(() => {
    if (!origin) {
      return null;
    }
    const cities = NL_CITIES.map((city) => ({
      slug: parseCitySlug(city.slug),
      geo: { lat: city.lat, lng: city.lng },
      nameNl: city.nameNl,
      nameEn: city.nameEn,
    }));
    return nearestCity(origin, cities);
  }, [origin]);

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
    nearest && (locale === "en" ? nearest.nameEn : nearest.nameNl);

  return (
    <div className="mt-5 max-w-xl">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          aria-busy={asking}
          disabled={asking}
          onClick={ask}
        >
          {t(locale, "nearMe")}
        </Button>
        {nearest || denied ? (
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
      {nearest && nearestName ? (
        <div className="mt-5">
          <p className="text-shadow-photo text-sm font-semibold text-white">
            <span className="font-bold">{t(locale, "nearestCity")} </span>
            <a
              href={`/nl/${nearest.slug}`}
              className="font-bold text-yolk underline-offset-2 hover:underline"
            >
              {nearestName}
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}
