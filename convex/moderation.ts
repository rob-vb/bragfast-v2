import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { authComponent } from "./auth";
import {
  PHOTO_REPORT_REASONS,
  planBlockUploader,
  planPhotoReport,
} from "../domain/moderation";
import { moderationAlertEmail } from "../domain/notify";
import { hidePhoto } from "./model/photos";
import { screenPhoto } from "./model/screen";
import { ensureAppUser } from "./model/users";

const reasonValidator = v.union(
  ...PHOTO_REPORT_REASONS.map((reason) => v.literal(reason)),
);

/** Report a photo from the app or the website: it hides until the owner looks. */
export const reportPhoto = mutation({
  args: { photoId: v.id("photos"), reason: reasonValidator },
  handler: async (ctx, { photoId, reason }) => {
    const viewer = await ensureAppUser(ctx);
    const photo = await ctx.db.get(photoId);
    const mine = await ctx.db
      .query("reports")
      .withIndex("by_photo", (q) => q.eq("target.photoId", photoId))
      .collect();
    const plan = planPhotoReport({
      exists: photo !== null,
      ownPhoto: photo?.uploadedBy === viewer._id,
      hidden: photo?.hiddenAt !== undefined,
      reportedByViewer: mine.some(
        (report) => report.status === "open" && report.reporterId === viewer._id,
      ),
    });
    if (photo === null || plan.action === "reject") {
      throw new ConvexError(plan.action === "reject" ? plan.reason : "missing");
    }
    await ctx.db.insert("reports", {
      target: { kind: "photo", photoId },
      reason,
      status: "open",
      reporterId: viewer._id,
    });
    if (plan.action === "hide") {
      await hidePhoto(ctx, photo);
      await alertOwner(ctx, photo, { kind: "report", reason });
    }
    return { ok: true as const };
  },
});

/** Stop seeing someone's photos in the app. The owner hears about it too. */
export const blockUploader = mutation({
  args: { photoId: v.id("photos") },
  handler: async (ctx, { photoId }) => {
    const viewer = await ensureAppUser(ctx);
    const photo = await ctx.db.get(photoId);
    const existing = photo
      ? await ctx.db
          .query("blocks")
          .withIndex("by_user_blocked", (q) =>
            q.eq("userId", viewer._id).eq("blockedId", photo.uploadedBy),
          )
          .unique()
      : null;
    const plan = planBlockUploader({
      exists: photo !== null,
      ownPhoto: photo?.uploadedBy === viewer._id,
      alreadyBlocked: existing !== null,
    });
    if (photo === null || plan.action === "reject") {
      throw new ConvexError(plan.action === "reject" ? plan.reason : "missing");
    }
    if (plan.action === "block") {
      await ctx.db.insert("blocks", {
        userId: viewer._id,
        blockedId: photo.uploadedBy,
      });
      await alertOwner(ctx, photo, { kind: "block" });
    }
    return { ok: true as const };
  },
});

/** The people you blocked, for the app's settings. */
export const myBlocks = query({
  args: {},
  handler: async (ctx): Promise<{ userId: Id<"users">; username: string | null }[]> => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      return [];
    }
    const viewer = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", authUser._id))
      .unique();
    if (!viewer) {
      return [];
    }
    const rows = await ctx.db
      .query("blocks")
      .withIndex("by_user_blocked", (q) => q.eq("userId", viewer._id))
      .collect();
    const out = [];
    for (const row of rows) {
      const blocked = await ctx.db.get(row.blockedId);
      out.push({ userId: row.blockedId, username: blocked?.passport?.slug ?? null });
    }
    return out;
  },
});

/** Lift a block from the app's settings. */
export const unblock = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const viewer = await ensureAppUser(ctx);
    const row = await ctx.db
      .query("blocks")
      .withIndex("by_user_blocked", (q) =>
        q.eq("userId", viewer._id).eq("blockedId", userId),
      )
      .unique();
    if (row) {
      await ctx.db.delete(row._id);
    }
    return { ok: true as const };
  },
});

async function alertOwner(
  ctx: MutationCtx,
  photo: Doc<"photos">,
  input: { kind: "report" | "block"; reason?: string },
) {
  const spot = await ctx.db.get(photo.spotId);
  const uploader = await ctx.db.get(photo.uploadedBy);
  const site = process.env.SITE_URL ?? "https://brag.fast";
  const mail = moderationAlertEmail({
    ...input,
    spotName: spot?.name ?? "een plek",
    spotUrl: spot ? `${site}/nl/${spot.citySlug}/${spot.slug}` : site,
    adminUrl: `${site}/admin`,
    uploaderSlug: uploader?.passport?.slug ?? null,
  });
  await ctx.scheduler.runAfter(0, internal.notify.sendModerationAlert, mail);
}

/**
 * Photos the owner's scan has not looked at yet, oldest first. Run from the
 * CLI: `npx convex run moderation:unscannedPhotos`.
 */
export const unscannedPhotos = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const rows = await ctx.db
      .query("photos")
      .withIndex("by_scanned", (q) => q.eq("scannedAt", undefined))
      // Hidden photos already wait in /admin
      .filter((q) => q.eq(q.field("hiddenAt"), undefined))
      .take(limit ?? 50);
    const out = [];
    for (const photo of rows) {
      const spot = await ctx.db.get(photo.spotId);
      const uploader = await ctx.db.get(photo.uploadedBy);
      out.push({
        photoId: photo._id,
        url: await ctx.storage.getUrl(photo.storageId),
        createdAt: new Date(photo.createdAt).toISOString(),
        spot: spot ? `${spot.name} (/nl/${spot.citySlug}/${spot.slug})` : null,
        uploader: uploader?.passport?.slug ?? null,
      });
    }
    return out;
  },
});

/** The scan looked at these and found nothing wrong. */
export const markScanned = internalMutation({
  args: { photoIds: v.array(v.id("photos")) },
  handler: async (ctx, { photoIds }) => {
    const now = Date.now();
    for (const photoId of photoIds) {
      if (await ctx.db.get(photoId)) {
        await ctx.db.patch(photoId, { scannedAt: now });
      }
    }
  },
});

/** The scan found something: hide it and queue it for the owner in /admin. */
export const flagFromScan = internalMutation({
  args: { photoId: v.id("photos"), reason: v.string() },
  handler: async (ctx, { photoId, reason }) => {
    const photo = await ctx.db.get(photoId);
    if (!photo) {
      return;
    }
    await ctx.db.insert("reports", {
      target: { kind: "photo", photoId },
      reason: `scan: ${reason}`,
      status: "open",
    });
    await ctx.db.patch(photoId, { scannedAt: Date.now() });
    await hidePhoto(ctx, photo);
  },
});

/** Run the pre-publish check on a stored photo, to try the Gemini setup from the CLI. */
export const screenStored = internalAction({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => await screenPhoto(ctx, storageId),
});
