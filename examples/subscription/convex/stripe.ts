import { getAuthUserId } from "@convex-dev/auth/server";
import {
  defineRedirectHandler,
  internalConvexStripe,
} from "@raideno/convex-stripe/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import {
  action,
  internalAction,
  internalMutation,
  query,
} from "./_generated/server";
import schema from "./schema";

export const { stripe, store, sync } = internalConvexStripe({
  schema: schema,
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY!,
    account_webhook_secret: process.env.STRIPE_ACCOUNT_WEBHOOK_SECRET!,
    connect_webhook_secret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET!,
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

export const { createCustomer, products, subscription, subscribe, portal } =
  stripe.helpers({
    authenticateAndAuthorize: async (args) => {
      const userId = await getAuthUserId(args.context);

      if (!userId) return [false, null];

      if (args.entityId && args.entityId !== userId) return [false, null];

      return [true, null];
    },
    urls: {
      subscribe: {
        success: "https://example.com/success",
        cancel: "https://example.com/cancel",
        failure: "https://example.com/failure",
      },
      portal: {
        return: "https://example.com/portal-return",
        failure: "https://example.com/portal-failure",
      },
      pay: {
        success: "https://example.com/pay-success",
        cancel: "https://example.com/pay-cancel",
        failure: "https://example.com/pay-failure",
      },
    },
  });

export const createInternalPaymentRecord = internalMutation({
  args: {
    priceId: v.string(),
    checkoutSessionId: v.string(),
    userId: v.id("users"),
  },
  handler: async (context, args) => {
    await context.db.insert("payments", {
      priceId: args.priceId,
      userId: args.userId,
      checkoutSessionId: args.checkoutSessionId,
    });
  },
});

export const pay = action({
  args: {
    priceId: v.string(),
  },
  handler: async (context, args): Promise<{ url: string | null }> => {
    const userId = await getAuthUserId(context);

    if (!userId) throw new Error("Unauthorized");

    // TODO: shouldn't be done this way, add entityId to it or something
    const orderId = "#" + Math.floor(Math.random() * 1000);

    const checkout = await stripe.pay(context as any, {
      referenceId: orderId,
      entityId: userId,
      mode: "payment",
      line_items: [{ price: args.priceId, quantity: 1 }],
      success_url: `${process.env.SITE_URL}/?return-from-pay=success`,
      cancel_url: `${process.env.SITE_URL}/?return-from-pay=cancel`,
    });

    await context.runMutation(internal.stripe.createInternalPaymentRecord, {
      priceId: args.priceId,
      checkoutSessionId: checkout.id,
      userId: userId,
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

    const payments = (
      await context.db
        .query("payments")
        .withIndex("byUserId", (q) => q.eq("userId", userId))
        .collect()
    ).map((payment) => ({
      ...payment,
      checkout:
        checkouts.find(
          (checkout) =>
            checkout.checkoutSessionId === payment.checkoutSessionId,
        ) || null,
    }));

    return payments;
  },
});
