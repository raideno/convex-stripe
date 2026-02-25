import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { PaymentMethodStripeToConvex } from "@/schema/models/payment-method";
import { storeDispatchTyped } from "@/store";

export const PaymentMethodsSyncImplementation = defineActionImplementation({
  args: v.object({}),
  name: "paymentMethods",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripePaymentMethods !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localPaymentMethodsRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripePaymentMethods",
      },
      context,
      configuration,
      options,
    );
    const localPaymentMethodsById = new Map(
      (localPaymentMethodsRes.docs || []).map((p) => [p.paymentMethodId, p]),
    );

    const paymentMethods = await stripe.paymentMethods
      .list({ limit: 100 })
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
          },
        },
        context,
        configuration,
        options,
      );
    }

    for (const [paymentMethodId] of localPaymentMethodsById.entries()) {
      if (!stripePaymentMethodIds.has(paymentMethodId)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripePaymentMethods",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "paymentMethodId",
            idValue: paymentMethodId,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
