import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { username } from "better-auth/plugins";
import { ConvexError } from "convex/values";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import authConfig from "./auth.config";
import { DomainParseError, parseUserSlug } from "../domain/ids";
import { mintPassportFromUsername } from "./model/users";

const siteUrl = process.env.SITE_URL!;

export const authComponent = createClient<DataModel>(components.betterAuth);

function isUserSlug(value: string): boolean {
  try {
    parseUserSlug(value);
    return true;
  } catch (error) {
    if (error instanceof DomainParseError) {
      return false;
    }
    throw error;
  }
}

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    emailAndPassword: { enabled: true },
    socialProviders:
      googleClientId && googleClientSecret
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            },
          }
        : {},
    plugins: [
      username({
        minUsernameLength: 3,
        usernameValidator: isUserSlug,
      }),
      convex({ authConfig }),
    ],
  });
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await authComponent.getAuthUser(ctx);
    } catch (error) {
      if (error instanceof ConvexError && error.data === "Unauthenticated") {
        return null;
      }
      throw error;
    }
  },
});

export const mintPassport = mutation({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    const raw =
      typeof authUser.username === "string" ? authUser.username.trim() : "";
    let slug;
    try {
      slug = parseUserSlug(raw);
    } catch (error) {
      if (error instanceof DomainParseError) {
        throw new ConvexError("invalidUsername");
      }
      throw error;
    }
    const displayName =
      (authUser.name ?? "").trim() || authUser.email || slug;
    return mintPassportFromUsername(ctx, {
      authId: authUser._id,
      displayName,
      avatarUrl: authUser.image ?? null,
      slug,
    });
  },
});
