import { mutation } from "./_generated/server";
import { authComponent } from "./auth";
import { deleteAccount } from "./model/account";

// The iOS app starts account deletion here (App Store guideline 5.1.1(v)).
export const deleteMine = mutation({
  args: {},
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    return await deleteAccount(ctx, authUser._id);
  },
});
