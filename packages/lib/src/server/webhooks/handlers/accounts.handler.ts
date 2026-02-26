import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { storeDispatchTyped } from "@/store";

import { AccountStripeToConvex } from "@/schema/models/account";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: [
    // "account.application.authorized",
    // "account.application.deauthorized",
    // "account.external_account.created",
    // "account.external_account.deleted",
    // "account.external_account.updated",
    "account.updated",

    // "treasury.financial_account.closed",
    // "treasury.financial_account.created",
    // "treasury.financial_account.features_status_updated",

    // "financial_connections.account.created",
    // "financial_connections.account.created",
  ],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.tables.stripeAccounts !== true) return;

    const account = event.data.object;
    const entityId = account.metadata?.entityId;

    switch (event.type) {
      case "account.updated":
        if (!entityId) {
          options.logger.warn(
            "No entityId associated with newly created customer. Skipping...",
          );
          if (!configuration.detached) "";
        }

        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeAccounts",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "accountId",
            data: {
              accountId: account.id,
              entityId: entityId,
              stripe: AccountStripeToConvex(account),
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
