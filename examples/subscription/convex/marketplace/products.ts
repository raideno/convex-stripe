import { getAuthUserId } from "@convex-dev/auth/server";
import { action, internalQuery } from "../_generated/server";
import { stripe } from "../stripe";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * We'll support Express which offers a stripe hosted dashboard, minimal one, users don't own stripe accounts directly but go through you to access the dashboard, you have more control over them.
 *
 * We'll also support Custom, which is the same as Express but without the hosted dashboard.
 *
 * Standard, we'll try to support it, in here users have their own stripe accounts.
 * But the flow is special, there is oAuth involved and it needs to be handled in a special way.
 */

export const count = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (context, args) => {
    const account = await context.db
      .query("stripeAccounts")
      .withIndex("byEntityId", (q) => q.eq("entityId", args.userId))
      .first();

    if (!account) return 0;

    const accountProducts = await context.db
      .query("stripeProducts")
      .withIndex("byAccountId", (q) => q.eq("accountId", account.accountId))
      .collect();

    return accountProducts.length;
  },
});

export const create = action({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    images: v.optional(v.array(v.string())),
  },
  handler: async (context, args) => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new ConvexError("Unauthorized");

    const account = await context.runQuery(internal.marketplace.accounts.get);

    if (!account) throw new ConvexError("No account found");

    if (args.images && args.images.length > 8) {
      throw new ConvexError("You can only provide up to 8 images");
    }

    const accountProducts = await context.runQuery(
      internal.marketplace.products.count,
      {
        userId: userId,
      },
    );

    if (accountProducts > 8)
      throw new ConvexError(
        "You have reached the maximum number of products (8)",
      );

    const product = await stripe.client.products.create(
      {
        name: args.name,
        description: args.description,
        images: args.images,
        default_price_data: {
          unit_amount: Math.round(args.price * 100),
          currency: "usd",
        },
      },
      {
        stripeAccount: account.stripe.id,
      },
    );

    return product;
  },
});
