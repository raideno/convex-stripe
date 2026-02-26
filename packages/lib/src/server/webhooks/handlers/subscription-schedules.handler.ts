import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { SubscriptionScheduleStripeToConvex } from "@/schema/models/subscription-schedule";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: [
    "subscription_schedule.aborted",
    "subscription_schedule.canceled",
    "subscription_schedule.completed",
    "subscription_schedule.created",
    "subscription_schedule.expiring",
    "subscription_schedule.released",
    "subscription_schedule.updated",
  ],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.tables.stripeSubscriptionSchedules !== true) return;

    const subscriptionSchedule = event.data.object;

    switch (event.type) {
      case "subscription_schedule.aborted":
      case "subscription_schedule.canceled":
      case "subscription_schedule.completed":
      case "subscription_schedule.created":
      case "subscription_schedule.expiring":
      case "subscription_schedule.released":
      case "subscription_schedule.updated":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripeSubscriptionSchedules",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "subscriptionScheduleId",
            data: {
              subscriptionScheduleId: subscriptionSchedule.id,
              stripe: SubscriptionScheduleStripeToConvex(subscriptionSchedule),
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
