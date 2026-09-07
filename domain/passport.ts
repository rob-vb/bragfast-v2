import { parseUserSlug, type UserSlug } from "./ids";

export const POSTS_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type PassportRecord = { slug: string; since: number };

export type PassportPlan =
  | { action: "keep"; slug: string; since: number }
  | { action: "mint"; since: number };

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

export function countPostsThisWeek(createdAts: number[], now: number): number {
  const threshold = now - POSTS_WEEK_MS;
  return createdAts.filter((createdAt) => createdAt >= threshold).length;
}
