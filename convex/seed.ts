import { internalMutation } from "./_generated/server";
import { NL_CITIES } from "../domain/cities";
import { upsertCity } from "./model/spots";

export const cities = internalMutation({
  args: {},
  handler: async (ctx) => {
    const keep = new Set(NL_CITIES.map((city) => city.slug));
    for (const city of NL_CITIES) {
      await upsertCity(ctx, {
        slug: city.slug,
        nameNl: city.nameNl,
        nameEn: city.nameEn,
        featuredOrder: city.featuredOrder,
      });
    }
    const existing = await ctx.db.query("cities").collect();
    for (const row of existing) {
      if (!keep.has(row.slug)) {
        await ctx.db.delete(row._id);
      }
    }
  },
});
