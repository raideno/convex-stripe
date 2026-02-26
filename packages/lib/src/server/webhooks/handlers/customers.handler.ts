import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { CustomerStripeToConvex } from "@/schema/models/customer";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: ["customer.created", "customer.updated", "customer.deleted"],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.tables.stripeCustomers !== true) return;

    const customer = event.data.object;
    const entityId = customer.metadata?.entityId as string | undefined;

    switch (event.type) {
      case "customer.created":
      case "customer.updated":
        if (!entityId) {
          options.logger.warn(
            "No entityId associated with newly created customer. Skipping...",
          );
          if (!configuration.detached) "";
        }

        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeCustomers",
            indexName: "byEntityId",
            idField: "entityId",
            data: {
              customerId: customer.id,
              entityId: entityId,
              stripe: CustomerStripeToConvex(customer),
              lastSyncedAt: Date.now(),
              accountId: event.account,
            },
          },
          context,
          configuration,
          options,
        );
        break;
      case "customer.deleted":
        await storeDispatchTyped(
          {
            operation: "deleteById",
            table: "stripeCustomers",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "customerId",
            idValue: customer.id,
          },
          context,
          configuration,
          options,
        );
        break;
    }
  },
});
