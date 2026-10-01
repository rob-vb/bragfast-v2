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

/** Mail the owner so a report gets its 24-hour look. */
export const sendModerationAlert = internalAction({
  args: { subject: v.string(), html: v.string() },
  handler: async (_ctx, args) => {
    const to = process.env.OWNER_EMAIL;
    if (!to) {
      console.warn(`[brag.fast] No OWNER_EMAIL for: ${args.subject}`);
      return;
    }
    await sendResendEmail({ to, subject: args.subject, html: args.html });
  },
});
