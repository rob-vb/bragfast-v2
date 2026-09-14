import "server-only";
import geoip from "geoip-lite";
import type { GeoPoint } from "@/domain/geo";

export type GeoPointLookup = (
  ip: string,
) => GeoPoint | null | Promise<GeoPoint | null>;

export async function lookupGeoPoint(ip: string): Promise<GeoPoint | null> {
  try {
    const hit = geoip.lookup(ip);
    const pair = hit?.ll;
    if (!pair) {
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
