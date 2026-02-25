import { v } from "convex/values";
import Stripe from "stripe";

import { defineActionImplementation } from "@/helpers";
import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { PriceStripeToConvex } from "@/schema/models/price";
import { storeDispatchTyped } from "@/store";

export const PricesSyncImplementation = defineActionImplementation({
  args: v.object({}),
  name: "prices",
  handler: async (context, args, configuration, options) => {
    if (configuration.sync.stripePrices !== true) return;

    const stripe = new Stripe(configuration.stripe.secret_key, {
      apiVersion: "2025-08-27.basil",
    });

    const localPricesRes = await storeDispatchTyped(
      {
        operation: "selectAll",
        table: "stripePrices",
      },
      context,
      configuration,
      options,
    );
    const localPricesById = new Map(
      (localPricesRes.docs || []).map((p) => [p.priceId, p]),
    );

    const prices = await stripe.prices
      .list({ limit: 100, expand: ["data.product"] })
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
          },
        },
        context,
        configuration,
        options,
      );
    }

    for (const [priceId] of localPricesById.entries()) {
      if (!stripePriceIds.has(priceId)) {
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripePrices",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "priceId",
            idValue: priceId,
          },
          context,
          configuration,
          options,
        );
      }
    }
  },
});
