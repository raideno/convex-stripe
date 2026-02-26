import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { PaymentIntentStripeToConvex } from "@/schema/models/payment-intent";
import { storeDispatchTyped } from "@/store";

export const PaymentIntentsSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "paymentIntents",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.tables.stripePaymentIntents !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const paymentIntents = await stripe.paymentIntents
      .list({ limit: 100 }, { stripeAccount: args.accountId })
      .autoPagingToArray({ limit: 10_000 });

    const stripePaymentIntentIds = new Set<string>();

    for (const paymentIntent of paymentIntents) {
      stripePaymentIntentIds.add(paymentIntent.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripePaymentIntents",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "paymentIntentId",
          data: {
            paymentIntentId: paymentIntent.id,
            stripe: PaymentIntentStripeToConvex(paymentIntent),
            lastSyncedAt: Date.now(),
            accountId: args.accountId,
          },
        },
        context,
        configuration,
        options,
      );
    }
  },
});
