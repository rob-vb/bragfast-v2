import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { parseCitySlug, parseSpotSlug } from "../domain/ids";
import {
  isOwnerEmail,
  planClosedOverride,
  planReportReview,
} from "../domain/moderation";
import type {
  AdminPhotoReportRow,
  AdminReportRow,
  AdminSpotRow,
} from "../domain/viewModels";
import type { Id } from "./_generated/dataModel";
import { deleteAccount } from "./model/account";
import { deletePhoto, unhidePhoto } from "./model/photos";
import { ownerEmail, requireOwner } from "./model/owner";
import { authComponent } from "./auth";

export const queue = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    reports: AdminReportRow[];
    photoReports: AdminPhotoReportRow[];
    spots: AdminSpotRow[];
  } | null> => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!isOwnerEmail(authUser?.email, ownerEmail())) {
      return null;
    }

    const openReports = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    const reports: AdminReportRow[] = [];
    const photoReasons = new Map<Id<"photos">, string[]>();
    for (const report of openReports) {
      if (report.target.kind === "photo") {
        const reasons = photoReasons.get(report.target.photoId) ?? [];
        photoReasons.set(report.target.photoId, [...reasons, report.reason]);
        continue;
      }
      if (report.target.kind !== "spot") {
        continue;
      }
      const spot = await ctx.db.get(report.target.spotId);
      if (!spot) {
        continue;
      }
      reports.push({
        reportId: report._id,
        reason: report.reason,
        spotName: spot.name,
        spotPath: `/nl/${spot.citySlug}/${spot.slug}`,
      });
    }

    const photoReports: AdminPhotoReportRow[] = [];
    for (const [photoId, reasons] of photoReasons) {
      const photo = await ctx.db.get(photoId);
      const spot = photo ? await ctx.db.get(photo.spotId) : null;
      if (!photo || !spot) {
        continue;
      }
      const uploader = await ctx.db.get(photo.uploadedBy);
      photoReports.push({
        photoId,
        photoUrl: await ctx.storage.getUrl(photo.storageId),
        reasons,
        spotName: spot.name,
        spotPath: `/nl/${spot.citySlug}/${spot.slug}`,
        uploaderSlug: uploader?.passport?.slug ?? null,
      });
    }

    const spotRows = await ctx.db.query("spots").collect();
    const spots: AdminSpotRow[] = spotRows
      .map((spot) => ({
        spotId: spot._id,
        name: spot.name,
        citySlug: parseCitySlug(spot.citySlug),
        slug: parseSpotSlug(spot.slug),
        listingStatus: spot.listingStatus,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "nl"));

    return { reports, photoReports, spots };
  },
});

export const restore = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new ConvexError("Report not found");
    }
    const plan = planReportReview({
      reportStatus: report.status,
      reportId: report._id,
      action: "restore",
    });
    if (!plan.ok) {
      throw new ConvexError(plan.reason);
    }
    await ctx.db.patch(report._id, { status: plan.reportStatus });
  },
});

export const keepHidden = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const report = await ctx.db.get(args.reportId);
    if (!report) {
      throw new ConvexError("Report not found");
    }
    const plan = planReportReview({
      reportStatus: report.status,
      reportId: report._id,
      action: "keepHidden",
    });
    if (!plan.ok) {
      throw new ConvexError(plan.reason);
    }
    await ctx.db.patch(report._id, { status: plan.reportStatus });
  },
});

export const closeSpot = mutation({
  args: { spotId: v.id("spots") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const spot = await ctx.db.get(args.spotId);
    if (!spot) {
      throw new ConvexError("Spot not found");
    }
    const plan = planClosedOverride({
      listingStatus: spot.listingStatus,
      action: "close",
      now: Date.now(),
    });
    if (!("action" in plan) || plan.action !== "close") {
      throw new ConvexError("ok" in plan ? plan.reason : "already-listed");
    }
    await ctx.db.patch(spot._id, {
      listingStatus: plan.listingStatus,
      closedAt: plan.closedAt,
      boardScore: undefined,
      latestBragAt: undefined,
      windowExpiresAt: undefined,
    });
  },
});

export const reopenSpot = mutation({
  args: { spotId: v.id("spots") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    const spot = await ctx.db.get(args.spotId);
    if (!spot) {
      throw new ConvexError("Spot not found");
    }
    const plan = planClosedOverride({
      listingStatus: spot.listingStatus,
      action: "reopen",
      now: Date.now(),
    });
    if (!("action" in plan) || plan.action !== "reopen") {
      throw new ConvexError("ok" in plan ? plan.reason : "already-closed");
    }
    await ctx.db.patch(spot._id, {
      listingStatus: plan.listingStatus,
      closedAt: undefined,
    });
  },
});

/** Close every open report on a photo; reporters are forgotten once handled. */
async function resolvePhotoReports(ctx: MutationCtx, photoId: Id<"photos">) {
  const reports = await ctx.db
    .query("reports")
    .withIndex("by_photo", (q) => q.eq("target.photoId", photoId))
    .collect();
  for (const report of reports) {
    if (report.status === "open") {
      await ctx.db.patch(report._id, {
        status: "resolved",
        reporterId: undefined,
      });
    }
  }
}

async function reportedPhoto(ctx: MutationCtx, photoId: Id<"photos">) {
  await requireOwner(ctx);
  const photo = await ctx.db.get(photoId);
  if (!photo) {
    throw new ConvexError("Photo not found");
  }
  return photo;
}

/** The report was wrong: the photo comes back. */
export const restorePhoto = mutation({
  args: { photoId: v.id("photos") },
  handler: async (ctx, { photoId }) => {
    const photo = await reportedPhoto(ctx, photoId);
    await resolvePhotoReports(ctx, photoId);
    await unhidePhoto(ctx, photo);
    await ctx.db.patch(photoId, { scannedAt: Date.now() });
  },
});

/** The report was right: the photo goes for good. */
export const removePhoto = mutation({
  args: { photoId: v.id("photos") },
  handler: async (ctx, { photoId }) => {
    const photo = await reportedPhoto(ctx, photoId);
    await deletePhoto(ctx, photo);
  },
});

/** Eject whoever posted it: the account and everything they posted go. */
export const removeUploader = mutation({
  args: { photoId: v.id("photos") },
  handler: async (ctx, { photoId }) => {
    const photo = await reportedPhoto(ctx, photoId);
    const uploader = await ctx.db.get(photo.uploadedBy);
    if (!uploader) {
      await deletePhoto(ctx, photo);
      return;
    }
    await deleteAccount(ctx, uploader.authId);
  },
});
