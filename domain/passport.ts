import { parseUserSlug, type UserSlug } from "./ids";

export type PassportRecord = { slug: string; since: number };

export type PassportPlan =
  | { action: "keep"; slug: string; since: number }
  | { action: "mint"; since: number };

export type MintPassportPlan =
  | { action: "keep"; slug: string; since: number }
  | { action: "mint"; slug: UserSlug; since: number }
  | { action: "reject"; reason: "collision" };

export function slugifyPassportName(displayName: string): string {
  const slug = displayName
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug.length === 0 ? "bragger" : slug;
}

export function passportSlugCandidate(
  displayName: string,
  attempt: number,
): UserSlug {
  const base = slugifyPassportName(displayName);
  const raw = attempt <= 1 ? base : `${base}-${attempt}`;
  return parseUserSlug(raw);
}

export function planPassport(
  existing: PassportRecord | null,
  now: number,
): PassportPlan {
  if (existing) {
    return { action: "keep", slug: existing.slug, since: existing.since };
  }
  return { action: "mint", since: now };
}

export function planMintPassport(input: {
  existing: PassportRecord | null;
  occupiedByOther: boolean;
  slug: UserSlug;
  now: number;
}): MintPassportPlan {
  if (input.existing) {
    return {
      action: "keep",
      slug: input.existing.slug,
      since: input.existing.since,
    };
  }
  if (input.occupiedByOther) {
    return { action: "reject", reason: "collision" };
  }
  return { action: "mint", slug: input.slug, since: input.now };
}

/** The passport's prints: every photo the account posted, newest first. */
export function listPassportPhotos<T extends { createdAt: number }>(
  photos: readonly T[],
): T[] {
  return [...photos].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * One row per spot the account photographed, dated by its first photo there,
 * newest first. The map pins and the stamps count spots, not prints.
 */
export function photographedSpots<
  S extends { citySlug: string; slug: string },
>(photos: readonly { createdAt: number; spot: S }[]): (S & { at: number })[] {
  const bySpot = new Map<string, S & { at: number }>();
  for (const photo of photos) {
    const key = `${photo.spot.citySlug}/${photo.spot.slug}`;
    const seen = bySpot.get(key);
    if (!seen || photo.createdAt < seen.at) {
      bySpot.set(key, { ...photo.spot, at: photo.createdAt });
    }
  }
  return [...bySpot.values()].sort((a, b) => b.at - a.at);
}

export type PassportStamp<C extends string = string> = {
  citySlug: C;
  count: number;
  firstAt: number;
};

/**
 * One stamp per woonplaats the account posted a photo in, in the order they
 * first did: a passport fills up front to back.
 */
export function passportStamps<C extends string>(
  spots: readonly { citySlug: C; at: number }[],
): PassportStamp<C>[] {
  const byCity = new Map<C, PassportStamp<C>>();
  for (const spot of spots) {
    const stamp = byCity.get(spot.citySlug);
    if (!stamp) {
      byCity.set(spot.citySlug, {
        citySlug: spot.citySlug,
        count: 1,
        firstAt: spot.at,
      });
      continue;
    }
    stamp.count += 1;
    stamp.firstAt = Math.min(stamp.firstAt, spot.at);
  }
  return [...byCity.values()].sort((a, b) => a.firstAt - b.firstAt);
}
