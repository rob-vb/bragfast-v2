import type { GenericId } from "convex/values";
import type { SocialEmbed } from "./post";

const HASHTAG = /#bragfast\b/i;

export type SocialIngestInput = {
  caption: string;
  locationPlaceId: string | null;
  embed: SocialEmbed;
};

export type SocialIngestPlan =
  | { action: "skip"; reason: "no-hashtag" }
  | { action: "skip"; reason: "duplicate" }
  | { action: "attach"; placeId: string }
  | { action: "queue"; caption: string };

export function planSocialIngest(
  input: SocialIngestInput,
  existingPlatformMediaId: string | null,
): SocialIngestPlan {
  if (!HASHTAG.test(input.caption)) {
    return { action: "skip", reason: "no-hashtag" };
  }
  if (
    existingPlatformMediaId !== null &&
    existingPlatformMediaId === input.embed.platformMediaId
  ) {
    return { action: "skip", reason: "duplicate" };
  }
  const placeId = input.locationPlaceId?.trim() ?? "";
  if (placeId.length > 0) {
    return { action: "attach", placeId };
  }
  return { action: "queue", caption: input.caption.trim() };
}

export function planCaptionMatch<T extends { name: string }>(
  caption: string,
  spots: readonly T[],
): T | null {
  const haystack = caption.toLowerCase();
  let found: T | null = null;
  for (const spot of spots) {
    const name = spot.name.trim().toLowerCase();
    if (name.length < 3 || !haystack.includes(name)) {
      continue;
    }
    if (found) {
      return null;
    }
    found = spot;
  }
  return found;
}

export type MakerMergePlan =
  | { action: "keep" }
  | {
      action: "rewrite";
      from: string;
      to: string;
    };

export function planMakerMerge(input: {
  alreadyLinkedIgUserId: string | null;
  incomingIgUserId: string;
  userMakerKey: string;
}): MakerMergePlan {
  if (input.alreadyLinkedIgUserId === input.incomingIgUserId) {
    return { action: "keep" };
  }
  return {
    action: "rewrite",
    from: `ig:${input.incomingIgUserId}`,
    to: input.userMakerKey,
  };
}

export function isInstagramPermalink(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "www.instagram.com" ||
        parsed.hostname === "instagram.com")
    );
  } catch {
    return false;
  }
}
