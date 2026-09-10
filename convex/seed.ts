import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { serializeMakerKey } from "../domain/makerKey";
import { applyPlaceAdd } from "./model/placeAdd";
import { ingestSocial } from "./model/social";
import { NL_CITIES } from "../domain/cities";
import { cityCentroid } from "../domain/geo";
import type { PlacesSnapshot } from "../domain/hygiene";
import { applySnapshot } from "./model/hygiene";
import { upsertCity, upsertSpot } from "./model/spots";
import { ensurePassport, ensureUserByAuthId } from "./model/users";
import { applyVisiblePosts } from "./model/votes";

const HAARLEM = { lat: 52.381, lng: 4.637 };

const WEEKDAY_BREAKFAST = {
  timezone: "Europe/Amsterdam",
  periods: [1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    open: "08:00",
    close: "16:00",
  })),
};

export const cities = internalMutation({
  args: {},
  handler: async (ctx) => {
    const keep = new Set(NL_CITIES.map((city) => city.slug));
    for (const city of NL_CITIES) {
      await upsertCity(ctx, {
        slug: city.slug,
        nameNl: city.nameNl,
        nameEn: city.nameEn,
        featuredOrder: city.featuredOrder,
      });
    }
    const existing = await ctx.db.query("cities").collect();
    for (const row of existing) {
      if (!keep.has(row.slug)) {
        await ctx.db.delete(row._id);
      }
    }
  },
});

export const catalog = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const city of NL_CITIES) {
      await upsertCity(ctx, {
        slug: city.slug,
        nameNl: city.nameNl,
        nameEn: city.nameEn,
        featuredOrder: city.featuredOrder,
      });
    }

    await upsertSpot(ctx, {
      placeId: "seed:nl:haarlem:anne-max",
      slug: "anne-max",
      citySlug: "haarlem",
      name: "Anne&Max Haarlem",
      address: "Grote Houtstraat 92, 2011 SV Haarlem",
      geo: { lat: 52.3798, lng: 4.6336 },
      hours: WEEKDAY_BREAKFAST,
      spotType: "cafe",
      listingStatus: "listed",
    });
    await upsertSpot(ctx, {
      placeId: "seed:nl:haarlem:stach",
      slug: "stach",
      citySlug: "haarlem",
      name: "STACH Haarlem",
      address: "Barteljorisstraat 6, 2011 RL Haarlem",
      geo: { lat: 52.3814, lng: 4.6359 },
      hours: WEEKDAY_BREAKFAST,
      spotType: "cafe",
      listingStatus: "listed",
    });
    await upsertSpot(ctx, {
      placeId: "seed:nl:haarlem:jopenkerk",
      slug: "jopenkerk",
      citySlug: "haarlem",
      name: "Jopenkerk",
      address: "Gedempte Voldersgracht 2, 2011 WD Haarlem",
      geo: { lat: 52.3807, lng: 4.6331 },
      hours: WEEKDAY_BREAKFAST,
      spotType: "other",
      listingStatus: "listed",
    });
    await upsertSpot(ctx, {
      placeId: "seed:nl:haarlem:bakkerij-honing",
      slug: "bakkerij-honing",
      citySlug: "haarlem",
      name: "Bakkerij Honing",
      address: "Koningsstraat 41, 2011 TB Haarlem",
      geo: { lat: 52.3822, lng: 4.6378 },
      hours: {
        timezone: "Europe/Amsterdam",
        periods: [1, 2, 3, 4, 5, 6].map((day) => ({
          day,
          open: "07:00",
          close: "16:00",
        })),
      },
      spotType: "bakery",
      listingStatus: "listed",
    });
    await upsertSpot(ctx, {
      placeId: "seed:nl:haarlem:koffielokaal-spaarne",
      slug: "koffielokaal-spaarne",
      citySlug: "haarlem",
      name: "Koffielokaal Spaarne",
      address: "Spaarne 66, 2011 CM Haarlem",
      geo: HAARLEM,
      hours: WEEKDAY_BREAKFAST,
      spotType: "cafe",
      listingStatus: "listed",
    });
    await upsertSpot(ctx, {
      placeId: "seed:nl:haarlem:oude-banketbakker",
      slug: "oude-banketbakker",
      citySlug: "haarlem",
      name: "De Oude Banketbakker",
      address: "Grote Markt 1, 2011 RD Haarlem",
      geo: { lat: 52.3812, lng: 4.636 },
      hours: null,
      spotType: "bakery",
      listingStatus: "gravestone",
      closedAt: Date.parse("2023-03-01T00:00:00+01:00"),
    });
  },
});

