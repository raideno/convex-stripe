import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { PaymentIntentStripeToConvex } from "@/schema/models/payment-intent";
import { storeDispatchTyped } from "@/store";

export const PaymentIntentsSyncImplementation = defineActionImplementation({
  args: v.object({}),
  name: "paymentIntents",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripePaymentIntents !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localPaymentIntentsRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripePaymentIntents",
      },
      context,
      configuration,
      options,
    );
    const localPaymentIntentsById = new Map(
      (localPaymentIntentsRes.docs || []).map((p) => [p.paymentIntentId, p]),
    );

    const paymentIntents = await stripe.paymentIntents
      .list({ limit: 100 })
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
          },
        },
        context,
        configuration,
        options,
      );
    }

    for (const [paymentIntentId] of localPaymentIntentsById.entries()) {
      if (!stripePaymentIntentIds.has(paymentIntentId)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripePaymentIntents",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "paymentIntentId",
            idValue: paymentIntentId,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
