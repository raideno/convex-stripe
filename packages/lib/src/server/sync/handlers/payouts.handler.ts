import Stripe from "stripe";
import { v } from "convex/values";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { PayoutStripeToConvex } from "@/schema/models/payout";
import { storeDispatchTyped } from "@/store";

export const PayoutsSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "payouts",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripePayouts !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localPayoutsRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripePayouts",
      },
      context,
      configuration,
      options,
    );
    const localPayoutsById = new Map(
      (localPayoutsRes.docs || []).map((p) => [p.payoutId, p]),
    );

    const payouts = await stripe.payouts
      .list({ limit: 100 }, { stripeAccount: args.accountId })
      .autoPagingToArray({ limit: 10_000 });

    const stripePayoutIds = new Set<string>();

    for (const payout of payouts) {
      stripePayoutIds.add(payout.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripePayouts",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "payoutId",
          data: {
            payoutId: payout.id,
            stripe: PayoutStripeToConvex(payout),
            lastSyncedAt: Date.now(),
            accountId: args.accountId,
          },
        },
        context,
        configuration,
        options,
      );
    }

    for (const [payoutId] of localPayoutsById.entries()) {
      if (!stripePayoutIds.has(payoutId)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripePayouts",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "payoutId",
            idValue: payoutId,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
