import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import type { UserSlug } from "../../domain/ids";
import { planMintPassport } from "../../domain/passport";
import { authComponent } from "../auth";

export async function ensureUserByAuthId(
  ctx: MutationCtx,
  input: {
    authId: string;
    displayName: string;
    avatarUrl: string | null;
  },
): Promise<Doc<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_authId", (q) => q.eq("authId", input.authId))
    .unique();
  if (existing) {
    return existing;
  }

  const id = await ctx.db.insert("users", {
    authId: input.authId,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    passport: null,
    igUserId: null,
  });
  const created = await ctx.db.get(id);
  if (!created) {
    throw new Error("App user insert did not persist");
  }
  return created;
}

export async function ensureAppUser(ctx: MutationCtx): Promise<Doc<"users">> {
  const authUser = await authComponent.getAuthUser(ctx);
  const displayName =
    (authUser.name ?? "").trim() || authUser.email || "bragger";
  return ensureUserByAuthId(ctx, {
    authId: authUser._id,
    displayName,
    avatarUrl: authUser.image ?? null,
  });
}

export async function mintPassportFromUsername(
  ctx: MutationCtx,
  input: {
    authId: string;
    displayName: string;
    avatarUrl: string | null;
    slug: UserSlug;
  },
): Promise<Doc<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_authId", (q) => q.eq("authId", input.authId))
    .unique();
  const occupied = await ctx.db
    .query("users")
    .withIndex("by_passport_slug", (q) => q.eq("passport.slug", input.slug))
    .unique();
  const occupiedByOther = occupied !== null && occupied._id !== existing?._id;
  const plan = planMintPassport({
    existing: existing?.passport ?? null,
    occupiedByOther,
    slug: input.slug,
    now: Date.now(),
  });

  if (plan.action === "reject") {
    throw new ConvexError("usernameTaken");
  }
  if (plan.action === "keep") {
    if (!existing) {
      throw new Error("Passport keep without user");
    }
    return existing;
  }

  if (existing) {
    await ctx.db.patch(existing._id, {
      passport: { slug: plan.slug, since: plan.since },
    });
    const updated = await ctx.db.get(existing._id);
    if (!updated) {
      throw new Error("Passport patch did not persist");
    }
    return updated;
  }

  const id = await ctx.db.insert("users", {
    authId: input.authId,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    passport: { slug: plan.slug, since: plan.since },
    igUserId: null,
  });
  const created = await ctx.db.get(id);
  if (!created) {
    throw new Error("App user insert did not persist");
  }
  return created;
}
