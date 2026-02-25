import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { EarlyFraudWarningStripeToConvex } from "@/schema/models/early-fraud-warning";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: [
    "radar.early_fraud_warning.created",
    "radar.early_fraud_warning.updated",
  ],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.stripeDisputes !== true) return;

    const earlyFraudWarning = event.data.object;

    switch (event.type) {
      case "radar.early_fraud_warning.created":
      case "radar.early_fraud_warning.updated":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeEarlyFraudWarnings",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "earlyFraudWarningId",
            data: {
              earlyFraudWarningId: earlyFraudWarning.id,
              stripe: EarlyFraudWarningStripeToConvex(earlyFraudWarning),
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
