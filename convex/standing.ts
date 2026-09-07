import { internalMutation } from "./_generated/server";
import { refreshSpotStanding } from "./model/votes";

export const expireWindows = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("spots")
      .withIndex("by_windowExpiresAt", (q) => q.lt("windowExpiresAt", now))
      .collect();
    for (const spot of expired) {
      await refreshSpotStanding(ctx, spot._id);
    }
  },
});
