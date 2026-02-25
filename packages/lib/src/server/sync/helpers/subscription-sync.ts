import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { SubscriptionStripeToConvex } from "@/schema/models/subscription";
import { storeDispatchTyped } from "@/store";

export const SubscriptionSyncImplementation = defineActionImplementation({
  args: v.object({
    customerId: v.string(),
    accountId: v.optional(v.string()),
  }),
  name: "syncSubscription",
  handler: async (context, args, configuration, options) => {
    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const customerId = args.customerId;

    const subscriptions = await stripe.subscriptions.list(
      {
        customer: customerId,
        limit: 1,
        status: "all",
        expand: ["data.default_payment_method"],
      },
      { stripeAccount: args.accountId },
    );

    if (subscriptions.data.length === 0) {
      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeSubscriptions",
          indexName: "byCustomerId",
          idField: "customerId",
          data: {
            subscriptionId: null,
            customerId: customerId,
            stripe: null,
            lastSyncedAt: Date.now(),
            accountId: args.accountId,
          },
        },
        context,
        configuration,
        options,
      );

      return null;
    }

    const subscription = subscriptions.data[0];

    await storeDispatchTyped(
      {
        operation: "upsert",
        table: "stripeSubscriptions",
        indexName: "byCustomerId",
        idField: "customerId",
        data: {
          accountId: args.accountId,
          subscriptionId: subscription.id,
          customerId: customerId,
          stripe: SubscriptionStripeToConvex(subscription),
          lastSyncedAt: Date.now(),
        },
      },
      context,
      configuration,
      options,
    );

    return subscription;
  },
});
