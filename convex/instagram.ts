import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  action,
  httpAction,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { parseInstagramMedia, type InstagramMedia } from "../domain/instagram";
import { authComponent } from "./auth";
import {
  completeInstagramLink,
  ingestInstagramMedia,
  unlinkInstagram,
} from "./model/instagram";
import { ensureAppUser } from "./model/users";

type InstagramApp = { clientId: string; clientSecret: string };

function instagramApp(): InstagramApp | null {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return null;
  }
  return { clientId, clientSecret };
}

function redirectUri(): string {
  return `${process.env.CONVEX_SITE_URL}/instagram/callback`;
}

function publicSite(): string {
  return process.env.SITE_URL ?? "http://77.42.31.66";
}

function bounce(path: string): Response {
  return Response.redirect(`${publicSite()}${path}`, 302);
}

export const status = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ configured: boolean; linked: boolean }> => {
    const configured = Boolean(instagramApp());
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser) {
      return { configured, linked: false };
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", authUser._id))
      .unique();
    return { configured, linked: Boolean(user?.igUserId) };
  },
});

export const startConnect = action({
  args: {},
  handler: async (ctx): Promise<{ url: string }> => {
    const app = instagramApp();
    if (!app) {
      throw new ConvexError("Instagram is not configured");
    }
    const authUser = await authComponent.getAuthUser(ctx);
    const state = crypto.randomUUID();
    const displayName =
      (typeof authUser.name === "string" ? authUser.name.trim() : "") ||
      (typeof authUser.email === "string" ? authUser.email : "") ||
      "bragger";
    await ctx.runMutation(internal.instagram.saveState, {
      state,
      authId: authUser._id,
      displayName,
      avatarUrl: typeof authUser.image === "string" ? authUser.image : null,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    const url = new URL("https://www.instagram.com/oauth/authorize");
    url.searchParams.set("client_id", app.clientId);
    url.searchParams.set("redirect_uri", redirectUri());
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "instagram_business_basic");
    url.searchParams.set("state", state);
    return { url: url.toString() };
  },
});

export const disconnect = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ensureAppUser(ctx);
    await unlinkInstagram(ctx, user._id);
  },
});

export const saveState = internalMutation({
  args: {
    state: v.string(),
    authId: v.string(),
    displayName: v.string(),
    avatarUrl: v.union(v.string(), v.null()),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("oauthStates", args);
  },
});

export const consumeState = internalMutation({
  args: { state: v.string() },
  handler: async (
    ctx,
    { state },
  ): Promise<{
    authId: string;
    displayName: string;
    avatarUrl: string | null;
  } | null> => {
    const row = await ctx.db
      .query("oauthStates")
      .withIndex("by_state", (q) => q.eq("state", state))
      .unique();
    if (!row) {
      return null;
    }
    await ctx.db.delete(row._id);
    if (row.expiresAt < Date.now()) {
      return null;
    }
    return {
      authId: row.authId,
      displayName: row.displayName,
      avatarUrl: row.avatarUrl,
    };
  },
});

export const finishLink = internalMutation({
  args: {
    authId: v.string(),
    displayName: v.string(),
    avatarUrl: v.union(v.string(), v.null()),
    igUserId: v.string(),
    accessToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await completeInstagramLink(ctx, args);
  },
});

export const ingestOne = internalMutation({
  args: {
    makerKey: v.string(),
    media: v.object({
      id: v.string(),
      caption: v.string(),
      permalink: v.string(),
      createdAt: v.union(v.number(), v.null()),
      locationName: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, args) => {
    await ingestInstagramMedia(ctx, {
      makerKey: args.makerKey,
      media: args.media,
    });
  },
});

export const linkedAccounts = internalQuery({
  args: {},
  handler: async (
    ctx,
  ): Promise<
    Array<{
      userId: Id<"users">;
      makerKey: string;
      accessToken: string;
    }>
  > => {
    const rows = await ctx.db.query("users").collect();
    const out: Array<{
      userId: Id<"users">;
      makerKey: string;
      accessToken: string;
    }> = [];
    for (const row of rows) {
      if (!row.igUserId || !row.igAccessToken) {
        continue;
      }
      out.push({
        userId: row._id,
        makerKey: `user:${row._id}`,
        accessToken: row.igAccessToken,
      });
    }
    return out;
  },
});

async function exchangeCode(
  app: InstagramApp,
  code: string,
): Promise<{ accessToken: string; igUserId: string; expiresAt: number }> {
  const body = new URLSearchParams({
    client_id: app.clientId,
    client_secret: app.clientSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri(),
    code,
  });
  const response = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error("Instagram token exchange failed");
  }
  const bundled = Array.isArray(payload.data) ? payload.data[0] : payload;
  const record =
    bundled !== null && typeof bundled === "object"
      ? (bundled as Record<string, unknown>)
      : {};
  const shortToken =
    typeof record.access_token === "string" ? record.access_token : "";
  const igUserId =
    typeof record.user_id === "string"
      ? record.user_id
      : typeof record.user_id === "number"
        ? String(record.user_id)
        : "";
  if (shortToken.length === 0 || igUserId.length === 0) {
    throw new Error("Instagram token payload incomplete");
  }
  const longLived = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(app.clientSecret)}&access_token=${encodeURIComponent(shortToken)}`,
  );
  const longPayload = (await longLived.json()) as Record<string, unknown>;
  const accessToken =
    typeof longPayload.access_token === "string"
      ? longPayload.access_token
      : shortToken;
  const expiresIn =
    typeof longPayload.expires_in === "number" ? longPayload.expires_in : 3600;
  return {
    accessToken,
    igUserId,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

async function fetchHashtagMedia(
  accessToken: string,
): Promise<InstagramMedia[]> {
  const out: InstagramMedia[] = [];
  let url: string | null =
    `https://graph.instagram.com/me/media?fields=id,caption,permalink,timestamp,location&limit=50&access_token=${encodeURIComponent(accessToken)}`;
  for (let page = 0; page < 8 && url; page += 1) {
    const response = await fetch(url);
    if (!response.ok) {
      break;
    }
    const payload = (await response.json()) as {
      data?: unknown[];
      paging?: { next?: string };
    };
    for (const item of payload.data ?? []) {
      const media = parseInstagramMedia(item);
      if (media) {
        out.push(media);
      }
    }
    url = payload.paging?.next ?? null;
  }
  return out;
}

