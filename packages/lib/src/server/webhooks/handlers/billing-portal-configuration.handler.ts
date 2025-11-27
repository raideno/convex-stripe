import { BillingPortalConfigurationStripeToConvex } from "@/schema/models/billing-portal-configuration";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "../types";

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
            idField: "billingPortalConfigurationId",
            data: {
              billingPortalConfigurationId: billingPortalConfiguration.id,
              stripe: BillingPortalConfigurationStripeToConvex(
                billingPortalConfiguration
              ),
              lastSyncedAt: Date.now(),
            },
          },
          context,
          configuration,
          options
        );
        break;
    }
  },
});
