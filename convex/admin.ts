import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { parseCitySlug, parseSpotSlug } from "../domain/ids";
import {
  isOwnerEmail,
  planClosedOverride,
  planReportReview,
} from "../domain/moderation";
import type { AdminReportRow, AdminSpotRow } from "../domain/viewModels";
import { ownerEmail, requireOwner } from "./model/owner";
import { authComponent } from "./auth";

export const queue = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    reports: AdminReportRow[];
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
    for (const report of openReports) {
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

    return { reports, spots };
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
