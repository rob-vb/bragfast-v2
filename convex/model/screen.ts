import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import {
  PHOTO_SCREEN_INSTRUCTION,
  PHOTO_SCREEN_MODEL,
  PHOTO_SCREEN_SCHEMA,
  bytesToBase64,
  readPhotoScreen,
  type PhotoScreenResult,
} from "../../domain/screen";

const TIMEOUT_MS = 10_000;

/** Ask Gemini whether an uploaded photo may go live. Never throws. */
export async function screenPhoto(
  ctx: ActionCtx,
  storageId: Id<"_storage">,
): Promise<PhotoScreenResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return { status: "unscreened", why: "no GEMINI_API_KEY" };
  }
  const blob = await ctx.storage.get(storageId);
  if (!blob) {
    return { status: "unscreened", why: "photo missing" };
  }
  const data = bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        signal: abort.signal,
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: PHOTO_SCREEN_MODEL,
          store: false,
          system_instruction: PHOTO_SCREEN_INSTRUCTION,
          input: [
            { type: "image", data, mime_type: blob.type || "image/jpeg" },
            { type: "text", text: "Check this photo." },
          ],
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: PHOTO_SCREEN_SCHEMA,
          },
          generation_config: { thinking_level: "low" },
        }),
      },
    );
    if (!response.ok) {
      return {
        status: "unscreened",
        why: `HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`,
      };
    }
    return readPhotoScreen(await response.json());
  } catch (error) {
    return { status: "unscreened", why: String(error) };
  } finally {
    clearTimeout(timer);
  }
}
