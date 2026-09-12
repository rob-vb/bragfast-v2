import { internalMutation } from "./_generated/server";

export const purgeCatalog = internalMutation({
  args: {},
  handler: async (ctx) => {
    let spots = 0;
    for (const row of await ctx.db.query("spots").collect()) {
      await ctx.db.delete(row._id);
      spots += 1;
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
    for (const file of await ctx.db.system.query("_storage").collect()) {
      await ctx.storage.delete(file._id);
      storageFiles += 1;
    }

    return { spots, instagramUsers, storageFiles };
  },
});
