import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { PriceStripeToConvex } from "@/schema/models/price";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: ["price.created", "price.updated", "price.deleted"],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.stripePrices !== true) return;

    const price = event.data.object;

    switch (event.type) {
      case "price.created":
      case "price.updated":
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
              accountId: event.account,
            },
          },
          context,
          configuration,
          options,
        );
        break;
      // TODO: careful here as the deletion is just a soft delete in Stripe
      // so maybe we want to keep the record and just mark it as deleted?
      case "price.deleted":
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripePrices",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "priceId",
            idValue: price.id,
          },
          context,
          configuration,
          options,
        );
        break;
    }
  },
});
