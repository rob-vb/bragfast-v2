"use node";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { screenPhoto } from "./model/screen";

const RETRY_MS = 60_000;

/**
 * Right after a photo goes live: Gemini looks, and a breach hides the photo
 * into /admin and mails the owner. A failed look retries once; after that
 * the photo waits for the owner's scan.
 */
export const screenNewPhoto = internalAction({
  args: { photoId: v.id("photos"), attempt: v.number() },
  handler: async (ctx, { photoId, attempt }) => {
    const photo = await ctx.runQuery(internal.moderation.photoForScreen, { photoId });
    if (!photo) {
      return;
    }
    const result = await screenPhoto(ctx, photo.storageId);
    if (result.status === "unscreened") {
      console.warn(`[screen] ${photoId} attempt ${attempt}: ${result.why}`);
      if (attempt < 2) {
        await ctx.scheduler.runAfter(RETRY_MS, internal.screen.screenNewPhoto, {
          photoId,
          attempt: attempt + 1,
        });
      }
      return;
    }
    await ctx.runMutation(internal.moderation.applyScreen, {
      photoId,
      category: result.status === "rejected" ? result.category : null,
    });
  },
});

/** Try the Vertex setup on a stored photo from the CLI. */
export const screenStored = internalAction({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => await screenPhoto(ctx, storageId),
});
