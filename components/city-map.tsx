"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import L from "leaflet";
import { likeCountLabel, t, type Locale } from "@/domain/messages";

export type MapSpot = {
  slug: string;
  citySlug: string;
  name: string;
  geo: { lat: number; lng: number };
  photoUrl: string;
  address?: string;
  likeCount?: number;
  closed?: boolean;
};

const EGG = 40;

export function CityMap({
  locale,
  spots,
}: {
  locale: Locale;
  spots: readonly MapSpot[];
}) {
  const root = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const el = root.current;
    if (!el) {
      return;
    }

    const map = L.map(el, { scrollWheelZoom: false });
    map.attributionControl.setPrefix(
      '<a href="https://leafletjs.com">Leaflet</a>',
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    const points: L.LatLngExpression[] = [];
    spots.forEach((spot, index) => {
      const latlng: L.LatLngExpression = [spot.geo.lat, spot.geo.lng];
      points.push(latlng);
      const marker = L.marker(latlng, {
        icon: eggIcon(spot, index),
        riseOnHover: true,
        keyboard: true,
      }).addTo(map);

      marker.bindTooltip(escapeHtml(spot.name), {
        direction: "top",
        offset: [0, -EGG / 2],
        className: "spot-tip",
        opacity: 1,
      });
      marker.bindPopup(() => spotCard(spot, locale, router.push), {
        className: "spot-popup",
        closeButton: false,
        minWidth: 240,
        maxWidth: 240,
        offset: [0, -EGG / 2 + 4],
        autoPanPadding: [24, 24],
      });

      marker.getElement()?.setAttribute("aria-label", spot.name);
      marker.on("tooltipopen", () => {
        if (marker.isPopupOpen()) {
          marker.closeTooltip();
        }
      });
      marker.on("popupopen", () => {
        marker.closeTooltip();
        marker.setZIndexOffset(1000);
        marker.getElement()?.classList.add("is-active");
      });
      marker.on("popupclose", () => {
        marker.setZIndexOffset(0);
        marker.getElement()?.classList.remove("is-active");
      });
    });

    if (points.length === 1) {
      map.setView(points[0], 15);
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 16 });
    } else {
      map.setView([52.381, 4.637], 13);
    }

    return () => {
      map.remove();
    };
  }, [spots, locale, router]);

  return (
    <div
      ref={root}
      className="spot-map h-[min(34rem,72svh)] overflow-hidden rounded-slab outline outline-1 -outline-offset-1 outline-berry/12"
    />
  );
}

function eggIcon(spot: MapSpot, index: number): L.DivIcon {
  const tilt = tiltFor(spot.slug);
  const delay = Math.min(index * 45, 540);
  return L.divIcon({
    className: spot.closed ? "spot-egg is-closed" : "spot-egg",
    html: `<img src="/brag_fast_egg.svg" alt="" width="${EGG}" height="${EGG}" draggable="false" style="--tilt:${tilt}deg;--delay:${delay}ms" />`,
    iconSize: [EGG, EGG],
    iconAnchor: [EGG / 2, EGG / 2],
  });
}

function tiltFor(slug: string): number {
  let n = 0;
  for (let i = 0; i < slug.length; i += 1) {
    n = (n * 31 + slug.charCodeAt(i)) % 997;
  }
  return (n % 21) - 10;
}

function spotCard(
  spot: MapSpot,
  locale: Locale,
  navigate: (href: string) => void,
): HTMLElement {
  const href = `/nl/${spot.citySlug}/${spot.slug}`;
  const card = element("a", "spot-card");
  card.setAttribute("href", href);
  card.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    navigate(href);
  });

  const photo = element("span", "spot-card__photo");
  const img = element("img");
  img.setAttribute("src", spot.photoUrl);
  img.setAttribute("alt", "");
  photo.append(img);
  if (spot.closed) {
    photo.append(element("span", "spot-card__stamp", t(locale, "closed")));
  }

  const body = element("span", "spot-card__body");
  body.append(element("span", "spot-card__name", spot.name));
  if (spot.address) {
    body.append(element("span", "spot-card__meta", spot.address));
  }

  const foot = element("span", "spot-card__foot");
  if (spot.likeCount !== undefined) {
    const likes = element("span", "spot-card__likes");
    likes.innerHTML = HEART;
    likes.append(likeCountLabel(locale, spot.likeCount));
    foot.append(likes);
  }
  const go = element("span", "spot-card__go");
  go.innerHTML = ARROW;
  foot.append(go);
  body.append(foot);

  card.append(photo, body);
  return card;
}

function element(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

const HEART =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>';

const ARROW =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