export const importForMaker = internalAction({
  args: { makerKey: v.string(), accessToken: v.string() },
  handler: async (ctx, args) => {
    const media = await fetchHashtagMedia(args.accessToken);
    for (const item of media) {
      await ctx.runMutation(internal.instagram.ingestOne, {
        makerKey: args.makerKey,
        media: item,
      });
    }
  },
});

export const importLinked = internalAction({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.runQuery(internal.instagram.linkedAccounts, {});
    for (const account of accounts) {
      await ctx.runAction(internal.instagram.importForMaker, {
        makerKey: account.makerKey,
        accessToken: account.accessToken,
      });
    }
  },
});

export const handleCallback = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) {
    return bounce("/?ig=denied");
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const app = instagramApp();
  if (!code || !state || !app) {
    return bounce("/?ig=error");
  }
  const session = await ctx.runMutation(internal.instagram.consumeState, {
    state,
  });
  if (!session) {
    return bounce("/?ig=error");
  }
  try {
    const token = await exchangeCode(app, code);
    const linked = await ctx.runMutation(internal.instagram.finishLink, {
      authId: session.authId,
      displayName: session.displayName,
      avatarUrl: session.avatarUrl,
      igUserId: token.igUserId,
      accessToken: token.accessToken,
      expiresAt: token.expiresAt,
    });
    await ctx.runAction(internal.instagram.importForMaker, {
      makerKey: linked.makerKey,
      accessToken: token.accessToken,
    });
    return bounce("/?ig=connected");
  } catch {
    return bounce("/?ig=error");
  }
});

export const handleDataDeletion = httpAction(async (ctx, request) => {
  const app = instagramApp();
  if (!app) {
    return new Response("not configured", { status: 404 });
  }
  const form = await request.formData().catch(() => null);
  const fromForm = form?.get("signed_request");
  const signed =
    (typeof fromForm === "string" ? fromForm : null) ??
    new URL(request.url).searchParams.get("signed_request");
  const igUserId = signed ? await igUserIdFromSignedRequest(signed, app.clientSecret) : null;
  if (igUserId) {
    await ctx.runMutation(internal.instagram.unlinkByIgUserId, { igUserId });
  }
  const confirmation = crypto.randomUUID();
  return Response.json({
    url: `${publicSite()}/privacy/data-deletion?code=${confirmation}`,
    confirmation_code: confirmation,
  });
});

export const unlinkByIgUserId = internalMutation({
  args: { igUserId: v.string() },
  handler: async (ctx, { igUserId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_igUserId", (q) => q.eq("igUserId", igUserId))
      .unique();
    if (user) {
      await unlinkInstagram(ctx, user._id);
    }
  },
});

function base64UrlToBytes(input: string): Uint8Array {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(`${padded}${pad}`);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function igUserIdFromSignedRequest(
  signed: string,
  secret: string,
): Promise<string | null> {
  const [encodedSig, encodedPayload] = signed.split(".");
  if (!encodedSig || !encodedPayload) {
    return null;
  }
  const payloadBytes = base64UrlToBytes(encodedPayload);
  const payloadJson = new TextDecoder().decode(payloadBytes);
  let payload: { user_id?: unknown };
  try {
    payload = JSON.parse(payloadJson) as { user_id?: unknown };
  } catch {
    return null;
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload),
  );
  const expectedB64 = bytesToBase64Url(expected);
  const given = encodedSig.replace(/=+$/g, "");
  if (expectedB64 !== given) {
    return null;
  }
  return typeof payload.user_id === "string" ? payload.user_id : null;
}
