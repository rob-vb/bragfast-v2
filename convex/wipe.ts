import type { TableNames } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";

const WIPE_TABLES = [
  "spots",
  "posts",
  "makerVotes",
  "aiMatchQueue",
  "spotAddQueue",
  "placesQuota",
  "ingestCursor",
  "placesSeen",
  "oauthStates",
] as const satisfies readonly TableNames[];

async function deleteAllRows(
  ctx: MutationCtx,
  table: (typeof WIPE_TABLES)[number],
) {
  let deleted = 0;
  for (const row of await ctx.db.query(table).collect()) {
    await ctx.db.delete(row._id);
    deleted += 1;
  }
  return deleted;
}

export const purgeCatalog = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tableCounts = {} as Record<(typeof WIPE_TABLES)[number], number>;
    for (const table of WIPE_TABLES) {
      tableCounts[table] = await deleteAllRows(ctx, table);
    }

    let postReports = 0;
    for (const report of await ctx.db.query("reports").collect()) {
      if (report.target.kind !== "post") {
        continue;
      }
      await ctx.db.delete(report._id);
      postReports += 1;
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

    return { ...tableCounts, postReports, instagramUsers, storageFiles };
  },
});
