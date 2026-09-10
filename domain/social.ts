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

const INSTAGRAM_PATH = /^(p|reel|tv)$/;
const INSTAGRAM_CODE = /^[A-Za-z0-9_-]{5,64}$/;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

function youtubeHost(hostname: string): boolean {
  return (
    hostname === "www.youtube.com" ||
    hostname === "youtube.com" ||
    hostname === "m.youtube.com" ||
    hostname === "youtu.be" ||
    hostname === "www.youtube-nocookie.com"
  );
}

export function isYoutubePermalink(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && youtubeHost(parsed.hostname);
  } catch {
    return false;
  }
}

export function officialEmbedSrc(embed: SocialEmbed): string | null {
  if (embed.platform === "instagram") {
    return instagramEmbedSrc(embed.permalink);
  }
  return youtubeEmbedSrc(embed.permalink);
}

export function instagramEmbedSrc(permalink: string): string | null {
  if (!isInstagramPermalink(permalink)) {
    return null;
  }
  const parsed = new URL(permalink);
  const parts = parsed.pathname.split("/").filter((part) => part.length > 0);
  if (parts.length < 2) {
    return null;
  }
  const kind = parts[0];
  const code = parts[1];
  if (!INSTAGRAM_PATH.test(kind) || !INSTAGRAM_CODE.test(code)) {
    return null;
  }
  return `https://www.instagram.com/${kind}/${code}/embed`;
}

export function youtubeEmbedSrc(permalink: string): string | null {
  if (!isYoutubePermalink(permalink)) {
    return null;
  }
  const parsed = new URL(permalink);
  let id: string | null = null;
  if (parsed.hostname === "youtu.be") {
    id = parsed.pathname.split("/").filter((part) => part.length > 0)[0] ?? null;
  } else {
    const parts = parsed.pathname.split("/").filter((part) => part.length > 0);
    if (parsed.pathname === "/watch" || parts[0] === "watch") {
      id = parsed.searchParams.get("v");
    } else if (
      (parts[0] === "embed" || parts[0] === "shorts") &&
      typeof parts[1] === "string"
    ) {
      id = parts[1];
    }
  }
  if (!id || !YOUTUBE_ID.test(id)) {
    return null;
  }
  return `https://www.youtube.com/embed/${id}`;
}

export type MakerMatchConfirmPlan =
  | { ok: true; action: "attach" }
  | { ok: true; action: "already" }
  | {
      ok: false;
      reason: "not-pending" | "not-owner" | "closed" | "duplicate";
    };

export function planMakerMatchConfirm(input: {
  queueStatus: "pending" | "approved" | "rejected";
  queueMakerKey: string;
  userMakerKey: string;
  listingStatus: "listed" | "gravestone";
  existingSpotId: string | null;
  targetSpotId: string;
}): MakerMatchConfirmPlan {
  if (input.queueStatus !== "pending") {
    return { ok: false, reason: "not-pending" };
  }
  if (input.queueMakerKey !== input.userMakerKey) {
    return { ok: false, reason: "not-owner" };
  }
  if (input.listingStatus !== "listed") {
    return { ok: false, reason: "closed" };
  }
  if (input.existingSpotId !== null) {
    if (input.existingSpotId === input.targetSpotId) {
      return { ok: true, action: "already" };
    }
    return { ok: false, reason: "duplicate" };
  }
  return { ok: true, action: "attach" };
}
