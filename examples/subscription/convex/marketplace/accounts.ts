import { getAuthUserId } from "@convex-dev/auth/server";
import { action, internalQuery, query } from "../_generated/server";
import { stripe } from "../stripe";

export const setup = action({
  args: {},
  handler: async (context) => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new Error("Unauthorized");

    const account = await stripe.accounts.create(context, {
      entityId: userId,
      type: "express",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    const link = await stripe.accounts.link(context, {
      refresh_url: `${process.env.SITE_URL}/?create-account-link-refresh=success`,
      return_url: `${process.env.SITE_URL}/?create-account-link-return=success`,
      type: "account_onboarding",
      account: account.accountId,
    });

    return link;
  },
});

export const self = query({
  args: {},
  handler: async (context) => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new Error("Unauthorized");

    const account = await context.db
      .query("stripeAccounts")
      .withIndex("byEntityId", (q) => q.eq("entityId", userId))
      .first();

    return account || null;
  },
});

export const get = internalQuery({
  args: {},
  handler: async (context) => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new Error("Unauthorized");

    const account = await context.db
      .query("stripeAccounts")
      .withIndex("byEntityId", (q) => q.eq("entityId", userId))
      .first();

    return account || null;
  },
});
