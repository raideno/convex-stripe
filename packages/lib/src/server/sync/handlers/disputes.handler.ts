import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { DisputeStripeToConvex } from "@/schema/models/dispute";
import { storeDispatchTyped } from "@/store";

export const DisputesSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "disputes",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.tables.stripeDisputes !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const disputes = await stripe.disputes
      .list({ limit: 100 }, { stripeAccount: args.accountId })
      .autoPagingToArray({ limit: 10_000 });

    const stripeDisputeIds = new Set<string>();

    for (const dispute of disputes) {
      stripeDisputeIds.add(dispute.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeDisputes",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "disputeId",
          data: {
            disputeId: dispute.id,
            stripe: DisputeStripeToConvex(dispute),
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