const PIXEL_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

const SEED_MAKERS = [
  { authId: "seed:maker-a", displayName: "Maker A", want: 2 },
  { authId: "seed:maker-b", displayName: "Maker B", want: 1 },
] as const;

export const boardDemoGap = internalQuery({
  args: {},
  handler: async (ctx) => {
    const spot = await ctx.db
      .query("spots")
      .withIndex("by_city_slug", (q) =>
        q.eq("citySlug", "haarlem").eq("slug", "anne-max"),
      )
      .unique();
    if (!spot) {
      return { needed: 0 };
    }

    let needed = 0;
    for (const maker of SEED_MAKERS) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_authId", (q) => q.eq("authId", maker.authId))
        .unique();
      if (!user) {
        needed += maker.want;
        continue;
      }
      const makerKey = serializeMakerKey({ kind: "user", userId: user._id });
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_maker_spot", (q) =>
          q.eq("makerKey", makerKey).eq("spotId", spot._id),
        )
        .collect();
      const visible = posts.filter((post) => post.visibility.kind === "visible");
      needed += Math.max(0, maker.want - visible.length);
    }
    return { needed };
  },
});

export const applyBoardDemo = internalMutation({
  args: { storageId: v.union(v.id("_storage"), v.null()) },
  handler: async (ctx, { storageId }) => {
    const spot = await ctx.db
      .query("spots")
      .withIndex("by_city_slug", (q) =>
        q.eq("citySlug", "haarlem").eq("slug", "anne-max"),
      )
      .unique();
    if (!spot) {
      throw new Error("Haarlem anne-max is not seeded");
    }

    for (const maker of SEED_MAKERS) {
      const user = await ensureUserByAuthId(ctx, {
        authId: maker.authId,
        displayName: maker.displayName,
        avatarUrl: null,
      });
      const makerKey = serializeMakerKey({ kind: "user", userId: user._id });
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_maker_spot", (q) =>
          q.eq("makerKey", makerKey).eq("spotId", spot._id),
        )
        .collect();
      const visible = posts.filter((post) => post.visibility.kind === "visible");
      const missing = Math.max(0, maker.want - visible.length);
      if (missing > 0) {
        if (!storageId) {
          throw new Error("Demo seed needs a stored image");
        }
        for (let i = 0; i < missing; i += 1) {
          await ctx.db.insert("posts", {
            spotId: spot._id,
            makerKey,
            createdAt: Date.now() + i,
            visibility: { kind: "visible" },
            body: {
              kind: "inApp",
              media: {
                mediaType: "photo",
                storageId,
                replacedAt: null,
              },
            },
          });
        }
      }
      await applyVisiblePosts(ctx, { spotId: spot._id, makerKey });
      await ensurePassport(ctx, user._id);
    }
  },
});

export const boardDemo = internalAction({
  args: {},
  handler: async (ctx): Promise<{ ok: true; created: number }> => {
    const gap: { needed: number } = await ctx.runQuery(
      internal.seed.boardDemoGap,
      {},
    );
    let storageId: Id<"_storage"> | null = null;
    if (gap.needed > 0) {
      const blob = new Blob([PIXEL_PNG], { type: "image/png" });
      storageId = await ctx.storage.store(blob);
    }
    await ctx.runMutation(internal.seed.applyBoardDemo, { storageId });
    return { ok: true, created: gap.needed };
  },
});

