import { getAuthUserId } from "@convex-dev/auth/server";
import { action, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { stripe } from "../stripe";

export const list = query({
  args: {},
  handler: async (context) => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new Error("Unauthorized");

    const account = await context.db
      .query("stripeAccounts")
      .withIndex("byEntityId", (q) => q.eq("entityId", userId))
      .first();

    if (!account) return null;

    const caps = await context.db
      .query("stripeCapabilities")
      .withIndex("byAccountId", (q) => q.eq("accountId", account.accountId))
      .collect();

    const cardPayments =
      caps.find((c) => c.stripe.id === "card_payments") ?? null;
    const transfers = caps.find((c) => c.stripe.id === "transfers") ?? null;

    return { cardPayments, transfers };
  },
});

export const request = action({
  args: {},
  handler: async (context) => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new Error("Unauthorized");

    const account = await context.runQuery(internal.marketplace.accounts.get);

    if (!account) throw new Error("No account found");

    await stripe.client.accounts.updateCapability(
      account.stripe.id,
      "card_payments",
      { requested: true },
    );

    await stripe.client.accounts.updateCapability(
      account.stripe.id,
      "transfers",
      { requested: true },
    );
  },
});
