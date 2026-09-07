import { ConvexError } from "convex/values";
import { isOwnerEmail } from "../../domain/moderation";
import { authComponent } from "../auth";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export function ownerEmail(): string | undefined {
  return process.env.OWNER_EMAIL;
}

export async function requireOwner(ctx: QueryCtx | MutationCtx) {
  const authUser = await authComponent.safeGetAuthUser(ctx);
  if (!isOwnerEmail(authUser?.email, ownerEmail())) {
    throw new ConvexError("Forbidden");
  }
  return authUser;
}
