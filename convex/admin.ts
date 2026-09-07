import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { parseCitySlug, parseSpotSlug } from "../domain/ids";
import {
  isOwnerEmail,
  planClosedOverride,
  planReportReview,
} from "../domain/moderation";
import type {
  AdminMatchRow,
  AdminReportRow,
  AdminSpotAddRow,
  AdminSpotRow,
} from "../domain/viewModels";
import { ownerEmail, requireOwner } from "./model/owner";
import { authComponent } from "./auth";
import {
  approveMatch as commitMatch,
  rejectMatch as dropMatch,
} from "./model/social";
import {
  approveSpotAdd as commitSpotAdd,
  rejectSpotAdd as dropSpotAdd,
} from "./model/placeAdd";
import { applyVisiblePosts, refreshSpotStanding } from "./model/votes";

export const queue = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    reports: AdminReportRow[];
    spots: AdminSpotRow[];
    matches: AdminMatchRow[];
    spotAdds: AdminSpotAddRow[];
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
      if (report.target.kind !== "post") {
        continue;
      }
      const post = await ctx.db.get(report.target.postId);
      if (!post || post.visibility.kind !== "hidden") {
        continue;
      }
      const spot = await ctx.db.get(post.spotId);
      if (!spot) {
        continue;
      }
      reports.push({
        reportId: report._id,
        reason: report.reason,
        postId: post._id,
        spotName: spot.name,
        spotPath: `/nl/${spot.citySlug}/${spot.slug}`,
        hiddenAt: post.visibility.at,
      });
    }
    reports.sort((a, b) => b.hiddenAt - a.hiddenAt);

    const pendingMatches = await ctx.db
      .query("aiMatchQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    const matches: AdminMatchRow[] = [];
    for (const row of pendingMatches) {
      const proposed = row.proposedSpotId
        ? await ctx.db.get(row.proposedSpotId)
        : null;
      matches.push({
        queueId: row._id,
        permalink: row.embed.permalink,
        caption: row.caption,
        proposedSpotName: proposed?.name ?? null,
        proposedSpotPath: proposed
          ? `/nl/${proposed.citySlug}/${proposed.slug}`
          : null,
      });
    }

    const pendingAdds = await ctx.db
      .query("spotAddQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    const spotAdds: AdminSpotAddRow[] = pendingAdds.map((row) => ({
      queueId: row._id,
      name: row.name,
      placeId: row.placeId,
      types: row.types,
      citySlug: parseCitySlug(row.citySlug),
    }));

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

    return { reports, spots, matches, spotAdds };
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
    if (report.target.kind !== "post") {
      throw new ConvexError("Report is not a post");
    }
    const post = await ctx.db.get(report.target.postId);
    if (!post) {
      throw new ConvexError("Post not found");
    }
    const plan = planReportReview({
      reportStatus: report.status,
      reportId: report._id,
      visibility: post.visibility,
      action: "restore",
    });
    if (!plan.ok) {
      throw new ConvexError(plan.reason);
    }
    await ctx.db.patch(report._id, { status: plan.reportStatus });
    await ctx.db.patch(post._id, { visibility: plan.visibility });
    await applyVisiblePosts(ctx, {
      spotId: post.spotId,
      makerKey: post.makerKey,
    });
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
    if (report.target.kind !== "post") {
      throw new ConvexError("Report is not a post");
    }
    const post = await ctx.db.get(report.target.postId);
    if (!post) {
      throw new ConvexError("Post not found");
    }
    const plan = planReportReview({
      reportStatus: report.status,
      reportId: report._id,
      visibility: post.visibility,
      action: "keepHidden",
    });
    if (!plan.ok) {
      throw new ConvexError(plan.reason);
    }
    await ctx.db.patch(report._id, { status: plan.reportStatus });
    await ctx.db.patch(post._id, { visibility: plan.visibility });
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
    await refreshSpotStanding(ctx, spot._id);
  },
});

export const approveMatch = mutation({
  args: { queueId: v.id("aiMatchQueue") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    await commitMatch(ctx, args.queueId);
  },
});

export const rejectMatch = mutation({
  args: { queueId: v.id("aiMatchQueue") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    await dropMatch(ctx, args.queueId);
  },
});

export const approveSpotAdd = mutation({
  args: { queueId: v.id("spotAddQueue") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    await commitSpotAdd(ctx, args.queueId);
  },
});

export const rejectSpotAdd = mutation({
  args: { queueId: v.id("spotAddQueue") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    await dropSpotAdd(ctx, args.queueId);
  },
});
