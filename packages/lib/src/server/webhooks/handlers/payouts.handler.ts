import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { PayoutStripeToConvex } from "@/schema/models/payout";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: [
    "payout.canceled",
    "payout.created",
    "payout.failed",
    "payout.paid",
    "payout.reconciliation_completed",
    "payout.updated",
  ],
  handle: async (event, context, configuration, option) => {
    if (configuration.sync.tables.stripePayouts !== true) return;

    const payout = event.data.object;

    switch (event.type) {
      case "payout.updated":
      case "payout.canceled":
      case "payout.created":
      case "payout.failed":
      case "payout.paid":
      case "payout.reconciliation_completed":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripePayouts",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "payoutId",
            data: {
              payoutId: payout.id,
              stripe: PayoutStripeToConvex(payout),
              lastSyncedAt: Date.now(),
              accountId: event.account,
            },
          },
          context,
          configuration,
          option,
        );
        break;
    }
  },
});