export const socialDemo = internalMutation({
  args: {},
  handler: async (ctx) => {
    await ingestSocial(ctx, {
      caption: "Brunch at STACH #bragfast",
      locationPlaceId: "seed:nl:haarlem:stach",
      makerKey: "ig:seed-hard-tag",
      embed: {
        platform: "instagram",
        permalink: "https://www.instagram.com/p/BragFastHardTag/",
        platformMediaId: "BragFastHardTag",
      },
    });
    await ingestSocial(ctx, {
      caption: "Breakfast at Jopenkerk #bragfast",
      locationPlaceId: null,
      makerKey: "ig:seed-caption",
      embed: {
        platform: "instagram",
        permalink: "https://www.instagram.com/p/BragFastCaption/",
        platformMediaId: "BragFastCaption",
      },
    });
  },
});

export const placeAddDemo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const submittedBy = await ensureUserByAuthId(ctx, {
      authId: "seed:place-add",
      displayName: "Place Adder",
      avatarUrl: null,
    });
    await applyPlaceAdd(ctx, {
      placeId: "seed:nl:haarlem:de-koffiesalon",
      name: "De Koffiesalon Haarlem",
      address: "Grote Markt 2, Haarlem",
      geo: HAARLEM,
      types: ["cafe"],
      citySlug: "haarlem",
      submittedBy: submittedBy._id,
    });
    await applyPlaceAdd(ctx, {
      placeId: "seed:nl:haarlem:shell-station",
      name: "Shell Haarlem",
      address: "Amsterdamsevaart 1, Haarlem",
      geo: HAARLEM,
      types: ["gas_station"],
      citySlug: "haarlem",
      submittedBy: submittedBy._id,
    });
  },
});

export const socialState = internalQuery({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    hardTagOn: string | null;
    pendingCaption: string | null;
    pendingCaptionSpot: string | null;
    liveUserAdd: string | null;
    queuedPetrol: boolean;
  }> => {
    const hardTag = await ctx.db
      .query("posts")
      .withIndex("by_platform_media", (q) =>
        q.eq("body.embed.platformMediaId", "BragFastHardTag"),
      )
      .unique();
    const hardTagSpot = hardTag ? await ctx.db.get(hardTag.spotId) : null;

    const pendingMatches = await ctx.db
      .query("aiMatchQueue")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    const captionRow = pendingMatches.find(
      (row) => row.embed.platformMediaId === "BragFastCaption",
    );
    const proposed = captionRow?.proposedSpotId
      ? await ctx.db.get(captionRow.proposedSpotId)
      : null;

    const cafe = await ctx.db
      .query("spots")
      .withIndex("by_placeId", (q) =>
        q.eq("placeId", "seed:nl:haarlem:de-koffiesalon"),
      )
      .unique();

    const petrolRows = await ctx.db
      .query("spotAddQueue")
      .withIndex("by_placeId", (q) =>
        q.eq("placeId", "seed:nl:haarlem:shell-station"),
      )
      .collect();

    return {
      hardTagOn: hardTagSpot?.slug ?? null,
      pendingCaption: captionRow?.caption ?? null,
      pendingCaptionSpot: proposed?.slug ?? null,
      liveUserAdd:
        cafe && cafe.listingStatus === "listed" ? cafe.slug : null,
      queuedPetrol: petrolRows.some((row) => row.status === "pending"),
    };
  },
});

const HONING_HOURS = {
  timezone: "Europe/Amsterdam",
  periods: [1, 2, 3, 4, 5, 6].map((day) => ({
    day,
    open: "06:30",
    close: "16:00",
  })),
};

