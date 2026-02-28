import { getAuthUserId } from "@convex-dev/auth/server";
import { action, internalQuery, query } from "./_generated/server";
import { stripe } from "./stripe";
import { ConvexError, v } from "convex/values";
import { api, internal } from "./_generated/api";

export const products = query({
  args: {},
  handler: async (context) => {
    const prices = await context.db.query("stripePrices").collect();
    const products = await context.db.query("stripeProducts").collect();

    return products.map((product) => {
      const price = prices.find(
        (price) => price.stripe.productId === product.productId,
      );
      return {
        ...product,
        stripe: {
          ...product.stripe,
          default_price: price,
        },
      };
    });
  },
});

export const account = query({
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

/**
 * We'll support Express which offers a stripe hosted dashboard, minimal one, users don't own stripe accounts directly but go through you to access the dashboard, you have more control over them.
 *
 * We'll also support Custom, which is the same as Express but without the hosted dashboard.
 *
 * Standard, we'll try to support it, in here users have their own stripe accounts.
 * But the flow is special, there is oAuth involved and it needs to be handled in a special way.
 */

// TODO: complete thing
export const setup = action({
  args: {
    // TODO: shouldn't give possibility to chose type, determine based on whether an account already exists or not
    type: v.union(v.literal("account_onboarding"), v.literal("account_update")),
  },
  handler: async (context, args) => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new Error("Unauthorized");

    // TODO: add a throwIfAlreadyExists or something like that
    const account = await stripe.accounts.create(context, {
      entityId: userId,
      type: "express",
    });

    const link = await stripe.accounts.link(context, {
      refresh_url: `${process.env.SITE_URL}/?create-account-link-refresh=success`,
      return_url: `${process.env.SITE_URL}/?create-account-link-return=success`,
      type: args.type,
      account: account.accountId,
    });

    return link;
  },
});

export const getUserAccount = internalQuery({
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

export const productsCount = internalQuery({
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

export const createProduct = action({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    images: v.optional(v.array(v.string())),
  },
  handler: async (context, args) => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new ConvexError("Unauthorized");

    const account = await context.runQuery(internal.marketplace.getUserAccount);

    if (!account) throw new ConvexError("No account found");

    if (args.images && args.images.length > 8) {
      throw new ConvexError("You can only provide up to 8 images");
    }

    const accountProducts = await context.runQuery(
      internal.marketplace.productsCount,
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
      },
      {
        stripeAccount: account.stripe.id,
      },
    );

    return product;
  },
});
