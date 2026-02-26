import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { storeDispatchTyped } from "@/store";

import { TransferStripeToConvex } from "@/schema/models/transfer";
import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: [
    "transfer.created",
    "transfer.updated",
    "transfer.reversed",

    // TODO: what are treasury stuff ?
    // "treasury.credit_reversal.created"
  ],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.tables.stripeAccounts !== true) return;

    const transfer = event.data.object;

    switch (event.type) {
      case "transfer.created":
      case "transfer.updated":
      case "transfer.reversed":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeTransfers",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "transferId",
            data: {
              accountId: event.account,
              transferId: transfer.id,
              stripe: TransferStripeToConvex(transfer),
              lastSyncedAt: Date.now(),
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
