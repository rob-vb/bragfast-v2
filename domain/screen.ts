/**
 * The check every photo passes before it goes live. A Gemini Flash model looks
 * at the photo and answers in `PHOTO_SCREEN_SCHEMA`. Only clear breaches of
 * the house rules stop a photo; anything the check cannot read lets it
 * through, and the owner's scan and visitor reports catch the rest.
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

export const PHOTO_SCREEN_INSTRUCTION = `You check photos people post to brag.fast, a Dutch site of breakfast and brunch spots. A photo goes live as soon as you allow it.

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
  | { status: "rejected"; category: Exclude<PhotoScreenCategory, "ok"> }
  | { status: "unscreened"; why: string };

/** Read an Interactions API response into a verdict. */
export function readPhotoScreen(response: unknown): PhotoScreenResult {
  if (typeof response !== "object" || response === null) {
    return { status: "unscreened", why: "no response" };
  }
  const { status, steps } = response as { status?: unknown; steps?: unknown };
  if (status !== "completed") {
    return { status: "unscreened", why: `status ${String(status)}` };
  }
  const text = Array.isArray(steps)
    ? steps
        .flatMap((step: { content?: unknown }) =>
          Array.isArray(step?.content) ? step.content : [],
        )
        .filter(
          (part: { type?: unknown; text?: unknown }): part is { text: string } =>
            part?.type === "text" && typeof part.text === "string",
        )
        .map((part) => part.text)
        .join("")
    : "";
  let verdict: unknown;
  try {
    verdict = JSON.parse(text);
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
    return {
      status: "rejected",
      category: category as Exclude<PhotoScreenCategory, "ok">,
    };
  }
  return { status: "unscreened", why: "unreadable answer" };
}

/** Base64 for the request body, in chunks so large photos don't blow the stack. */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}
