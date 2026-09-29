"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Navigation } from "lucide-react";
import { t, type Locale } from "@/domain/messages";
import { buttonVariants } from "@/components/ui/button";

const SpotMap = dynamic(
  () => import("@/components/spot-map").then((mod) => mod.SpotMap),
  { ssr: false },
);

/**
 * A milk slab holding a map print of the door and the address as its
 * caption. Leaflet only loads once the slab nears the viewport.
 */
export function SpotLocation({
  locale,
  street,
  place,
  geo,
  directionsHref,
}: {
  locale: Locale;
  street: string;
  place: string | null;
  geo: { lat: number; lng: number };
  directionsHref: string;
}) {
  const well = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = well.current;
    if (!el) {
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "320px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const opens = ` (${t(locale, "opensGoogleMaps")})`;

  return (
    <div className="rounded-slab bg-milk p-2">
      <div
        ref={well}
        className="map-well relative aspect-[4/3] overflow-hidden rounded-[1.25rem]"
      >
        <img
          src="/brag_fast_egg.svg"
          alt=""
          width={52}
          height={52}
          className="absolute top-1/2 left-1/2 -translate-1/2 -rotate-8"
        />
        {near ? <SpotMap geo={geo} /> : null}
        {/* The whole map opens the route too, for a thumb that taps it */}
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={-1}
          aria-hidden
          className="absolute inset-0 z-[450]"
        />
        <span className="pointer-events-none absolute inset-0 z-[460] rounded-[inherit] ring-1 ring-berry/10 ring-inset" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-3 pt-3.5 pb-2">
        <address className="min-w-0 not-italic">
          <span className="block font-display text-2xl leading-[1.08] tracking-wide text-balance text-berry">
            {street}
          </span>
          {place ? (
            <span className="mt-1 block text-sm font-semibold text-berry/70">
              {place}
            </span>
          ) : null}
        </address>
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ className: "gap-2 pl-4" })}
        >
          <Navigation aria-hidden className="size-4" strokeWidth={2.5} />
          {t(locale, "directions")}
          <span className="sr-only">{opens}</span>
        </a>
      </div>
    </div>
  );
}
