import { query } from "./_generated/server";
import { DomainParseError, parseUserSlug } from "../domain/ids";
import { rankedLeaderboard, type AdderRow } from "../domain/leaderboard";

export const rankedAdders = query({
  args: {},
  handler: async (ctx): Promise<AdderRow[]> => {
    const spots = await ctx.db.query("spots").collect();
    const contributions = [];
    for (const spot of spots) {
      if (spot.addedBy === undefined) {
        continue;
      }
      const adder = await ctx.db.get(spot.addedBy);
      const slug = adder?.passport?.slug;
      if (!slug) {
        continue;
      }
      try {
        contributions.push({
          username: parseUserSlug(slug),
          likeCount: spot.likeCount ?? 0,
          addedAt: spot._creationTime,
        });
      } catch (error) {
        if (error instanceof DomainParseError) {
          continue;
        }
        throw error;
      }
    }
    return rankedLeaderboard(contributions);
  },
});
