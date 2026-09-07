import type { SocialEmbed } from "./post";

export type InstagramMedia = {
  id: string;
  caption: string;
  permalink: string;
  createdAt: number | null;
  locationName: string | null;
};

export function parseInstagramMedia(raw: unknown): InstagramMedia | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id.trim() : "";
  const permalink =
    typeof row.permalink === "string" ? row.permalink.trim() : "";
  if (id.length === 0 || permalink.length === 0) {
    return null;
  }
  const caption = typeof row.caption === "string" ? row.caption : "";
  const createdAt =
    typeof row.timestamp === "string" ? Date.parse(row.timestamp) : NaN;
  const location = row.location;
  let locationName: string | null = null;
  if (
    location !== null &&
    typeof location === "object" &&
    !Array.isArray(location) &&
    typeof (location as { name?: unknown }).name === "string"
  ) {
    const name = (location as { name: string }).name.trim();
    locationName = name.length > 0 ? name : null;
  }
  return {
    id,
    caption,
    permalink,
    createdAt: Number.isFinite(createdAt) ? createdAt : null,
    locationName,
  };
}

export function resolveLocationName(
  locationName: string | null,
  spots: readonly { name: string; placeId: string }[],
): string | null {
  const needle = locationName?.trim().toLowerCase() ?? "";
  if (needle.length < 3) {
    return null;
  }
  const exact = spots.filter(
    (spot) => spot.name.trim().toLowerCase() === needle,
  );
  if (exact.length === 1) {
    return exact[0].placeId;
  }
  if (exact.length > 1) {
    return null;
  }
  let found: { name: string; placeId: string } | null = null;
  for (const spot of spots) {
    const name = spot.name.trim().toLowerCase();
    if (name.length < 3 || !needle.includes(name)) {
      continue;
    }
    if (found) {
      return null;
    }
    found = spot;
  }
  return found?.placeId ?? null;
}

export function instagramEmbed(media: InstagramMedia): SocialEmbed {
  return {
    platform: "instagram",
    permalink: media.permalink,
    platformMediaId: media.id,
  };
}
