import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { ProductStripeToConvex } from "@/schema/models/product";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "../types";

export default defineWebhookHandler({
  events: ["product.created", "product.updated", "product.deleted"],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.stripeProducts !== true) return;

    const product = event.data.object;

    switch (event.type) {
      case "product.created":
      case "product.updated":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeProducts",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "productId",
            data: {
              productId: product.id,
              stripe: ProductStripeToConvex(product),
              lastSyncedAt: Date.now(),
            },
          },
          context,
          configuration,
          options,
        );
        break;
      // TODO: careful here as the deletion is just a soft delete in Stripe
      // so maybe we want to keep the record and just mark it as deleted?
      case "product.deleted":
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripeProducts",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "productId",
            idValue: product.id,
          },
          context,
          configuration,
          options,
        );
        break;
    }
  },
});
