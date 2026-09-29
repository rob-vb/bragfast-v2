"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { NL_CITIES } from "@/domain/cities";
import { woonplaatsSuggest } from "@/domain/searchMatch";
import type { Locale } from "@/domain/messages";
import { SearchBox } from "@/components/search-box";
import { useSeen } from "@/components/stage";

// Every woonplaats at its own lat/lng, in a plain equirectangular frame
// squeezed by cos(52°) so the country keeps its shape.
const WEST = 3.33;
const NORTH = 53.54;
const SOUTH = 50.74;
const SQUEEZE = Math.cos((52.15 * Math.PI) / 180);
const SCALE = 1000 / ((7.22 - WEST) * SQUEEZE);
const WIDTH = 1000;
const HEIGHT = Math.round((NORTH - SOUTH) * SCALE);
const BANDS = 8;

type Point = { x: number; y: number; nameNl: string; nameEn: string };

const POINTS = new Map<string, Point>(
  NL_CITIES.map((city) => [
    city.slug,
    {
      x: Math.round((city.lng - WEST) * SQUEEZE * SCALE),
      y: Math.round((NORTH - city.lat) * SCALE),
      nameNl: city.nameNl,
      nameEn: city.nameEn,
    },
  ]),
);

function dots(points: Iterable<Point>) {
  let d = "";
  for (const p of points) {
    d += `M${p.x} ${p.y}h0`;
  }
  return d;
}

// Bands run north to south; the south lands first
const BAND_PATHS = Array.from({ length: BANDS }, (_, band) =>
  dots(
    [...POINTS.values()].filter(
      (p) => Math.min(BANDS - 1, Math.floor((p.y / HEIGHT) * BANDS)) === band,
    ),
  ),
);

/** While nobody types, the pin tours a few boards, big and small. */
const TOUR = ["giethoorn", "den-haag", "hindeloopen", "maastricht", "groningen", "zierikzee", "den-burg", "haarlem"];
const TOUR_MS = 2600;

/**
 * The Zoek poster's working half: the real search pill beside a map of every
 * woonplaats. What you type lights up on the map.
 */
export function TownSearch({
  locale,
  mapLabel,
  count,
  children,
  note,
}: {
  locale: Locale;
  mapLabel: string;
  count: string;
  children: ReactNode;
  note: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const seen = useSeen(mapRef, 0.4);
  const [query, setQuery] = useState("");
  const [tour, setTour] = useState(0);

  const suggest = woonplaatsSuggest(query);
  const typing = query.trim().length > 0;

  useEffect(() => {
    if (!seen || typing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = window.setInterval(() => setTour((n) => (n + 1) % TOUR.length), TOUR_MS);
    return () => window.clearInterval(id);
  }, [seen, typing]);

  const hitPath = useMemo(() => {
    if (suggest.kind !== "list") {
      return "";
    }
    return dots(
      suggest.hits.flatMap((hit) => {
        const p = POINTS.get(hit.slug);
        return p ? [p] : [];
      }),
    );
  }, [suggest]);

  const pinSlug = typing
    ? suggest.kind === "list"
      ? suggest.active.slug
      : null
    : TOUR[tour];
  const pin = pinSlug ? POINTS.get(pinSlug) : undefined;
  const pinName = pin ? (locale === "en" ? pin.nameEn : pin.nameNl) : "";

  return (
    <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-x-12">
      <div className="lg:col-span-5 lg:self-center">
        {children}
        <SearchBox locale={locale} onQueryChange={setQuery} />
        <p className="mt-4 pl-5 text-sm font-bold text-berry/70">{note}</p>
      </div>

      <div className="relative mx-auto w-full max-w-md lg:col-span-6 lg:col-start-7 lg:-mt-12 lg:max-w-none">
        <p className="sticker absolute top-[6%] left-0 z-10 -rotate-3 rounded-full bg-yolk px-4 py-2 font-display text-lg tracking-wide text-berry tabular-nums sm:text-xl">
          {count}
        </p>
        <div
          ref={mapRef}
          role="img"
          aria-label={mapLabel}
          className="relative"
          style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
        >
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            aria-hidden
            className="absolute inset-0 size-full overflow-visible"
          >
            <g
              fill="none"
              strokeLinecap="round"
              strokeWidth="8"
              className="stroke-berry/35 transition-[stroke] duration-500 ease-out-strong"
              style={typing && hitPath ? { stroke: "rgb(74 21 52 / 0.16)" } : undefined}
            >
              {BAND_PATHS.map((d, band) => (
                <path
                  key={band}
                  d={d}
                  className="town-band"
                  style={{ "--band": BANDS - 1 - band } as CSSProperties}
                />
              ))}
            </g>
            {hitPath ? (
              <path
                d={hitPath}
                fill="none"
                strokeLinecap="round"
                strokeWidth="13"
                className="stroke-blush"
              />
            ) : null}
          </svg>

          {pin ? (
            <div
              aria-hidden
              className="town-pin absolute"
              style={{ left: `${(pin.x / WIDTH) * 100}%`, top: `${(pin.y / HEIGHT) * 100}%` }}
            >
              <span className="town-pin__ring absolute inset-0 rounded-full bg-blush/45" />
              <span className="relative block size-4 rounded-full bg-yolk shadow-[0_0_0_3px_#fff,0_4px_10px_rgb(22_4_14/0.35)]" />
              <span
                key={pinSlug}
                className="town-label absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2 rounded-full bg-berry px-3 py-1.5 text-sm font-extrabold whitespace-nowrap text-white shadow-[0_6px_14px_rgb(74_21_52/0.22)]"
              >
                {pinName}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
