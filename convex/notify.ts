import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { bragLiveEmail } from "../domain/notify";
import { sendResendEmail } from "./mail";

export const sendBragLive = internalAction({
  args: {
    email: v.string(),
    spotName: v.string(),
    path: v.string(),
  },
  handler: async (_ctx, args) => {
    const email = args.email.trim();
    if (email.length === 0) {
      return;
    }
    const url = `${process.env.SITE_URL}${args.path}`;
    const mail = bragLiveEmail({ spotName: args.spotName, url });
    if (!mail) {
      return;
    }
    await sendResendEmail({
      to: email,
      subject: mail.subject,
      html: mail.html,
    });
  },
});
