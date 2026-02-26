import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { ChargeStripeToConvex } from "@/schema/models/charge";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: [
    "charge.captured",
    "charge.expired",
    "charge.failed",
    "charge.pending",
    "charge.refunded",
    "charge.succeeded",
    "charge.updated",
  ],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.tables.stripeCharges !== true) return;

    const charge = event.data.object;

    switch (event.type) {
      case "charge.captured":
      case "charge.expired":
      case "charge.failed":
      case "charge.pending":
      case "charge.refunded":
      case "charge.succeeded":
      case "charge.updated":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeCharges",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "chargeId",
            data: {
              chargeId: charge.id,
              stripe: ChargeStripeToConvex(charge),
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
