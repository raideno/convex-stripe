import { getAuthUserId } from "@convex-dev/auth/server";
import {
  defineRedirectHandler,
  internalConvexStripe,
} from "@raideno/convex-stripe/server";
import { v } from "convex/values";

import { action, query } from "./_generated/server";
import schema from "./schema";

export const { stripe, store, sync } = internalConvexStripe({
  schema: schema,
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY!,
    account_webhook_secret: process.env.STRIPE_ACCOUNT_WEBHOOK_SECRET!,
    connect_webhook_secret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET!,
  },
  callbacks: {
    afterChange: async (context, operation, event) => {
      console.log("[stripe.afterChange]:", operation, event.table, event._id);
    },
  },
  redirect: {
    handlers: [
      defineRedirectHandler({
        origins: ["testing"] as string[],
        data: {},
        handle: async (origin, context, data, configuration, options) => {
          console.log("testing redirect from", origin);
        },
      }),
    ],
  },
});

export const { createCustomer, subscription } = stripe.helpers({
  authenticateAndAuthorize: async (args) => {
    const userId = await getAuthUserId(args.context);

    if (!userId) return [false, null];

    if (args.entityId && args.entityId !== userId) return [false, null];

    return [true, userId];
  },
});

export const products = query({
  args: {},
  handler: async (context, args) => {
    const prices = await context.db.query("stripePrices").collect();
    const products = await context.db.query("stripeProducts").collect();

    return products.map((product) => ({
      ...product,
      stripe: {
        ...product.stripe,
        default_price: prices.find(
          (price) => price.priceId === product.stripe.default_price,
        ),
      },
      prices: prices.filter(
        (price) => price.stripe.productId === product.productId,
      ),
    }));
  },
});

export const pay = action({
  args: {
    priceId: v.string(),
    accountId: v.optional(v.string()),
  },
  handler: async (context, args): Promise<{ url: string | null }> => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new Error("Unauthorized");

    const checkout = await stripe.pay(
      context,
      {
        referenceId: "#" + Math.floor(Math.random() * 1000),
        entityId: userId,
        mode: "payment",
        line_items: [{ price: args.priceId, quantity: 1 }],
        success_url: `${process.env.SITE_URL}/?return-from-pay=success`,
        cancel_url: `${process.env.SITE_URL}/?return-from-pay=cancel`,
        createStripeCustomerIfMissing: true,
      },
      { stripeAccount: args.accountId },
    );

    return checkout;
  },
});

export const subscribe = action({
  args: {
    priceId: v.string(),
  },
  handler: async (
    context,
    args,
  ): Promise<{
    url: string | null;
  }> => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new Error("Unauthorized");

    const checkout = await stripe.subscribe(context, {
      entityId: userId,
      priceId: args.priceId,
      mode: "subscription",
      success_url: `${process.env.SITE_URL}/?return-from-checkout=success`,
      cancel_url: `${process.env.SITE_URL}/?return-from-checkout=cancel`,
    });

    return checkout;
  },
});

export const payments = query({
  args: v.object({}),
  handler: async (context) => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new Error("Unauthorized");

    const checkouts = await context.db
      .query("stripeCheckoutSessions")
      .filter((query) =>
        query.eq(query.field("stripe.metadata.entityId"), userId),
      )
      .collect();

    return checkouts;
  },
});

export const portal = action({
  args: v.object({}),
  handler: async (
    context,
  ): Promise<{
    url: string | null;
  }> => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new Error("Unauthorized");

    const portal = await stripe.portal(context, {
      entityId: userId,
      return_url: `${process.env.SITE_URL}/?return-from-portal=success`,
    });

    return portal;
  },
});
