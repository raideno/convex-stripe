import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { SetupIntentStripeToConvex } from "@/schema/models/setup-intent";
import { storeDispatchTyped } from "@/store";

export const SetupIntentsSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "setupIntents",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.tables.stripeSetupIntents !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const setupIntents = await stripe.setupIntents
      .list({ limit: 100 }, { stripeAccount: args.accountId })
      .autoPagingToArray({ limit: 10_000 });

    const stripeSetupIntentIds = new Set<string>();

    for (const setupIntent of setupIntents) {
      stripeSetupIntentIds.add(setupIntent.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripeSetupIntents",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "setupIntentId",
          data: {
            setupIntentId: setupIntent.id,
            stripe: SetupIntentStripeToConvex(setupIntent),
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
