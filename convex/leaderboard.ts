import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { DomainParseError, parseUserSlug } from "../domain/ids";
import { rankedLeaderboard, type LeaderboardRow } from "../domain/leaderboard";

export const rankedAdders = query({
  args: {},
  handler: async (ctx): Promise<LeaderboardRow[]> => {
    // Accounts without a valid passport earn nothing on the board
    const usernames = new Map<Id<"users">, string | null>();
    const usernameOf = async (
      userId: Id<"users"> | undefined,
    ): Promise<string | null> => {
      if (userId === undefined) {
        return null;
      }
      if (!usernames.has(userId)) {
        const slug = (await ctx.db.get(userId))?.passport?.slug;
        let username: string | null = null;
        try {
          username = slug ? parseUserSlug(slug) : null;
        } catch (error) {
          if (!(error instanceof DomainParseError)) {
            throw error;
          }
        }
        usernames.set(userId, username);
      }
      return usernames.get(userId) ?? null;
    };

    const spots = [];
    for (const spot of await ctx.db.query("spots").collect()) {
      spots.push({
        id: spot._id,
        addedBy: await usernameOf(spot.addedBy),
        addedAt: spot._creationTime,
      });
    }
    const photos = [];
    for (const photo of await ctx.db.query("photos").collect()) {
      photos.push({
        id: photo._id,
        uploadedBy: await usernameOf(photo.uploadedBy),
        createdAt: photo.createdAt,
      });
    }
    const likes = (await ctx.db.query("likes").collect()).map((like) => ({
      spotId: like.spotId,
      ...(like.viaPhotoId ? { viaPhotoId: like.viaPhotoId } : {}),
    }));
    return rankedLeaderboard({ spots, photos, likes });
  },
});
