import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { storeDispatchTyped } from "@/store";

import { CapabilityStripeToConvex } from "@/schema/models/capability";
import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: ["capability.updated"],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.tables.stripeAccounts !== true) return;

    const capability = event.data.object;

    switch (event.type) {
      case "capability.updated":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeCapabilities",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "capabilityId",
            data: {
              capabilityId: capability.id,
              stripe: CapabilityStripeToConvex(capability),
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
