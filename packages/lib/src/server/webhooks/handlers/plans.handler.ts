import { BY_STRIPE_ID_INDEX_NAME } from "@/schema";
import { PlanStripeToConvex } from "@/schema/models/plan";
import { storeDispatchTyped } from "@/store";

import { defineWebhookHandler } from "@/webhooks/types";

export default defineWebhookHandler({
  events: ["plan.created", "plan.deleted", "plan.updated"],
  handle: async (event, context, configuration, options) => {
    if (configuration.sync.stripePlans !== true) return;

    const plan = event.data.object;

    switch (event.type) {
      case "plan.created":
      case "plan.updated":
      case "plan.deleted":
        await storeDispatchTyped(
          {
            operation: "upsert",
            table: "stripePlans",
            indexName: BY_STRIPE_ID_INDEX_NAME,
            idField: "planId",
            data: {
              planId: plan.id,
              stripe: PlanStripeToConvex(plan),
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
