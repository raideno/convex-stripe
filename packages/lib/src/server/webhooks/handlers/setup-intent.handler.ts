import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { SetupIntentStripeToConvex } from "@/schema/models/setup-intent";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: [
    "setup_intent.canceled",
    "setup_intent.created",
    "setup_intent.requires_action",
    "setup_intent.setup_failed",
    "setup_intent.succeeded",
  ],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.tables.stripeSetupIntents !== true) return;

    const setupIntent = event.data.object;

    switch (event.type) {
      case "setup_intent.canceled":
      case "setup_intent.created":
      case "setup_intent.requires_action":
      case "setup_intent.setup_failed":
      case "setup_intent.succeeded":
        if (setupIntent.id === undefined) {
          console.error("Received setup intent event with no ID, skipping");
          return;
        }

        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeSetupIntents",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "setupIntentId",
            data: {
              setupIntentId: setupIntent.id,
              stripe: SetupIntentStripeToConvex(setupIntent),
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
