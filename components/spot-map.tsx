"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

const EGG = 52;

/**
 * One spot on a small, still map: the egg dropped on its door. It does not
 * pan or zoom, so it never traps a thumb scrolling the page; the Route link
 * beside it is the way in.
 */
export function SpotMap({ geo }: { geo: { lat: number; lng: number } }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) {
      return;
    }

    const map = L.map(el, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView([geo.lat, geo.lng], 16);
    map.attributionControl.setPrefix(
      '<a href="https://leafletjs.com">Leaflet</a>',
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    L.marker([geo.lat, geo.lng], {
      interactive: false,
      keyboard: false,
      icon: L.divIcon({
        className: "spot-egg",
        html: `<img src="/brag_fast_egg.svg" alt="" width="${EGG}" height="${EGG}" draggable="false" style="--tilt:-8deg;--delay:180ms" />`,
        iconSize: [EGG, EGG],
        iconAnchor: [EGG / 2, EGG / 2],
      }),
    }).addTo(map);

    el.classList.add("is-intro");
    const intro = window.setTimeout(() => el.classList.remove("is-intro"), 1000);

    return () => {
      window.clearTimeout(intro);
      map.remove();
    };
  }, [geo.lat, geo.lng]);

  return (
    <div ref={root} className="spot-map absolute inset-0" />
  );
}
