import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { SubscriptionStripeToConvex } from "@/schema/models/subscription";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: [
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "customer.subscription.paused",
    "customer.subscription.resumed",
    "customer.subscription.pending_update_applied",
    "customer.subscription.pending_update_expired",
    "customer.subscription.trial_will_end",
  ],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.stripeSubscriptions !== true) return;

    const subscription = event.data.object;

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
      case "customer.subscription.pending_update_applied":
      case "customer.subscription.pending_update_expired":
      case "customer.subscription.trial_will_end":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeSubscriptions",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "subscriptionId",
            data: {
              subscriptionId: subscription.id,
              customerId:
                typeof subscription.customer === "string"
                  ? subscription.customer
                  : subscription.customer.id,
              stripe: SubscriptionStripeToConvex(subscription),
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
