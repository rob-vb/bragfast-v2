import { query } from "./_generated/server";

export const instagramConfigured = query({
  args: {},
  handler: async () =>
    Boolean(
      process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET,
    ),
});
