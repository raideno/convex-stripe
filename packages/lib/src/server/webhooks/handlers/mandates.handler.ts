import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { MandateStripeToConvex } from "@/schema/models/mandate";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: ["mandate.updated"],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.tables.stripeMandates !== true) return;

    const mandate = event.data.object;

    switch (event.type) {
      case "mandate.updated":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeMandates",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "mandateId",
            data: {
              mandateId: mandate.id,
              stripe: MandateStripeToConvex(mandate),
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
