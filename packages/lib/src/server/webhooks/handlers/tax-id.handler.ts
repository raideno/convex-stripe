import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { TaxIdStripeToConvex } from "@/schema/models/tax-id";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: [
    "customer.tax_id.created",
    "customer.tax_id.deleted",
    "customer.tax_id.updated",
  ],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.tables.stripeTaxIds !== true) return;

    const taxId = event.data.object;

    switch (event.type) {
      case "customer.tax_id.created":
      case "customer.tax_id.deleted":
      case "customer.tax_id.updated":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeTaxIds",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "taxIdId",
            data: {
              taxIdId: taxId.id,
              stripe: TaxIdStripeToConvex(taxId),
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
