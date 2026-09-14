import geoip from "geoip-lite";
import type { GeoPoint } from "@/domain/geo";

export type GeoPointLookup = (ip: string) => GeoPoint | null;

export function lookupGeoPoint(ip: string): GeoPoint | null {
  try {
    const hit = geoip.lookup(ip);
    const pair = hit?.ll;
    if (!pair || pair.length < 2) {
      return null;
    }
    const [lat, lng] = pair;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    return { lat, lng };
  } catch {
    return null;
  }
}
