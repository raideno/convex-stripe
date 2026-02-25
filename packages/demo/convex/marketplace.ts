import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { stripe } from "./stripe";
import Stripe from "stripe";

export const products = query({
  args: {},
  handler: async (context) => {
    return context.db.query("stripeProducts").collect();
  },
});

export const account = query({
  args: {},
  handler: async (context) => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new Error("Unauthorized");

    const account = await context.db
      .query("accounts")
      .withIndex("byUserId", (q) => q.eq("userId", userId))
      .first();

    return account || null;
  },
});

/**
 * We'll support Express which offers a stripe hosted dashboard, minimal one, users don't own stripe accounts directly but go through you to access the dashboard, you have more control over them.
 *
 * We'll also support Custom, which is the same as Express but without the hosted dashboard.
 *
 * Standard, we'll try to support it, in here users have their own stripe accounts.
 * But the flow is special, there is oAuth involved and it needs to be handled in a special way.
 */

export const setup = query({
  args: {},
  handler: async (context) => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new Error("Unauthorized");

    const account = await stripe.accounts.create(context as any, {
      entityId: userId,
      type: "express",
    });

    const link = await stripe.accounts.link(context as any, {
      refresh_url: `${process.env.BASE_URL}/create-account-link-refresh`,
      return_url: `${process.env.BASE_URL}/create-account-link-return`,
      type: "account_onboarding",
      account: account.accountId,
    });

    // TODO: redirect them to here.
    link.url;

    return account;
  },
});
