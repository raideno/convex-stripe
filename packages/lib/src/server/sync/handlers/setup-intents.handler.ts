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
    if (configuration.sync.stripeSetupIntents !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localSetupIntentsRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripeSetupIntents",
      },
      context,
      configuration,
      options,
    );
    const localSetupIntentsById = new Map(
      (localSetupIntentsRes.docs || []).map((p) => [p.setupIntentId, p]),
    );

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

    for (const [setupIntent] of localSetupIntentsById.entries()) {
      if (!stripeSetupIntentIds.has(setupIntent)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripeSetupIntents",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "setupIntentId",
            idValue: setupIntent,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
