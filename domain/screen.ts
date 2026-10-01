/**
 * The check every photo gets right after it goes live: Gemini on Vertex AI
 * looks at it and answers in `PHOTO_SCREEN_SCHEMA`. Only clear breaches of the
 * house rules hide a photo; anything the check cannot read leaves it up, and
 * the owner's scan and visitor reports catch the rest.
 */

export const PHOTO_SCREEN_MODEL = "gemini-3.8-flash";

export const PHOTO_SCREEN_CATEGORIES = [
  "ok",
  "sexual",
  "violence",
  "hate",
  "drugs",
  "personal-data",
  "spam",
] as const;

export type PhotoScreenCategory = (typeof PHOTO_SCREEN_CATEGORIES)[number];

export const PHOTO_SCREEN_SCHEMA = {
  type: "object",
  properties: {
    allowed: { type: "boolean" },
    category: { type: "string", enum: [...PHOTO_SCREEN_CATEGORIES] },
  },
  required: ["allowed", "category"],
} as const;

export const PHOTO_SCREEN_INSTRUCTION = `You check photos people post to brag.fast, a Dutch site of breakfast and brunch spots. A photo you reject is taken down.

Reject a photo only when it clearly shows one of these:
- sexual: nudity or sexual content
- violence: violence, gore, or weapons aimed at people
- hate: hate symbols, or hateful, threatening or harassing text
- drugs: drug use or drugs as the subject
- personal-data: readable personal data as the subject (ID cards, bank cards, documents, receipts or screens with names or numbers)
- spam: advertising as the subject (posters, flyers, promo text, QR codes)

Allow everything else, including food, drinks, tables, menus, interiors, terraces, storefronts, and people eating. A photo that is not of breakfast or brunch is still allowed; visitors report wrong spots. When unsure, allow.

Answer with allowed and the category ("ok" when allowed).`;

export type PhotoScreenResult =
  | { status: "allowed" }
  | { status: "rejected"; category: string }
  | { status: "unscreened"; why: string };

/** Google's own safety filter stopped the answer: the photo is out too. */
const SAFETY_STOPS = new Set([
  "SAFETY",
  "PROHIBITED_CONTENT",
  "IMAGE_SAFETY",
  "IMAGE_PROHIBITED_CONTENT",
  "BLOCKLIST",
  "SPII",
]);

/** Read a Vertex `generateContent` answer into a verdict. */
export function readPhotoScreen(answer: {
  blockReason?: string;
  finishReason?: string;
  text?: string;
}): PhotoScreenResult {
  const stop = answer.blockReason ?? answer.finishReason;
  if (stop && SAFETY_STOPS.has(stop)) {
    return { status: "rejected", category: `blocked (${stop})` };
  }
  if (answer.blockReason) {
    return { status: "unscreened", why: `blocked: ${answer.blockReason}` };
  }
  if (answer.finishReason !== "STOP") {
    return { status: "unscreened", why: `finish ${answer.finishReason ?? "none"}` };
  }
  let verdict: unknown;
  try {
    verdict = JSON.parse(answer.text ?? "");
  } catch {
    return { status: "unscreened", why: "unreadable answer" };
  }
  if (typeof verdict !== "object" || verdict === null) {
    return { status: "unscreened", why: "unreadable answer" };
  }
  const { allowed, category } = verdict as { allowed?: unknown; category?: unknown };
  if (allowed === true) {
    return { status: "allowed" };
  }
  if (
    allowed === false &&
    typeof category === "string" &&
    category !== "ok" &&
    (PHOTO_SCREEN_CATEGORIES as readonly string[]).includes(category)
  ) {
    return { status: "rejected", category };
  }
  return { status: "unscreened", why: "unreadable answer" };
}
