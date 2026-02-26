import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { DisputeStripeToConvex } from "@/schema/models/dispute";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: [
    "charge.dispute.created",
    "charge.dispute.updated",
    "charge.dispute.closed",
    "charge.dispute.funds_reinstated",
    "charge.dispute.funds_withdrawn",
  ],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.tables.stripeDisputes !== true) return;

    const dispute = event.data.object;

    switch (event.type) {
      case "charge.dispute.funds_withdrawn":
      case "charge.dispute.created":
      case "charge.dispute.updated":
      case "charge.dispute.closed":
      case "charge.dispute.funds_reinstated":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeDisputes",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "disputeId",
            data: {
              disputeId: dispute.id,
              stripe: DisputeStripeToConvex(dispute),
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
