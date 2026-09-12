import { internalMutation } from "./_generated/server";

export const purgeCatalog = internalMutation({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
    const inAppStorageIds = posts.flatMap((post) =>
      post.body.kind === "inApp" ? [post.body.media.storageId] : [],
    );

    let spots = 0;
    for (const row of await ctx.db.query("spots").collect()) {
      await ctx.db.delete(row._id);
      spots += 1;
    }

    let postCount = 0;
    for (const row of posts) {
      await ctx.db.delete(row._id);
      postCount += 1;
    }

    let makerVotes = 0;
    for (const row of await ctx.db.query("makerVotes").collect()) {
      await ctx.db.delete(row._id);
      makerVotes += 1;
    }

    let aiMatchQueue = 0;
    for (const row of await ctx.db.query("aiMatchQueue").collect()) {
      await ctx.db.delete(row._id);
      aiMatchQueue += 1;
    }

    let spotAddQueue = 0;
    for (const row of await ctx.db.query("spotAddQueue").collect()) {
      await ctx.db.delete(row._id);
      spotAddQueue += 1;
    }

    let placesQuota = 0;
    for (const row of await ctx.db.query("placesQuota").collect()) {
      await ctx.db.delete(row._id);
      placesQuota += 1;
    }

    let ingestCursor = 0;
    for (const row of await ctx.db.query("ingestCursor").collect()) {
      await ctx.db.delete(row._id);
      ingestCursor += 1;
    }

    let placesSeen = 0;
    for (const row of await ctx.db.query("placesSeen").collect()) {
      await ctx.db.delete(row._id);
      placesSeen += 1;
    }

    let oauthStates = 0;
    for (const row of await ctx.db.query("oauthStates").collect()) {
      await ctx.db.delete(row._id);
      oauthStates += 1;
    }

    let instagramUsers = 0;
    for (const user of await ctx.db.query("users").collect()) {
      if (
        user.igUserId === null &&
        (user.igAccessToken === undefined || user.igAccessToken === null) &&
        (user.igTokenExpiresAt === undefined || user.igTokenExpiresAt === null)
      ) {
        continue;
      }
      await ctx.db.patch(user._id, {
        igUserId: null,
        igAccessToken: null,
        igTokenExpiresAt: null,
      });
      instagramUsers += 1;
    }

    let storageFiles = 0;
    const leftoverIds = new Set(inAppStorageIds);
    if (leftoverIds.size === 0) {
      for (const file of await ctx.db.system.query("_storage").collect()) {
        leftoverIds.add(file._id);
      }
    }
    for (const storageId of leftoverIds) {
      await ctx.storage.delete(storageId);
      storageFiles += 1;
    }

    return {
      spots,
      posts: postCount,
      makerVotes,
      aiMatchQueue,
      spotAddQueue,
      placesQuota,
      ingestCursor,
      placesSeen,
      oauthStates,
      instagramUsers,
      storageFiles,
    };
  },
});
