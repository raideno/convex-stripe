import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { PaymentMethodStripeToConvex } from "@/schema/models/payment-method";
import { storeDispatchTyped } from "@/store";

export const PaymentMethodsSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "paymentMethods",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.tables.stripePaymentMethods !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const paymentMethods = await stripe.paymentMethods
      .list({ limit: 100 }, { stripeAccount: args.accountId })
      .autoPagingToArray({ limit: 10_000 });

    const stripePaymentMethodIds = new Set<string>();

    for (const paymentMethod of paymentMethods) {
      stripePaymentMethodIds.add(paymentMethod.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripePaymentMethods",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "paymentMethodId",
          data: {
            paymentMethodId: paymentMethod.id,
            stripe: PaymentMethodStripeToConvex(paymentMethod),
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
