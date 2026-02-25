import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { BillingPortalConfigurationStripeToConvex } from "@/schema/models/billing-portal-configuration";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: [
    "billing_portal.configuration.created",
    "billing_portal.configuration.updated",
  ],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.stripeProducts !== true) return;

    const billingPortalConfiguration = event.data.object;

    switch (event.type) {
      case "billing_portal.configuration.created":
      case "billing_portal.configuration.updated":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeBillingPortalConfigurations",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "billingPortalConfigurationId",
            data: {
              billingPortalConfigurationId: billingPortalConfiguration.id,
              stripe: BillingPortalConfigurationStripeToConvex(
                billingPortalConfiguration,
              ),
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
