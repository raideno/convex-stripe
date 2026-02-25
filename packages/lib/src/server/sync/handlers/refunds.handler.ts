import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { RefundStripeToConvex } from "@/schema/models/refund";
import { storeDispatchTyped } from "@/store";

export const RefundsSyncImplementation = defineActionImplementation({
  args: v.object({}),
  name: "refunds",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripeRefunds !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localRefundsRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripeRefunds",
      },
      context,
      configuration,
      options,
    );
    const localRefundsById = new Map(
      (localRefundsRes.docs || []).map((p) => [p.refundId, p]),
    );

    const refunds = await stripe.refunds
      .list({ limit: 100 })
      .autoPagingToArray({ limit: 10_000 });

    const stripeRefundIds = new Set<string>();

    for (const refund of refunds) {
      stripeRefundIds.add(refund.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeRefunds",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "refundId",
          data: {
            refundId: refund.id,
            stripe: RefundStripeToConvex(refund),
            lastSyncedAt: Date.now(),
          },
        },
        context,
        configuration,
        options,
      );
    }

    for (const [refundId] of localRefundsById.entries()) {
      if (!stripeRefundIds.has(refundId)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripeRefunds",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "refundId",
            idValue: refundId,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
