import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { PriceStripeToConvex } from "@/schema/models/price";
import { storeDispatchTyped } from "@/store";

export const PricesSyncImplementation = defineActionImplementation({
  args: v.object({
    accountId: v.optional(v.string()),
  }),
  name: "prices",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.tables.stripePrices !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: configuration.stripe.version,
    });

    const prices = await stripe.prices
      .list(
        { limit: 100, expand: ["data.product"] },
        { stripeAccount: args.accountId },
      )
      .autoPagingToArray({ limit: 10_000 });

    const stripePriceIds = new Set<string>();

    for (const price of prices) {
      stripePriceIds.add(price.id);

      await storeDispatchTyped(
        {
          operation: "upsert",
          table: "stripePrices",
          indexName: BY_STRIPE_ID_INDEX_NAME,
          idField: "priceId",
          data: {
            priceId: price.id,
            stripe: PriceStripeToConvex(price),
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
