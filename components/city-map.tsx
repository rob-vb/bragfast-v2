"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapSpot = {
  slug: string;
  citySlug: string;
  name: string;
  geo: { lat: number; lng: number };
};

export function CityMap({ spots }: { spots: MapSpot[] }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) {
      return;
    }

    const map = L.map(el, { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    const points: L.LatLngExpression[] = [];
    for (const spot of spots) {
      const latlng: L.LatLngExpression = [spot.geo.lat, spot.geo.lng];
      points.push(latlng);
      const marker = L.circleMarker(latlng, {
        radius: 8,
        weight: 2,
        className: "spot-marker",
      }).addTo(map);
      const href = `/nl/${spot.citySlug}/${spot.slug}`;
      marker.bindPopup(
        `<a href="${href}">${escapeHtml(spot.name)}</a>`,
      );
    }

    if (points.length === 1) {
      map.setView(points[0], 15);
    } else if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 16 });
    } else {
      map.setView([52.381, 4.637], 13);
    }

    return () => {
      map.remove();
    };
  }, [spots]);

  return (
    <div
      ref={root}
      className="mt-6 h-[28rem] overflow-hidden rounded-slab"
    />
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
