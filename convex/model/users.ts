import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { passportSlugCandidate, planPassport } from "../../domain/passport";
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

export async function ensurePassport(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"users">> {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User missing while minting passport");
  }

  const plan = planPassport(user.passport, Date.now());
  if (plan.action === "keep") {
    return user;
  }

  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const slug = passportSlugCandidate(user.displayName, attempt);
    const occupied = await ctx.db
      .query("users")
      .withIndex("by_passport_slug", (q) => q.eq("passport.slug", slug))
      .unique();
    if (occupied && occupied._id !== userId) {
      continue;
    }
    await ctx.db.patch(userId, {
      passport: { slug, since: plan.since },
    });
    const updated = await ctx.db.get(userId);
    if (!updated) {
      throw new Error("Passport patch did not persist");
    }
    return updated;
  }

  throw new Error("Passport slug attempts exhausted");
}
