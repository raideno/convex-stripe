import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { RefundStripeToConvex } from "@/schema/models/refund";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: [
    "refund.created",
    "refund.failed",
    "refund.updated",
    "charge.refund.updated",
  ],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.tables.stripeRefunds !== true) return;

    const refund = event.data.object;

    switch (event.type) {
      case "refund.created":
      case "refund.updated":
      case "refund.failed":
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
              accountId: event.account,
            },
          },
          context,
          configuration,
          options,
        );
        break;
    }
  },
});