export const hygieneDemo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const haarlem = cityCentroid("haarlem") ?? HAARLEM;
    const now = Date.now();
    const snapshots: PlacesSnapshot[] = [
      {
        placeId: "seed:nl:haarlem:bregje",
        name: "Bregje",
        address: "Barteljorisstraat 10, Haarlem",
        geo: haarlem,
        types: ["cafe"],
        hours: WEEKDAY_BREAKFAST,
        businessStatus: "OPERATIONAL",
        citySlug: "haarlem",
      },
      {
        placeId: "seed:nl:haarlem:bakkerij-honing",
        name: "Bakkerij Honing",
        address: "Koningsstraat 41, 2011 TB Haarlem",
        geo: { lat: 52.3822, lng: 4.6378 },
        types: ["bakery"],
        hours: HONING_HOURS,
        businessStatus: "OPERATIONAL",
        citySlug: "haarlem",
      },
      {
        placeId: "seed:nl:amsterdam:de-bakkerswinkel",
        name: "De Bakkerswinkel Amsterdam",
        address: "Warmoesstraat 69, Amsterdam",
        geo: { lat: 52.376, lng: 4.9 },
        types: ["bakery"],
        hours: WEEKDAY_BREAKFAST,
        businessStatus: "OPERATIONAL",
        citySlug: "amsterdam",
      },
      {
        placeId: "seed:nl:haarlem:hygiene-petrol",
        name: "Shell Hygiene",
        address: "Amsterdamsevaart 1, Haarlem",
        geo: haarlem,
        types: ["gas_station"],
        hours: null,
        businessStatus: "OPERATIONAL",
        citySlug: "haarlem",
      },
      {
        placeId: "seed:nl:haarlem:ghost-bakery",
        name: "Ghost Bakery Haarlem",
        address: "Gedempte Oude Gracht 1, Haarlem",
        geo: haarlem,
        types: ["bakery"],
        hours: null,
        businessStatus: "CLOSED_PERMANENTLY",
        citySlug: "haarlem",
      },
      {
        placeId: "seed:nl:haarlem:oude-banketbakker",
        name: "De Oude Banketbakker",
        address: "Grote Markt 1, 2011 RD Haarlem",
        geo: { lat: 52.3812, lng: 4.636 },
        types: ["bakery"],
        hours: null,
        businessStatus: "OPERATIONAL",
        citySlug: "haarlem",
      },
    ];
    for (const snapshot of snapshots) {
      await applySnapshot(ctx, snapshot, now);
    }
  },
});

export const hygieneState = internalQuery({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    bregje: string | null;
    honingOpen: string | null;
    amsterdamBakery: string | null;
    petrolSpot: boolean;
    petrolQueued: boolean;
    ghostSpot: boolean;
    oudeBanket: "gravestone" | "listed" | "missing";
  }> => {
    const bregje = await ctx.db
      .query("spots")
      .withIndex("by_placeId", (q) =>
        q.eq("placeId", "seed:nl:haarlem:bregje"),
      )
      .unique();
    const honing = await ctx.db
      .query("spots")
      .withIndex("by_placeId", (q) =>
        q.eq("placeId", "seed:nl:haarlem:bakkerij-honing"),
      )
      .unique();
    const amsterdam = await ctx.db
      .query("spots")
      .withIndex("by_placeId", (q) =>
        q.eq("placeId", "seed:nl:amsterdam:de-bakkerswinkel"),
      )
      .unique();
    const petrol = await ctx.db
      .query("spots")
      .withIndex("by_placeId", (q) =>
        q.eq("placeId", "seed:nl:haarlem:hygiene-petrol"),
      )
      .unique();
    const petrolQueue = await ctx.db
      .query("spotAddQueue")
      .withIndex("by_placeId", (q) =>
        q.eq("placeId", "seed:nl:haarlem:hygiene-petrol"),
      )
      .collect();
    const ghost = await ctx.db
      .query("spots")
      .withIndex("by_placeId", (q) =>
        q.eq("placeId", "seed:nl:haarlem:ghost-bakery"),
      )
      .unique();
    const oude = await ctx.db
      .query("spots")
      .withIndex("by_placeId", (q) =>
        q.eq("placeId", "seed:nl:haarlem:oude-banketbakker"),
      )
      .unique();

    return {
      bregje:
        bregje && bregje.listingStatus === "listed" ? bregje.slug : null,
      honingOpen: honing?.hours?.periods[0]?.open ?? null,
      amsterdamBakery:
        amsterdam &&
        amsterdam.listingStatus === "listed" &&
        amsterdam.citySlug === "amsterdam"
          ? amsterdam.slug
          : null,
      petrolSpot: petrol !== null,
      petrolQueued: petrolQueue.length > 0,
      ghostSpot: ghost !== null,
      oudeBanket: oude
        ? oude.listingStatus === "gravestone"
          ? "gravestone"
          : "listed"
        : "missing",
    };
  },
});

