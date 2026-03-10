import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { ProductStripeToConvex } from "@/schema/models/product";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: ["product.created", "product.updated", "product.deleted"],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.tables.stripeProducts !== true) return;

    const product = event.data.object;

    switch (event.type) {
      case "product.created":
      case "product.updated":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeProducts",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            indexValues: { productId: product.id },
            data: {
              productId: product.id,
              stripe: ProductStripeToConvex(product),
              lastSyncedAt: Date.now(),
              accountId: event.account,
            },
          },
          context,
          configuration,
          options,
        );
        break;
      case "product.deleted":
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripeProducts",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            indexValues: { productId: product.id },
          },
          context,
          configuration,
          options,
        );
        break;
    }
  },
});
